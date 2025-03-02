"use client";

import { FaPlay, FaStop, FaRedo, FaFlag, FaCheck, FaTimes } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTindeq } from "../hooks/useTindeq";
import { useForceChart } from "../hooks/useForceChart";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, annotationPlugin);

export default function ForceMeasurement() {
  const {
    isConnected,
    isMeasuring,
    currentForce,
    maxForce,
    measurements,
    startTime,
    error,
    elapsedTime,
    startMeasurement,
    stopMeasurement,
    resetMeasurements,
    getElapsedTime,
    checkpointValue,
    setCheckpointValue,
  } = useTindeq();

  const [checkpointInput, setCheckpointInput] = useState<string>(checkpointValue?.toString() || "");

  const { chartData, chartOptions, checkpointStatus } = useForceChart(measurements, startTime, elapsedTime, maxForce, checkpointValue, currentForce);

  const handleCheckpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCheckpointInput(e.target.value);
  };

  const handleCheckpointSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const value = parseFloat(checkpointInput);
    if (!isNaN(value) && value > 0) {
      setCheckpointValue(value);
    } else {
      setCheckpointValue(null);
      setCheckpointInput("");
    }
  };

  const handleClearCheckpoint = () => {
    setCheckpointValue(null);
    setCheckpointInput("");
  };

  const displayTime = isMeasuring ? `${getElapsedTime()} s` : elapsedTime > 0 ? `${elapsedTime.toFixed(1)} s` : "-";

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex space-x-4">
              <div className="w-24">
                <span className="text-sm text-muted-foreground">Time</span>
                <div className="text-3xl font-bold">{displayTime}</div>
              </div>
              <div className="w-28">
                <span className="text-sm text-muted-foreground">Current</span>
                <div className="text-3xl font-bold">{currentForce !== null ? `${currentForce.toFixed(1)} kg` : "-"}</div>
              </div>
              <div className="w-28">
                <span className="text-sm text-muted-foreground">Max</span>
                <div className="text-3xl font-bold text-muted-foreground">{maxForce !== null ? `${maxForce.toFixed(1)} kg` : "-"}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-2 items-start">
            <div className="flex space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="default">
                    <FaFlag className="mr-2" />
                    <span>{checkpointValue !== null ? `Target ${checkpointValue.toFixed(1)} kg` : "Set Target"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-3">
                  <div className="space-y-2">
                    <Label htmlFor="checkpoint-dropdown" className="text-xs">
                      Target Force (kg)
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                        id="checkpoint-dropdown"
                        type="number"
                        min="0"
                        step="0.1"
                        value={checkpointInput}
                        onChange={handleCheckpointChange}
                        className="w-full"
                        placeholder="kg"
                      />
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <Button type="button" variant="default" size="sm" className="w-full" onClick={() => handleCheckpointSubmit()}>
                        <FaCheck className="mr-1" />
                        Set
                      </Button>
                      {checkpointValue !== null && (
                        <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleClearCheckpoint}>
                          <FaTimes className="mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={resetMeasurements}
                disabled={isMeasuring || (elapsedTime === 0 && maxForce === null)}
                variant="secondary"
                size="default"
              >
                <FaRedo className="mr-2" />
                <span>Reset</span>
              </Button>

              {!isMeasuring ? (
                <Button onClick={startMeasurement} disabled={!isConnected} variant={!isConnected ? "outline" : "default"}>
                  <FaPlay className="mr-2" />
                  <span>Start</span>
                </Button>
              ) : (
                <Button onClick={stopMeasurement} variant="destructive">
                  <FaStop className="mr-2" />
                  <span>Stop</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm">{error}</div>}

        {checkpointStatus && (
          <div className={`mb-4 mt-2 p-3 rounded-md text-sm flex items-center justify-between ${checkpointStatus.className}`}>
            <span>
              Target <strong>{checkpointValue?.toFixed(1)} kg</strong> | Distance <strong>{checkpointStatus.distance.toFixed(1)} kg</strong>
            </span>
            <span>{checkpointStatus.message}</span>
          </div>
        )}

        <div className="h-64 md:h-80 mt-6">
          <Line data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  );
}
