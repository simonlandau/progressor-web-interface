"use client";

import { FaBluetooth, FaBluetoothB, FaBatteryHalf, FaSync } from "react-icons/fa";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTindeq } from "../hooks/useTindeq";

export default function DeviceConnection() {
  const { isConnected, isConnecting, deviceInfo, error, connect, disconnect, handleManualReconnect, tareScale, isMeasuring } = useTindeq();

  return (
    <Card className="w-full max-w-md mx-auto mb-6 min-h-[160px]">
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
                <FaSync size={12} className="mr-1" />
                <span>Retry</span>
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-center gap-3 pt-2">
        {!isConnected ? (
          <Button onClick={connect} disabled={isConnecting} variant={isConnecting ? "outline" : "default"} className="rounded-full">
            {isConnecting ? "Connecting..." : "Connect Device"}
          </Button>
        ) : (
          <>
            <Button onClick={tareScale} disabled={isMeasuring} variant="secondary" className="rounded-full">
              Tare
            </Button>
            <Button onClick={disconnect} variant="destructive" className="rounded-full">
              Disconnect
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
