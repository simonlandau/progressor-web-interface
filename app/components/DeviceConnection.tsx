"use client";

import { useState, useEffect, useCallback } from "react";
import { FaBluetooth, FaBluetoothB, FaBatteryHalf, FaSync } from "react-icons/fa";
import { tindeqService, DeviceInfo } from "../utils/bluetooth";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DeviceConnectionProps {
  onConnectionChange: (connected: boolean) => void;
}

export default function DeviceConnection({ onConnectionChange }: DeviceConnectionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({});
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const handleConnect = useCallback(async () => {
    setError(null);
    setIsConnecting(true);

    try {
      if (!navigator.bluetooth) {
        throw new Error("Web Bluetooth API is not supported in this browser");
      }

      await tindeqService.connect();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to connect");
      setIsConnecting(false);
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    await tindeqService.disconnect();
  }, []);

  // Auto-reconnect logic
  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout | null = null;

    if (!isConnected && reconnectAttempts > 0 && reconnectAttempts < 3) {
      console.log(`Attempting to reconnect (attempt ${reconnectAttempts})...`);
      reconnectTimer = setTimeout(() => {
        handleConnect();
      }, 2000);
    }

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [isConnected, reconnectAttempts, handleConnect]);

  useEffect(() => {
    tindeqService.setOnConnectionChangeCallback((connected) => {
      setIsConnected(connected);
      setIsConnecting(false);
      onConnectionChange(connected);

      // If we were connected and suddenly disconnected, try to reconnect
      if (!connected && isConnected) {
        console.log("Device disconnected unexpectedly, attempting to reconnect...");
        setReconnectAttempts((prev) => prev + 1);
      } else if (connected) {
        // Reset reconnect attempts when successfully connected
        setReconnectAttempts(0);
      }
    });

    tindeqService.setOnDeviceInfoCallback((info) => {
      setDeviceInfo(info);
    });

    tindeqService.setOnErrorCallback((error) => {
      setError(error.message);
      setIsConnecting(false);
    });

    return () => {
      // Clean up
      if (isConnected) {
        tindeqService.disconnect();
      }
    };
  }, [onConnectionChange, isConnected]);

  const handleManualReconnect = () => {
    setReconnectAttempts(0);
    handleConnect();
  };

  return (
    <Card className="w-full max-w-md mx-auto mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-xl">
            {isConnected ? <FaBluetoothB className="mr-2 text-blue-500" /> : <FaBluetooth className="mr-2 text-gray-400" />}
            Tindeq Progressor
          </CardTitle>

          {isConnected && deviceInfo.batteryVoltage && (
            <div className="flex items-center text-sm">
              <FaBatteryHalf className="mr-1" />
              <span>{(deviceInfo.batteryVoltage / 1000).toFixed(2)}V</span>
            </div>
          )}
        </div>
        {deviceInfo.firmwareVersion && <div className="text-sm text-muted-foreground mt-1">Firmware: {deviceInfo.firmwareVersion}</div>}
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm">
            {error}
            {!isConnected && (
              <Button variant="link" size="sm" onClick={handleManualReconnect} className="ml-1 p-0 h-auto text-blue-600 dark:text-blue-400">
                <FaSync size={12} />
                <span>Retry</span>
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-center pt-2">
        {!isConnected ? (
          <Button onClick={handleConnect} disabled={isConnecting} variant={isConnecting ? "outline" : "default"} className="rounded-full">
            {isConnecting ? "Connecting..." : "Connect Device"}
          </Button>
        ) : (
          <Button onClick={handleDisconnect} variant="destructive" className="rounded-full">
            Disconnect
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
