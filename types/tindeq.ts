/**
 * Tindeq device and measurement related types
 */

/**
 * Measurement data from the Tindeq device
 */
export interface MeasurementData {
  weight: number;
  timestamp: number;
}

/**
 * Device information for the Tindeq Progressor
 */
export interface DeviceInfo {
  firmwareVersion?: string;
  batteryVoltage?: number;
  errorInfo?: string;
}

/**
 * Interface for the Tindeq device state
 */
export interface TindeqState {
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
 * Tindeq Progressor command and response codes
 */
export enum ProgressorCommand {
  TARE_SCALE = 100,
  START_WEIGHT_MEAS = 101,
  STOP_WEIGHT_MEAS = 102,
  START_PEAK_RFD_MEAS = 103,
  START_PEAK_RFD_MEAS_SERIES = 104,
  ADD_CALIBRATION_POINT = 105,
  SAVE_CALIBRATION = 106,
  GET_APP_VERSION = 107,
  GET_ERROR_INFORMATION = 108,
  CLR_ERROR_INFORMATION = 109,
  ENTER_SLEEP = 110,
  GET_BATTERY_VOLTAGE = 111,
}

export enum ProgressorResponse {
  CMD_RESPONSE = 0,
  WEIGHT_MEAS = 1,
  RFD_PEAK = 2,
  RFD_PEAK_SERIES = 3,
  LOW_PWR_WARNING = 4,
}

/**
 * Tindeq Progressor Bluetooth service and characteristic UUIDs
 */
export const PROGRESSOR_SERVICE_UUID = "7e4e1701-1ea6-40c9-9dcc-13d34ffead57";
export const DATA_CHAR_UUID = "7e4e1702-1ea6-40c9-9dcc-13d34ffead57";
export const CTRL_POINT_CHAR_UUID = "7e4e1703-1ea6-40c9-9dcc-13d34ffead57";
