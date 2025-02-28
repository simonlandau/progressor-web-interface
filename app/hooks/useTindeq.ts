import { create } from "zustand";
import { useEffect } from "react";
import { tindeqService, MeasurementData, DeviceInfo } from "../utils/bluetooth";

/**
 * Interface for the Tindeq device state
 */
interface TindeqState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempts: number;
  isManualDisconnect: boolean;

  // Device information
  deviceInfo: DeviceInfo;

  // Measurement state
  isMeasuring: boolean;
  currentForce: number | null;
  maxForce: number | null;
  measurements: MeasurementData[];
  startTime: number | null;
  lastDataTime: number | null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  startMeasurement: () => Promise<void>;
  stopMeasurement: () => Promise<void>;
  tareScale: () => Promise<void>;
  resetMeasurements: () => void;
  setReconnectAttempts: (attempts: number) => void;
  setIsManualDisconnect: (isManual: boolean) => void;
  handleConnectionChange: (connected: boolean) => void;
  handleManualReconnect: () => void;
}

/**
 * Zustand store for Tindeq device state
 */
const useTindeqStore = create<TindeqState>((set, get) => ({
  // Connection state
  isConnected: false,
  isConnecting: false,
  error: null,
  reconnectAttempts: 0,
  isManualDisconnect: false,

  // Device information
  deviceInfo: {},

  // Measurement state
  isMeasuring: false,
  currentForce: null,
  maxForce: null,
  measurements: [],
  startTime: null,
  lastDataTime: null,

  // Actions
  connect: async () => {
    set({ error: null, isConnecting: true, isManualDisconnect: false });

    try {
      if (!navigator.bluetooth) {
        throw new Error("Web Bluetooth API is not supported in this browser");
      }

      await tindeqService.connect();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to connect",
        isConnecting: false,
      });
    }
  },

  disconnect: async () => {
    // Set manual disconnect flag before disconnecting
    set({ isManualDisconnect: true });
    await tindeqService.disconnect();
  },

  startMeasurement: async () => {
    const state = get();
    set({ error: null });

    try {
      if (!state.isConnected) {
        throw new Error("Device not connected");
      }

      // Reset measurements when starting a new session
      set({
        measurements: [],
        startTime: null,
        maxForce: null,
      });

      const success = await tindeqService.startMeasurement();
      if (!success) {
        throw new Error("Failed to start measurement");
      }

      set({ isMeasuring: true });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to start measurement",
      });
    }
  },

  stopMeasurement: async () => {
    set({ error: null });

    try {
      const success = await tindeqService.stopMeasurement();
      if (!success) {
        throw new Error("Failed to stop measurement");
      }

      set({ isMeasuring: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to stop measurement",
      });
    }
  },

  tareScale: async () => {
    const state = get();
    set({ error: null });

    try {
      if (!state.isConnected) {
        throw new Error("Device not connected");
      }

      const success = await tindeqService.tareScale();
      if (!success) {
        throw new Error("Failed to tare scale");
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to tare scale",
      });
    }
  },

  resetMeasurements: () => {
    set({
      measurements: [],
      startTime: null,
      maxForce: null,
    });
  },

  setReconnectAttempts: (attempts: number) => {
    set({ reconnectAttempts: attempts });
  },

  setIsManualDisconnect: (isManual: boolean) => {
    set({ isManualDisconnect: isManual });
  },

  // Handle connection change from the Bluetooth service
  handleConnectionChange: (connected: boolean) => {
    const state = get();
    const wasConnected = state.isConnected;
    const wasManualDisconnect = state.isManualDisconnect;

    // Update connection state
    set({
      isConnected: connected,
      isConnecting: false,
    });

    // If we were connected and suddenly disconnected
    if (!connected && wasConnected) {
      console.log(`Device disconnected. Manual: ${wasManualDisconnect}`);

      // Only attempt to reconnect if it wasn't a manual disconnect
      if (!wasManualDisconnect) {
        console.log("Device disconnected unexpectedly, attempting to reconnect...");
        set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 }));
      }
    } else if (connected) {
      // Reset reconnect attempts and manual disconnect flag when successfully connected
      set({
        reconnectAttempts: 0,
        isManualDisconnect: false,
      });
    }
  },

  // Handle manual reconnect
  handleManualReconnect: () => {
    const state = get();
    state.setReconnectAttempts(0);
    state.setIsManualDisconnect(false);
    state.connect();
  },
}));

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

          // Initialize start time if this is the first measurement
          if (state.startTime === null) {
            newStartTime = data.timestamp;
            newMeasurements = [data];
          } else {
            // Add new measurement and limit array size
            newMeasurements = [...state.measurements, data];
            if (newMeasurements.length > MAX_DATA_POINTS) {
              newMeasurements = newMeasurements.slice(-MAX_DATA_POINTS);
            }
          }

          newState.measurements = newMeasurements;
          newState.startTime = newStartTime;
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
