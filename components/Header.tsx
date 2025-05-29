import * as React from "react";
import { FaBluetooth } from "react-icons/fa";
import { Weight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ModeToggle } from "./ModeToggle";
import DeviceConnection from "@/app/components/DeviceConnection";

export function Header() {
  return (
    <header className="w-full border-b border-border bg-background">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Weight className="h-6 w-6 text-foreground" />
          <h1 className="text-2xl font-semibold text-foreground">Progressor Interface</h1>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="w-10 h-10">
                <FaBluetooth className="h-4 w-4" />
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
