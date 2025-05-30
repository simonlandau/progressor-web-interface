"use client";

import { FaBluetooth, FaBluetoothB, FaBatteryHalf, FaSync } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import useTindeqStore from "../store/tindeqStore";

export default function DeviceConnection() {
  const { isConnected, isConnecting, deviceInfo, error, connect, disconnect, handleManualReconnect, tareScale, isMeasuring } = useTindeqStore();

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-lg font-medium">
          {isConnected ? <FaBluetoothB className="mr-2 text-blue-500" /> : <FaBluetooth className="mr-2 text-gray-400" />}
          Tindeq Progressor
        </div>

        {isConnected && deviceInfo.batteryVoltage && (
          <div className="flex items-center text-sm text-muted-foreground">
            <FaBatteryHalf className="mr-1" />
            <span>{(deviceInfo.batteryVoltage / 1000).toFixed(2)}V</span>
          </div>
        )}
      </div>

      {deviceInfo.firmwareVersion && <div className="text-sm text-muted-foreground">Firmware: {deviceInfo.firmwareVersion}</div>}

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm">
          {error}
          {!isConnected && (
            <Button variant="link" size="sm" onClick={handleManualReconnect} className="ml-1 p-0 h-auto text-blue-600 dark:text-blue-400">
              <FaSync size={12} className="mr-1" />
              <span>Retry</span>
            </Button>
          )}
        </div>
      )}

      <div className="flex justify-center gap-3">
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
      </div>
    </div>
  );
}
