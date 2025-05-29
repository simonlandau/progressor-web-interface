"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ForceMeasurement from "./ForceMeasurement";
import Program from "./Program";
import { FaDumbbell, FaListAlt } from "react-icons/fa";
import useTindeqStore from "../store/tindeqStore";

export default function MeasurementTabs() {
  const [activeTab, setActiveTab] = useState("force");
  const { isConnected } = useTindeqStore();

  return (
    <div className="space-y-4">
      <Tabs defaultValue="force" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="force" className="flex items-center justify-center">
            <FaDumbbell className="mr-2" />
            <span>Live Measurement</span>
          </TabsTrigger>
          <TabsTrigger value="program" className="flex items-center justify-center">
            <FaListAlt className="mr-2" />
            <span>Programs</span>
          </TabsTrigger>
        </TabsList>
        <div className="relative">
          <TabsContent value="force" className="mt-4">
            <ForceMeasurement />
          </TabsContent>
          <TabsContent value="program" className="mt-4">
            <Program />
          </TabsContent>

          {!isConnected && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm"></div>
              <div className="relative z-20 text-center">
                <p className="text-lg font-medium text-foreground">Click on the bluetooth button to connect your device</p>
              </div>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}
