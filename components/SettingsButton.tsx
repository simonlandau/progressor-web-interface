"use client";

import * as React from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UNITS, Unit } from "@/app/utils/units";
import useSettingsStore from "@/app/store/settingsStore";

export function SettingsButton() {
  const { unit, setUnit } = useSettingsStore();

  const handleUnitChange = (value: Unit) => {
    setUnit(value);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="w-10 h-10">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-64 p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Settings</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Force Units</Label>
                <Select value={unit} onValueChange={handleUnitChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">
                      {UNITS.kg.label} ({UNITS.kg.symbol})
                    </SelectItem>
                    <SelectItem value="lbs">
                      {UNITS.lbs.label} ({UNITS.lbs.symbol})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
