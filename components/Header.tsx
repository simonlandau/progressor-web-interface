"use client";

import * as React from "react";
import { FaBluetooth } from "react-icons/fa";
import { Weight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ModeToggle } from "./ModeToggle";
import { SettingsButton } from "./SettingsButton";
import DeviceConnection from "@/app/components/DeviceConnection";
import useTindeqStore from "@/app/store/tindeqStore";

export function Header() {
  const { isConnected, isConnecting } = useTindeqStore();

  return (
    <header className="w-full border-b border-border bg-background">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Weight className="h-6 w-6 text-foreground" />
          <h1 className="text-2xl font-semibold text-foreground">Progressor Interface</h1>
        </div>

        <div className="flex items-center gap-2">
          <SettingsButton />

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`w-10 h-10 relative ${
                  isConnected
                    ? "border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                    : isConnecting
                    ? "border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                    : ""
                }`}
              >
                <FaBluetooth className={`h-4 w-4 ${isConnected ? "text-green-600" : isConnecting ? "text-blue-600" : ""}`} />
                {isConnected && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>}
                {isConnecting && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-background animate-pulse"></div>
                )}
                <span className="sr-only">Bluetooth controls</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="w-80 p-0">
              <DeviceConnection />
            </PopoverContent>
          </Popover>

          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
