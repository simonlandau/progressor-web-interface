import { useEffect } from "react";
import { tindeqService } from "../utils/bluetooth";
import useTindeqStore from "../store/tindeqStore";

/**
 * Hook to handle watchdog functionality - detecting when measurements stop
 * This is a focused, reusable hook that only handles connection monitoring
 */
export function useTindeqWatchdog() {
  const { isMeasuring, lastDataTime } = useTindeqStore();

  useEffect(() => {
    if (!isMeasuring) return;

    const watchdogTimer = setInterval(() => {
      if (lastDataTime === null) return;

      const now = Date.now();
      const timeSinceLastData = now - lastDataTime;

      if (timeSinceLastData > 3000) {
        console.warn(`No data received for ${timeSinceLastData}ms, restarting measurement`);

        tindeqService
          .stopMeasurement()
          .then(() => new Promise((resolve) => setTimeout(resolve, 500)))
          .then(() => tindeqService.startMeasurement())
          .then(() => {
            useTindeqStore.setState({ lastDataTime: Date.now() });
          })
          .catch((err) => {
            console.error("Failed to restart measurement:", err);
            useTindeqStore.setState({
              error: "Data stream interrupted. Please try stopping and starting again.",
              isMeasuring: false,
            });
          });
      }
    }, 1000);

    return () => clearInterval(watchdogTimer);
  }, [isMeasuring, lastDataTime]);
}
