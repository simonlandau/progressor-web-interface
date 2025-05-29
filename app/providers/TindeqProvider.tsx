"use client";

import { useEffect } from "react";
import { tindeqService } from "../utils/bluetooth";
import { TindeqState } from "../../types/tindeq";
import useTindeqStore from "../store/tindeqStore";

interface TindeqProviderProps {
  children: React.ReactNode;
}

export function TindeqProvider({ children }: TindeqProviderProps) {
  // Maximum number of data points to display on the chart
  const MAX_DATA_POINTS = 100;

  useEffect(() => {
    // Set up Bluetooth service callbacks once at the app level
    tindeqService.setOnConnectionChangeCallback((connected) => {
      useTindeqStore.getState().handleConnectionChange(connected);
    });

    tindeqService.setOnDeviceInfoCallback((info) => {
      useTindeqStore.setState({ deviceInfo: info });
    });

    tindeqService.setOnErrorCallback((error) => {
      useTindeqStore.setState({
        error: error.message,
        isConnecting: false,
      });
    });

    tindeqService.setOnMeasurementCallback((data) => {
      useTindeqStore.setState((state) => {
        const newState: Partial<TindeqState> = {
          currentForce: data.weight,
          lastDataTime: Date.now(),
        };

        if (state.maxForce === null || data.weight > state.maxForce) {
          newState.maxForce = data.weight;
        }

        if (state.isMeasuring) {
          let newMeasurements = [...state.measurements];
          let newStartTime = state.startTime;
          let newElapsedTime = state.elapsedTime;

          if (state.startTime === null) {
            if (state.elapsedTime > 0) {
              newStartTime = data.timestamp - state.elapsedTime * 1000000;
            } else {
              newStartTime = data.timestamp;
            }

            if (state.measurements.length === 0) {
              newMeasurements = [data];
            } else {
              newMeasurements = [...state.measurements, data];
            }
          } else {
            newMeasurements = [...state.measurements, data];
            if (newMeasurements.length > MAX_DATA_POINTS) {
              newMeasurements = newMeasurements.slice(-MAX_DATA_POINTS);
            }
          }

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

    // Cleanup only when the entire app unmounts
    return () => {
      tindeqService.setOnConnectionChangeCallback(() => {});
      tindeqService.setOnDeviceInfoCallback(() => {});
      tindeqService.setOnErrorCallback(() => {});
      tindeqService.setOnMeasurementCallback(() => {});
    };
  }, []);

  return <>{children}</>;
}
