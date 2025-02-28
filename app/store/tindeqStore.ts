import { create } from "zustand";
import { TindeqState } from "../../types/tindeq";
import { tindeqService } from "../utils/bluetooth";

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
  elapsedTime: 0,

  // Checkpoint state
  checkpointValue: null,

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

      // When starting a new measurement:
      // 1. Set isMeasuring to true
      // 2. Reset startTime to null so it will be recalculated in the measurement callback
      // 3. Preserve the current elapsedTime to continue from where we left off
      set({
        isMeasuring: true,
        startTime: null,
        // Preserve elapsedTime - don't reset it
      });

      const success = await tindeqService.startMeasurement();
      if (!success) {
        throw new Error("Failed to start measurement");
      }
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

      // Preserve the final elapsed time when stopping
      const state = get();
      const finalElapsedTime =
        state.measurements.length > 0 && state.startTime
          ? Number(((state.measurements[state.measurements.length - 1].timestamp - state.startTime) / 1000000).toFixed(1))
          : state.elapsedTime;

      // Only update isMeasuring and elapsedTime, preserve all other values
      set({
        isMeasuring: false,
        elapsedTime: finalElapsedTime,
        // Don't reset startTime or measurements here
      });
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
      currentForce: null,
      elapsedTime: 0,
      lastDataTime: null,
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

  // Set checkpoint value
  setCheckpointValue: (value: number | null) => {
    set({ checkpointValue: value });
  },

  // Get elapsed time in seconds
  getElapsedTime: () => {
    const state = get();

    // If not measuring, return the stored elapsed time
    if (!state.isMeasuring) {
      return state.elapsedTime.toFixed(1);
    }

    // Calculate elapsed time in seconds from measurements
    if (state.measurements.length > 0 && state.startTime) {
      const latestMeasurement = state.measurements[state.measurements.length - 1];
      return ((latestMeasurement.timestamp - state.startTime) / 1000000).toFixed(1);
    }

    // Fallback to current elapsed time if we have it
    if (state.elapsedTime > 0) {
      return state.elapsedTime.toFixed(1);
    }

    // Fallback to 0.0 if no measurements yet
    return "0.0";
  },
}));

export default useTindeqStore;
