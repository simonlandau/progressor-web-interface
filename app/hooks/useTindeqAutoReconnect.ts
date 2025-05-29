import { useEffect } from "react";
import useTindeqStore from "../store/tindeqStore";

/**
 * Hook to handle automatic reconnection attempts when connection is lost
 * This is a focused, reusable hook that only handles reconnection logic
 */
export function useTindeqAutoReconnect() {
  const { isConnected, reconnectAttempts, isManualDisconnect, connect } = useTindeqStore();

  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout | null = null;

    // Only attempt to reconnect if it wasn't a manual disconnect
    if (!isConnected && reconnectAttempts > 0 && reconnectAttempts < 3 && !isManualDisconnect) {
      console.log(`Attempting to reconnect (attempt ${reconnectAttempts})...`);
      reconnectTimer = setTimeout(() => {
        // Double-check the manual disconnect flag hasn't changed
        if (!useTindeqStore.getState().isManualDisconnect) {
          connect();
        }
      }, 2000);
    }

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [isConnected, reconnectAttempts, isManualDisconnect, connect]);
}
