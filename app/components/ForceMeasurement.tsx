"use client";

import { useState, useEffect } from "react";
import { FaPlay, FaStop, FaRedo } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartData, ChartOptions } from "chart.js";
import { tindeqService, MeasurementData } from "../utils/bluetooth";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface ForceMeasurementProps {
  isConnected: boolean;
}

export default function ForceMeasurement({ isConnected }: ForceMeasurementProps) {
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [currentForce, setCurrentForce] = useState<number | null>(null);
  const [maxForce, setMaxForce] = useState<number | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementData[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastDataTime, setLastDataTime] = useState<number | null>(null);

  // Limit the number of data points to display on the chart
  const MAX_DATA_POINTS = 100;

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

  // Watchdog timer to detect when measurements stop coming in
  useEffect(() => {
    if (!isMeasuring) return;

    // Set up a timer to check if we're still receiving data
    const watchdogTimer = setInterval(() => {
      if (lastDataTime === null) return;

      const now = Date.now();
      const timeSinceLastData = now - lastDataTime;

      // If we haven't received data for more than 3 seconds, try to restart measurement
      if (timeSinceLastData > 3000) {
        console.warn(`No data received for ${timeSinceLastData}ms, restarting measurement`);

        // Try to stop and restart measurement
        tindeqService
          .stopMeasurement()
          .then(() => new Promise((resolve) => setTimeout(resolve, 500)))
          .then(() => tindeqService.startMeasurement())
          .then(() => {
            setLastDataTime(Date.now());
          })
          .catch((err) => {
            console.error("Failed to restart measurement:", err);
            setError("Data stream interrupted. Please try stopping and starting again.");
            setIsMeasuring(false);
          });
      }
    }, 1000);

    return () => {
      clearInterval(watchdogTimer);
    };
  }, [isMeasuring, lastDataTime]);

  useEffect(() => {
    // Setup measurement callback when connected
    const handleMeasurement = (data: MeasurementData) => {
      setCurrentForce(data.weight);
      setLastDataTime(Date.now());

      if (maxForce === null || data.weight > maxForce) {
        setMaxForce(data.weight);
      }

      if (isMeasuring) {
        setMeasurements((prev) => {
          // Initialize start time if this is the first measurement
          if (startTime === null) {
            setStartTime(data.timestamp);
            return [data];
          }

          // Add new measurement and limit array size
          const newMeasurements = [...prev, data];
          if (newMeasurements.length > MAX_DATA_POINTS) {
            return newMeasurements.slice(-MAX_DATA_POINTS);
          }
          return newMeasurements;
        });
      }
    };

    if (isConnected) {
      tindeqService.setOnMeasurementCallback(handleMeasurement);
    }

    return () => {
      // Clean up
      tindeqService.setOnMeasurementCallback(() => {});
    };
  }, [isConnected, isMeasuring, maxForce, startTime]);

  // Separate effect for cleanup when component unmounts or measurement stops
  useEffect(() => {
    return () => {
      if (isMeasuring) {
        tindeqService.stopMeasurement().catch(console.error);
      }
    };
  }, [isMeasuring]);

  const handleStartMeasurement = async () => {
    setError(null);

    try {
      if (!isConnected) {
        throw new Error("Device not connected");
      }

      // Reset measurements when starting a new session
      setMeasurements([]);
      setStartTime(null);
      setMaxForce(null);

      console.log("Starting measurement...");
      const success = await tindeqService.startMeasurement();
      if (!success) {
        throw new Error("Failed to start measurement");
      }

      setIsMeasuring(true);
      console.log("Measurement started");
    } catch (error) {
      console.error("Start measurement error:", error);
      setError(error instanceof Error ? error.message : "Failed to start measurement");
    }
  };

  const handleStopMeasurement = async () => {
    setError(null);

    try {
      console.log("Stopping measurement...");
      const success = await tindeqService.stopMeasurement();
      if (!success) {
        throw new Error("Failed to stop measurement");
      }

      setIsMeasuring(false);
      console.log("Measurement stopped");
    } catch (error) {
      console.error("Stop measurement error:", error);
      setError(error instanceof Error ? error.message : "Failed to stop measurement");
    }
  };

  const handleTareScale = async () => {
    setError(null);

    try {
      if (!isConnected) {
        throw new Error("Device not connected");
      }

      const success = await tindeqService.tareScale();
      if (!success) {
        throw new Error("Failed to tare scale");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to tare scale");
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <div className="mb-4 md:mb-0">
          <h2 className="text-xl font-semibold mb-2">Force Measurement</h2>
          <div className="flex space-x-4">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Current:</span>
              <div className="text-3xl font-bold">{currentForce !== null ? `${currentForce.toFixed(1)} kg` : "-"}</div>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Max:</span>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{maxForce !== null ? `${maxForce.toFixed(1)} kg` : "-"}</div>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleTareScale}
            disabled={!isConnected || isMeasuring}
            className={`flex items-center px-4 py-2 rounded-full font-medium ${
              !isConnected || isMeasuring
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
            } transition-colors`}
          >
            <FaRedo className="mr-2" />
            Tare
          </button>

          {!isMeasuring ? (
            <button
              onClick={handleStartMeasurement}
              disabled={!isConnected}
              className={`flex items-center px-4 py-2 rounded-full font-medium ${
                !isConnected
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 text-white"
              } transition-colors`}
            >
              <FaPlay className="mr-2" />
              Start
            </button>
          ) : (
            <button
              onClick={handleStopMeasurement}
              className="flex items-center px-4 py-2 rounded-full font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
            >
              <FaStop className="mr-2" />
              Stop
            </button>
          )}
        </div>
      </div>

      {error && <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm">{error}</div>}

      <div className="h-64 md:h-80">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
