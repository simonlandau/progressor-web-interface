import { useEffect } from "react";
import { tindeqService } from "../utils/bluetooth";
import { TindeqState } from "../../types/tindeq";
import useTindeqStore from "../store/tindeqStore";

/**
 * Custom hook for interacting with the Tindeq Progressor device
 *
 * This hook centralizes all Tindeq-specific logic and provides a clean interface
 * for components to interact with the device.
 *
 * @returns All Tindeq state and actions
 */
export function useTindeq() {
  const state = useTindeqStore();

  // Maximum number of data points to display on the chart
  const MAX_DATA_POINTS = 100;

  // Reset elapsed time when starting a new measurement after a reset
  useEffect(() => {
    // We only want to reset the elapsed time to 0 when:
    // 1. We're measuring
    // 2. We have no measurements (indicating a reset was performed)
    // 3. We have no startTime (indicating a fresh start)
    if (state.isMeasuring && state.measurements.length === 0 && state.startTime === null && state.elapsedTime === 0) {
      useTindeqStore.setState({ elapsedTime: 0 });
    }
  }, [state.isMeasuring, state.measurements.length, state.startTime, state.elapsedTime]);

  // Timer to update elapsed time even when no new measurements are coming in
  useEffect(() => {
    if (!state.isMeasuring || !state.startTime) return;

    const timer = setInterval(() => {
      // Force a state update to trigger re-renders in components using this hook
      useTindeqStore.setState((state) => {
        // Only update if we're still measuring and have a start time
        if (!state.isMeasuring || !state.startTime) return state;

        // Calculate current elapsed time
        const now = Date.now() * 1000; // Convert to microseconds to match startTime
        const calculatedTime = (now - state.startTime) / 1000000;

        // Only update if the calculated time is greater than the current elapsed time
        // This prevents the time from jumping backward if a new measurement comes in
        if (calculatedTime > state.elapsedTime) {
          return { elapsedTime: Number(calculatedTime.toFixed(1)) };
        }

        return state;
      });
    }, 100); // Update 10 times per second

    return () => clearInterval(timer);
  }, [state.isMeasuring, state.startTime]);

  // Set up Bluetooth service callbacks
  useEffect(() => {
    // Connection change callback
    tindeqService.setOnConnectionChangeCallback((connected) => {
      useTindeqStore.getState().handleConnectionChange(connected);
    });

    // Device info callback
    tindeqService.setOnDeviceInfoCallback((info) => {
      useTindeqStore.setState({ deviceInfo: info });
    });

    // Error callback
    tindeqService.setOnErrorCallback((error) => {
      useTindeqStore.setState({
        error: error.message,
        isConnecting: false,
      });
    });

    // Measurement callback
    tindeqService.setOnMeasurementCallback((data) => {
      useTindeqStore.setState((state) => {
        // Update current force
        const newState: Partial<TindeqState> = {
          currentForce: data.weight,
          lastDataTime: Date.now(),
        };

        // Update max force if needed
        if (state.maxForce === null || data.weight > state.maxForce) {
          newState.maxForce = data.weight;
        }

        // Add measurement to array if measuring
        if (state.isMeasuring) {
          let newMeasurements = [...state.measurements];
          let newStartTime = state.startTime;
          let newElapsedTime = state.elapsedTime;

          // Initialize start time if this is the first measurement ever
          // or if we're starting a new session after resetting
          if (state.startTime === null) {
            // If we have an existing elapsed time (from a previous session),
            // calculate a virtual start time that will continue from where we left off
            if (state.elapsedTime > 0) {
              // Convert elapsed time from seconds to microseconds and subtract from current timestamp
              newStartTime = data.timestamp - state.elapsedTime * 1000000;
            } else {
              // If no elapsed time, use current timestamp as start time
              newStartTime = data.timestamp;
            }

            // If we don't have any measurements yet, this is the first one
            if (state.measurements.length === 0) {
              newMeasurements = [data];
            } else {
              // We have existing measurements, so append to them
              newMeasurements = [...state.measurements, data];
            }
          } else {
            // We already have a start time, just add the new measurement
            newMeasurements = [...state.measurements, data];
            if (newMeasurements.length > MAX_DATA_POINTS) {
              newMeasurements = newMeasurements.slice(-MAX_DATA_POINTS);
            }
          }

          // Update elapsed time based on the difference between current and start time
          if (newStartTime !== null) {
            newElapsedTime = Number(((data.timestamp - newStartTime) / 1000000).toFixed(1));
          }

          newState.measurements = newMeasurements;
          newState.startTime = newStartTime;
          newState.elapsedTime = newElapsedTime;
        }

        return newState;
      });
    });

    // Cleanup function
    return () => {
      tindeqService.setOnConnectionChangeCallback(() => {});
      tindeqService.setOnDeviceInfoCallback(() => {});
      tindeqService.setOnErrorCallback(() => {});
      tindeqService.setOnMeasurementCallback(() => {});

      // Disconnect if connected
      if (state.isConnected) {
        // Set manual disconnect flag to prevent auto-reconnect
        useTindeqStore.setState({ isManualDisconnect: true });
        tindeqService.disconnect().catch(console.error);
      }
    };
  }, []);

  // Auto-reconnect logic
  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout | null = null;

    // Only attempt to reconnect if it wasn't a manual disconnect
    if (!state.isConnected && state.reconnectAttempts > 0 && state.reconnectAttempts < 3 && !state.isManualDisconnect) {
      console.log(`Attempting to reconnect (attempt ${state.reconnectAttempts})...`);
      reconnectTimer = setTimeout(() => {
        // Double-check the manual disconnect flag hasn't changed
        if (!useTindeqStore.getState().isManualDisconnect) {
          state.connect();
        }
      }, 2000);
    }

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [state.isConnected, state.reconnectAttempts, state.isManualDisconnect, state.connect]);

  // Watchdog timer to detect when measurements stop coming in
  useEffect(() => {
    if (!state.isMeasuring) return;

    // Set up a timer to check if we're still receiving data
    const watchdogTimer = setInterval(() => {
      if (state.lastDataTime === null) return;

      const now = Date.now();
      const timeSinceLastData = now - state.lastDataTime;

      // If we haven't received data for more than 3 seconds, try to restart measurement
      if (timeSinceLastData > 3000) {
        console.warn(`No data received for ${timeSinceLastData}ms, restarting measurement`);

        // Try to stop and restart measurement
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

    return () => {
      clearInterval(watchdogTimer);
    };
  }, [state.isMeasuring, state.lastDataTime]);

  // Cleanup when measurement stops
  useEffect(() => {
    return () => {
      if (state.isMeasuring) {
        tindeqService.stopMeasurement().catch(console.error);
      }
    };
  }, [state.isMeasuring]);

  return state;
}
