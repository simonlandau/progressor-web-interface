"use client";

import { FaPlay, FaStop, FaRedo, FaTrash } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartData, ChartOptions } from "chart.js";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTindeq } from "../hooks/useTindeq";
import { MeasurementData } from "../../types/tindeq";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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
  } = useTindeq();

  // Format the time display - show elapsed time even when not measuring
  const displayTime = isMeasuring ? `${getElapsedTime()} s` : elapsedTime > 0 ? `${elapsedTime.toFixed(1)} s` : "-";

  // Chart configuration
  const chartData: ChartData<"line"> = {
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
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.2,
      },
    ],
  };

  const chartOptions: ChartOptions<"line"> = {
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

  // Calculate the y-axis maximum based on current measurements
  function calculateYAxisMax(measurements: MeasurementData[], maxForce: number | null): number | undefined {
    // Default to 20kg if no measurements or maxForce
    if (!measurements.length || maxForce === null) {
      return 20;
    }

    // Get the highest force value from measurements
    const highestMeasurement = Math.max(...measurements.map((m) => m.weight));

    // If we're approaching the current max (within 80%), increase the max by 25%
    if (highestMeasurement > 16) {
      // 80% of default 20kg
      const newMax = Math.ceil(highestMeasurement * 1.25);
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
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{maxForce !== null ? `${maxForce.toFixed(1)} kg` : "-"}</div>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={tareScale} disabled={!isConnected || isMeasuring} variant="secondary" size="default">
              <FaRedo />
              <span>Tare</span>
            </Button>

            <Button onClick={resetMeasurements} disabled={isMeasuring || (elapsedTime === 0 && maxForce === null)} variant="secondary" size="default">
              <FaTrash />
              <span>Reset</span>
            </Button>

            {!isMeasuring ? (
              <Button
                onClick={startMeasurement}
                disabled={!isConnected}
                variant={!isConnected ? "outline" : "default"}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-700"
              >
                <FaPlay />
                <span>Start</span>
              </Button>
            ) : (
              <Button onClick={stopMeasurement} variant="destructive">
                <FaStop />
                <span>Stop</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm">{error}</div>}

        <div className="h-64 md:h-80 mt-6">
          <Line data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  );
}
