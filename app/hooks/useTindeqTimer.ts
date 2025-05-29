import { useEffect } from "react";
import useTindeqStore from "../store/tindeqStore";

/**
 * Hook to handle elapsed time updates during measurement
 * This is a focused, reusable hook that only handles timing logic
 */
export function useTindeqTimer() {
  const { isMeasuring, startTime } = useTindeqStore();

  useEffect(() => {
    if (!isMeasuring || !startTime) return;

    const timer = setInterval(() => {
      useTindeqStore.setState((state) => {
        if (!state.isMeasuring || !state.startTime) return state;

        const now = Date.now() * 1000;
        const calculatedTime = (now - state.startTime) / 1000000;

        if (calculatedTime > state.elapsedTime) {
          return { elapsedTime: Number(calculatedTime.toFixed(1)) };
        }

        return state;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isMeasuring, startTime]);
}
