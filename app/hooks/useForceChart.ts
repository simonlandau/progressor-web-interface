import { useMemo } from "react";
import { useTheme } from "next-themes";
import { MeasurementData } from "../../types/tindeq";
import { ChartData, ChartOptions } from "chart.js";
import { useTarget } from "./useTarget";

/**
 * Hook for managing force measurement chart data and options
 */
export function useForceChart(measurements: MeasurementData[], startTime: number | null, elapsedTime: number, maxForce: number | null) {
  const { resolvedTheme } = useTheme();
  const { targetValue, getTargetLineColor } = useTarget();

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

    // If we have a target, make sure it's visible
    const targetAdjustment = targetValue ? Math.max(0, targetValue - highestMeasurement) : 0;

    // If we're approaching the current max (within 80%), increase the max by 25%
    if (highestMeasurement > 16 || targetAdjustment > 0) {
      // 80% of default 20kg
      const newMax = Math.ceil((highestMeasurement + targetAdjustment) * 1.25);
      return Math.max(newMax, 20); // Never go below 20kg
    }

    return 20; // Default to 20kg
  }, [measurements, maxForce, targetValue]);

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
          pointRadius: 0, // Hide the points to make it a solid line
          borderWidth: 2, // Ensure the line has a good thickness
          fill: false, // Don't fill the area under the line
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
      elements: {
        point: {
          radius: 0, // Ensure points are hidden globally
        },
        line: {
          tension: 0.2, // Smooth curve
          borderWidth: 2, // Consistent line thickness
        },
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

    // Only add annotation if we have a target value
    if (targetValue !== null && options.plugins) {
      options.plugins.annotation = {
        annotations: {
          targetLine: {
            type: "line" as const,
            yMin: targetValue,
            yMax: targetValue,
            borderColor: getTargetLineColor,
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: true,
              content: `Target ${targetValue} kg`,
              position: "end",
              backgroundColor: getTargetLineColor,
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
  }, [calculateYAxisMax, targetValue, getTargetLineColor]);

  return {
    chartData,
    chartOptions,
  };
}
