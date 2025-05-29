import { useState, useEffect } from "react";
import useTindeqStore from "../store/tindeqStore";
import useSettingsStore from "../store/settingsStore";
import { convertToKg, convertFromKg } from "../utils/units";

// Constants
const TARGET_TOLERANCE = 1;
const TARGET_TOLERANCE_WARNING = 3;

/**
 * Hook for managing target force values and status
 */
export function useTarget() {
  const { targetValue, setTargetValue, currentForce } = useTindeqStore();
  const { unit } = useSettingsStore();
  const [targetInput, setTargetInput] = useState<string>("");

  // Update target input when target value or unit changes
  useEffect(() => {
    if (targetValue !== null) {
      const displayValue = convertFromKg(targetValue, unit);
      setTargetInput(displayValue.toFixed(unit === "lbs" ? 1 : 1));
    } else {
      setTargetInput("");
    }
  }, [targetValue, unit]);

  // Handle target input change
  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetInput(e.target.value);
  };

  // Handle target submission
  const handleTargetSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const value = parseFloat(targetInput);
    if (!isNaN(value) && value > 0) {
      // Convert the input value to kg for storage
      const valueInKg = convertToKg(value, unit);
      setTargetValue(valueInKg);
    } else {
      setTargetValue(null);
      setTargetInput("");
    }
  };

  // Clear target
  const clearTarget = () => {
    setTargetValue(null);
    setTargetInput("");
  };

  // Get target status information
  const targetStatus = (() => {
    if (targetValue === null || currentForce === null) return null;

    const distance = Math.abs(currentForce - targetValue);
    let status = {
      distance,
      isOnTarget: false,
      isClose: false,
      message: "Keep trying! 💪",
      className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
    };

    if (distance <= TARGET_TOLERANCE) {
      status = {
        ...status,
        isOnTarget: true,
        message: "On target! 🎯",
        className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
      };
    } else if (distance <= TARGET_TOLERANCE_WARNING) {
      status = {
        ...status,
        isClose: true,
        message: "Getting closer! 👍",
        className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
      };
    }

    return status;
  })();

  // Get target line color based on proximity to current force
  const getTargetLineColor = (() => {
    if (targetValue === null || currentForce === null) return "rgba(200, 200, 200, 0.5)";

    const distance = Math.abs(currentForce - targetValue);

    if (distance <= TARGET_TOLERANCE) return "rgba(34, 197, 94, 0.7)"; // Green when within tolerance
    if (distance <= TARGET_TOLERANCE_WARNING) return "rgba(234, 179, 8, 0.7)"; // Yellow when within warning
    return "rgba(239, 68, 68, 0.7)"; // Red when outside warning
  })();

  return {
    targetValue,
    targetInput,
    targetStatus,
    TARGET_TOLERANCE,
    TARGET_TOLERANCE_WARNING,
    getTargetLineColor,
    handleTargetChange,
    handleTargetSubmit,
    clearTarget,
    setTargetInput,
  };
}
