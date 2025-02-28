"use client";

import { FaPlay, FaStop, FaRedo, FaTrash, FaFlag, FaCheck, FaTimes } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTindeq } from "../hooks/useTindeq";
import { MeasurementData } from "../../types/tindeq";
import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const CHECKPOINT_TOLERANCE = 1;
const CHECKPOINT_TOLERANCE_WARNING = 3;

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
    tareScale,
    resetMeasurements,
    getElapsedTime,
    checkpointValue,
    setCheckpointValue,
  } = useTindeq();

  const [checkpointInput, setCheckpointInput] = useState<string>(checkpointValue?.toString() || "");

  // Handle checkpoint input change
  const handleCheckpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCheckpointInput(e.target.value);
  };

  // Handle checkpoint form submission
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

  // Handle clearing the checkpoint
  const handleClearCheckpoint = () => {
    setCheckpointValue(null);
    setCheckpointInput("");
  };

  // Format the time display - show elapsed time even when not measuring
  const displayTime = isMeasuring ? `${getElapsedTime()} s` : elapsedTime > 0 ? `${elapsedTime.toFixed(1)} s` : "-";

  // Get checkpoint line color based on proximity to current force
  const getCheckpointLineColor = () => {
    if (checkpointValue === null || currentForce === null) return "rgba(200, 200, 200, 0.5)";

    const distance = Math.abs(currentForce - checkpointValue);

    if (distance <= CHECKPOINT_TOLERANCE) return "rgba(34, 197, 94, 0.7)"; // Green when within 2kg
    if (distance <= CHECKPOINT_TOLERANCE_WARNING) return "rgba(234, 179, 8, 0.7)"; // Yellow when within 5kg
    return "rgba(239, 68, 68, 0.7)"; // Red when more than 10kg away
  };

  // Memoize expensive calculations
  const chartData = useMemo(
    () => ({
      labels: measurements.map((m, i, arr) => {
        // If we have a startTime, use it as the reference point
        if (startTime) {
          return ((m.timestamp - startTime) / 1000000).toFixed(1);
        }
        // If no startTime but we have measurements, use the first measurement as reference
        else if (arr.length > 0) {
          const firstMeasurement = arr[0];
          const relativeTime = (m.timestamp - firstMeasurement.timestamp) / 1000000;
          // Add the elapsed time that was accumulated before this measurement session
          return (relativeTime + (elapsedTime - relativeTime)).toFixed(1);
        }
        // Fallback
        return "0.0";
      }),
      datasets: [
        {
          label: "Force (kg)",
          data: measurements.map((m) => m.weight),
          borderColor: "rgb(255, 255, 255)",
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          tension: 0.2,
        },
      ],
    }),
    [measurements, startTime, elapsedTime]
  );

  const chartOptions = useMemo(() => {
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0, // Disable animation for better performance with live data
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 20, // Default maximum of 20kg
          max: calculateYAxisMax(measurements, maxForce),
          title: {
            display: true,
            text: "Force (kg)",
          },
        },
        x: {
          title: {
            display: true,
            text: "Time (s)",
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: "Force Measurement",
        },
      },
    };

    // Only add annotation if we have a checkpoint value
    if (checkpointValue !== null) {
      // @ts-expect-error - Type issues with chartjs-plugin-annotation
      options.plugins.annotation = {
        annotations: {
          checkpointLine: {
            type: "line" as const,
            yMin: checkpointValue,
            yMax: checkpointValue,
            borderColor: getCheckpointLineColor(),
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: true,
              content: `Target ${checkpointValue} kg`,
              position: "end",
              backgroundColor: getCheckpointLineColor(),
              color: "white",
              font: {
                weight: "bold",
              },
            },
          },
        },
      };
    }

    return options;
  }, [measurements, maxForce, checkpointValue, getCheckpointLineColor]);

  // Calculate the y-axis maximum based on current measurements
  function calculateYAxisMax(measurements: MeasurementData[], maxForce: number | null): number | undefined {
    // Default to 20kg if no measurements or maxForce
    if (!measurements.length || maxForce === null) {
      return 20;
    }

    // Get the highest force value from measurements
    const highestMeasurement = Math.max(...measurements.map((m) => m.weight));

    // If we have a checkpoint, make sure it's visible
    const checkpointAdjustment = checkpointValue ? Math.max(0, checkpointValue - highestMeasurement) : 0;

    // If we're approaching the current max (within 80%), increase the max by 25%
    if (highestMeasurement > 16 || checkpointAdjustment > 0) {
      // 80% of default 20kg
      const newMax = Math.ceil((highestMeasurement + checkpointAdjustment) * 1.25);
      return Math.max(newMax, 20); // Never go below 20kg
    }

    return 20; // Default to 20kg
  }

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="mb-4 md:mb-0">
            <CardTitle className="mb-2">Force Measurement</CardTitle>
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

          <div className="flex flex-col space-y-2 items-end">
            <div className="flex space-x-2">
              <Button
                onClick={resetMeasurements}
                disabled={isMeasuring || (elapsedTime === 0 && maxForce === null)}
                variant="secondary"
                size="default"
              >
                <FaTrash className="mr-2" />
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

              <Button onClick={tareScale} disabled={!isConnected || isMeasuring} variant="secondary" size="default">
                <FaRedo className="mr-2" />
                <span>Tare</span>
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm">{error}</div>}

        {checkpointValue !== null && currentForce !== null && (
          <div
            className={`mb-4 mt-2 p-3 rounded-md text-sm flex items-center justify-between ${
              Math.abs(currentForce - checkpointValue) <= CHECKPOINT_TOLERANCE
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                : Math.abs(currentForce - checkpointValue) <= CHECKPOINT_TOLERANCE_WARNING
                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
            }`}
          >
            <span>
              Target <strong>{checkpointValue.toFixed(1)} kg</strong> | Distance{" "}
              <strong>{Math.abs(currentForce - checkpointValue).toFixed(1)} kg</strong>
            </span>
            <span>
              {Math.abs(currentForce - checkpointValue) <= CHECKPOINT_TOLERANCE
                ? "On target! 🎯"
                : Math.abs(currentForce - checkpointValue) <= CHECKPOINT_TOLERANCE_WARNING
                ? "Getting closer! 👍"
                : "Keep trying! 💪"}
            </span>
          </div>
        )}

        <div className="h-64 md:h-80 mt-6">
          <Line data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  );
}
