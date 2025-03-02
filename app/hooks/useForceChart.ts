import { useMemo } from "react";
import { useTheme } from "next-themes";
import { MeasurementData } from "../../types/tindeq";
import { ChartData, ChartOptions } from "chart.js";

// Constants
const CHECKPOINT_TOLERANCE = 1;
const CHECKPOINT_TOLERANCE_WARNING = 3;

/**
 * Hook for managing force measurement chart data and options
 */
export function useForceChart(
  measurements: MeasurementData[],
  startTime: number | null,
  elapsedTime: number,
  maxForce: number | null,
  checkpointValue: number | null,
  currentForce: number | null
) {
  const { resolvedTheme } = useTheme();

  // Get checkpoint line color based on proximity to current force
  const getCheckpointLineColor = useMemo(() => {
    if (checkpointValue === null || currentForce === null) return "rgba(200, 200, 200, 0.5)";

    const distance = Math.abs(currentForce - checkpointValue);

    if (distance <= CHECKPOINT_TOLERANCE) return "rgba(34, 197, 94, 0.7)"; // Green when within tolerance
    if (distance <= CHECKPOINT_TOLERANCE_WARNING) return "rgba(234, 179, 8, 0.7)"; // Yellow when within warning
    return "rgba(239, 68, 68, 0.7)"; // Red when outside warning
  }, [checkpointValue, currentForce]);

  // Get line color based on theme
  const getLineColor = useMemo(() => {
    return resolvedTheme === "dark" ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)";
  }, [resolvedTheme]);

  const getLineBackgroundColor = useMemo(() => {
    return resolvedTheme === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)";
  }, [resolvedTheme]);

  // Calculate the y-axis maximum based on current measurements
  const calculateYAxisMax = useMemo(() => {
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
  }, [measurements, maxForce, checkpointValue]);

  // Memoize chart data
  const chartData: ChartData<"line"> = useMemo(
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
          borderColor: getLineColor,
          backgroundColor: getLineBackgroundColor,
          tension: 0.2,
        },
      ],
    }),
    [measurements, startTime, elapsedTime, getLineColor, getLineBackgroundColor]
  );

  // Memoize chart options
  const chartOptions: ChartOptions<"line"> = useMemo(() => {
    const options: ChartOptions<"line"> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0, // Disable animation for better performance with live data
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 20, // Default maximum of 20kg
          max: calculateYAxisMax,
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
          display: false,
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
            borderColor: getCheckpointLineColor,
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: true,
              content: `Target ${checkpointValue} kg`,
              position: "end",
              backgroundColor: getCheckpointLineColor,
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
  }, [calculateYAxisMax, checkpointValue, getCheckpointLineColor]);

  // Get checkpoint status information
  const checkpointStatus = useMemo(() => {
    if (checkpointValue === null || currentForce === null) return null;

    const distance = Math.abs(currentForce - checkpointValue);
    let status = {
      distance,
      isOnTarget: false,
      isClose: false,
      message: "Keep trying! 💪",
      className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
    };

    if (distance <= CHECKPOINT_TOLERANCE) {
      status = {
        ...status,
        isOnTarget: true,
        message: "On target! 🎯",
        className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
      };
    } else if (distance <= CHECKPOINT_TOLERANCE_WARNING) {
      status = {
        ...status,
        isClose: true,
        message: "Getting closer! 👍",
        className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
      };
    }

    return status;
  }, [checkpointValue, currentForce]);

  return {
    chartData,
    chartOptions,
    checkpointStatus,
    CHECKPOINT_TOLERANCE,
    CHECKPOINT_TOLERANCE_WARNING,
  };
}
