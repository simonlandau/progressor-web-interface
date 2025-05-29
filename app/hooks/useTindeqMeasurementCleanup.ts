import { useEffect } from "react";
import { tindeqService } from "../utils/bluetooth";
import useTindeqStore from "../store/tindeqStore";

/**
 * Hook to handle measurement cleanup and elapsed time reset logic
 * This is a focused, reusable hook that only handles measurement lifecycle
 */
export function useTindeqMeasurementCleanup() {
  const { isMeasuring, measurements, startTime, elapsedTime } = useTindeqStore();

  // Reset elapsed time when starting a new measurement after a reset
  useEffect(() => {
    // We only want to reset the elapsed time to 0 when:
    // 1. We're measuring
    // 2. We have no measurements (indicating a reset was performed)
    // 3. We have no startTime (indicating a fresh start)
    if (isMeasuring && measurements.length === 0 && startTime === null && elapsedTime === 0) {
      useTindeqStore.setState({ elapsedTime: 0 });
    }
  }, [isMeasuring, measurements.length, startTime, elapsedTime]);

  // Cleanup when measurement stops (component unmount)
  useEffect(() => {
    return () => {
      if (useTindeqStore.getState().isMeasuring) {
        tindeqService.stopMeasurement().catch(console.error);
      }
    };
  }, []);
}
