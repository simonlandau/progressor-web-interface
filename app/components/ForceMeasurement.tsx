"use client";

import { FaPlay, FaStop, FaRedo } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartData, ChartOptions } from "chart.js";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTindeq } from "../hooks/useTindeq";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function ForceMeasurement() {
  const { isConnected, isMeasuring, currentForce, maxForce, measurements, startTime, error, startMeasurement, stopMeasurement, tareScale } =
    useTindeq();

  // Chart configuration
  const chartData: ChartData<"line"> = {
    labels: measurements.map((m) => ((m.timestamp - (startTime || 0)) / 1000000).toFixed(1)),
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

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="mb-4 md:mb-0">
            <CardTitle className="mb-2">Force Measurement</CardTitle>
            <div className="flex space-x-4">
              <div>
                <span className="text-sm text-muted-foreground">Current:</span>
                <div className="text-3xl font-bold">{currentForce !== null ? `${currentForce.toFixed(1)} kg` : "-"}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Max:</span>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{maxForce !== null ? `${maxForce.toFixed(1)} kg` : "-"}</div>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={tareScale} disabled={!isConnected || isMeasuring} variant="secondary" size="default">
              <FaRedo />
              <span>Tare</span>
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
