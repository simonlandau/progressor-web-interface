// Tindeq Progressor Bluetooth Service
// Add Web Bluetooth API types
declare global {
  interface Navigator {
    bluetooth: {
      requestDevice(options: { filters: Array<{ namePrefix: string }>; optionalServices: string[] }): Promise<BluetoothDevice>;
    };
  }

  interface BluetoothDevice {
    gatt?: {
      connect(): Promise<BluetoothRemoteGATTServer>;
      connected: boolean;
      disconnect(): void;
    };
    addEventListener(type: "gattserverdisconnected", listener: EventListenerOrEventListenerObject): void;
    removeEventListener(type: "gattserverdisconnected", listener: EventListenerOrEventListenerObject): void;
  }

  interface BluetoothRemoteGATTServer {
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
    connected: boolean;
  }

  interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
  }

  interface BluetoothRemoteGATTCharacteristic {
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    writeValue(value: BufferSource): Promise<void>;
    value: DataView;
    addEventListener(type: "characteristicvaluechanged", listener: EventListenerOrEventListenerObject): void;
    removeEventListener(type: "characteristicvaluechanged", listener: EventListenerOrEventListenerObject): void;
  }
}

export const PROGRESSOR_SERVICE_UUID = "7e4e1701-1ea6-40c9-9dcc-13d34ffead57";
export const DATA_CHAR_UUID = "7e4e1702-1ea6-40c9-9dcc-13d34ffead57";
export const CTRL_POINT_CHAR_UUID = "7e4e1703-1ea6-40c9-9dcc-13d34ffead57";

// Progressor Commands
export const CMD_TARE_SCALE = 100;
export const CMD_START_WEIGHT_MEAS = 101;
export const CMD_STOP_WEIGHT_MEAS = 102;
export const CMD_START_PEAK_RFD_MEAS = 103;
export const CMD_START_PEAK_RFD_MEAS_SERIES = 104;
export const CMD_ADD_CALIBRATION_POINT = 105;
export const CMD_SAVE_CALIBRATION = 106;
export const CMD_GET_APP_VERSION = 107;
export const CMD_GET_ERROR_INFORMATION = 108;
export const CMD_CLR_ERROR_INFORMATION = 109;
export const CMD_ENTER_SLEEP = 110;
export const CMD_GET_BATTERY_VOLTAGE = 111;

// Progressor response codes
export const RES_CMD_RESPONSE = 0;
export const RES_WEIGHT_MEAS = 1;
export const RES_RFD_PEAK = 2;
export const RES_RFD_PEAK_SERIES = 3;
export const RES_LOW_PWR_WARNING = 4;

export interface MeasurementData {
  weight: number;
  timestamp: number;
}

export interface DeviceInfo {
  firmwareVersion?: string;
  batteryVoltage?: number;
  errorInfo?: string;
}

export class TindeqBluetoothService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private service: BluetoothRemoteGATTService | null = null;
  private dataCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private controlCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private currentCmdRequest: number | null = null;
  private deviceInfo: DeviceInfo = {};
  private onMeasurementCallback: ((data: MeasurementData) => void) | null = null;
  private onDeviceInfoCallback: ((info: DeviceInfo) => void) | null = null;
  private onConnectionChangeCallback: ((connected: boolean) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;

  constructor() {
    this.handleDisconnection = this.handleDisconnection.bind(this);
    this.handleNotification = this.handleNotification.bind(this);
  }

  public setOnMeasurementCallback(callback: (data: MeasurementData) => void) {
    this.onMeasurementCallback = callback;
  }

  public setOnDeviceInfoCallback(callback: (info: DeviceInfo) => void) {
    this.onDeviceInfoCallback = callback;
  }

  public setOnConnectionChangeCallback(callback: (connected: boolean) => void) {
    this.onConnectionChangeCallback = callback;
  }

  public setOnErrorCallback(callback: (error: Error) => void) {
    this.onErrorCallback = callback;
  }

  public async connect() {
    try {
      if (!navigator.bluetooth) {
        throw new Error("Web Bluetooth API is not available in this browser");
      }

      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "Progressor" }],
        optionalServices: [PROGRESSOR_SERVICE_UUID],
      });

      if (!this.device) {
        throw new Error("No device selected");
      }

      this.device.addEventListener("gattserverdisconnected", this.handleDisconnection);

      const server = await this.device.gatt?.connect();
      if (!server) {
        throw new Error("Failed to connect to GATT server");
      }
      this.server = server;

      this.service = await this.server.getPrimaryService(PROGRESSOR_SERVICE_UUID);
      this.dataCharacteristic = await this.service.getCharacteristic(DATA_CHAR_UUID);
      this.controlCharacteristic = await this.service.getCharacteristic(CTRL_POINT_CHAR_UUID);

      await this.dataCharacteristic.startNotifications();
      this.dataCharacteristic.addEventListener("characteristicvaluechanged", this.handleNotification);

      if (this.onConnectionChangeCallback) {
        this.onConnectionChangeCallback(true);
      }

      // Get device information
      await this.getDeviceInfo();

      return true;
    } catch (error) {
      if (this.onErrorCallback) {
        this.onErrorCallback(error instanceof Error ? error : new Error(String(error)));
      }
      return false;
    }
  }

  public async disconnect() {
    try {
      if (this.dataCharacteristic) {
        await this.dataCharacteristic.stopNotifications();
        this.dataCharacteristic.removeEventListener("characteristicvaluechanged", this.handleNotification);
      }

      if (this.device && this.device.gatt?.connected) {
        await this.device.gatt.disconnect();
      }

      this.device = null;
      this.server = null;
      this.service = null;
      this.dataCharacteristic = null;
      this.controlCharacteristic = null;

      if (this.onConnectionChangeCallback) {
        this.onConnectionChangeCallback(false);
      }

      return true;
    } catch (error) {
      if (this.onErrorCallback) {
        this.onErrorCallback(error instanceof Error ? error : new Error(String(error)));
      }
      return false;
    }
  }

  public isConnected(): boolean {
    return !!(this.device && this.device.gatt?.connected);
  }

  public async startMeasurement() {
    try {
      const result = await this.sendCommand(CMD_START_WEIGHT_MEAS);
      // Add a small delay to ensure the command is processed
      await new Promise((resolve) => setTimeout(resolve, 100));
      return result;
    } catch (error) {
      console.error("Error starting measurement:", error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error instanceof Error ? error : new Error(String(error)));
      }
      return false;
    }
  }

  public async stopMeasurement() {
    try {
      const result = await this.sendCommand(CMD_STOP_WEIGHT_MEAS);
      // Add a small delay to ensure the command is processed
      await new Promise((resolve) => setTimeout(resolve, 100));
      return result;
    } catch (error) {
      console.error("Error stopping measurement:", error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error instanceof Error ? error : new Error(String(error)));
      }
      return false;
    }
  }

  public async tareScale() {
    try {
      const result = await this.sendCommand(CMD_TARE_SCALE);
      // Add a small delay to ensure the command is processed
      await new Promise((resolve) => setTimeout(resolve, 100));
      return result;
    } catch (error) {
      console.error("Error taring scale:", error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error instanceof Error ? error : new Error(String(error)));
      }
      return false;
    }
  }

  public async enterSleep() {
    return this.sendCommand(CMD_ENTER_SLEEP);
  }

  private async getDeviceInfo() {
    try {
      // Get firmware version
      await this.sendCommand(CMD_GET_APP_VERSION);
      // Wait a bit between commands to avoid overwhelming the device
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Get battery voltage
      await this.sendCommand(CMD_GET_BATTERY_VOLTAGE);
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Get error information
      await this.sendCommand(CMD_GET_ERROR_INFORMATION);
    } catch (error) {
      console.error("Error getting device info:", error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  private async sendCommand(command: number) {
    try {
      if (!this.controlCharacteristic) {
        throw new Error("Device not connected");
      }

      this.currentCmdRequest = command;

      // Create a promise that will resolve when the command is sent
      const writePromise = this.controlCharacteristic.writeValue(new Uint8Array([command]));

      // Create a timeout promise
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          console.warn(`Command ${command} timed out`);
          resolve(false);
        }, 2000); // 2 second timeout
      });

      // Race the write promise against the timeout
      const result = await Promise.race([writePromise.then(() => true), timeoutPromise]);

      return result;
    } catch (error) {
      console.error(`Error sending command ${command}:`, error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error instanceof Error ? error : new Error(String(error)));
      }
      return false;
    }
  }

  private handleDisconnection() {
    this.device = null;
    this.server = null;
    this.service = null;
    this.dataCharacteristic = null;
    this.controlCharacteristic = null;

    if (this.onConnectionChangeCallback) {
      this.onConnectionChangeCallback(false);
    }
  }

  private handleNotification(event: Event) {
    // Cast to unknown first, then to the expected type to avoid direct casting issues
    const target = event.target as unknown as { value: DataView };
    const value = target.value;

    if (!value) return;

    const dataView = value;
    const responseType = dataView.getUint8(0);

    try {
      if (responseType === RES_WEIGHT_MEAS) {
        const payloadSize = dataView.getUint8(1);

        // Process each measurement in the notification
        for (let i = 2; i < 2 + payloadSize; i += 8) {
          if (i + 8 <= dataView.byteLength) {
            // Extract weight (float, 4 bytes)
            const weight = dataView.getFloat32(i, true); // true for little-endian

            // Extract timestamp (uint32, 4 bytes)
            const timestamp = dataView.getUint32(i + 4, true); // true for little-endian

            if (this.onMeasurementCallback) {
              this.onMeasurementCallback({ weight, timestamp });
            }
          }
        }
      } else if (responseType === RES_LOW_PWR_WARNING) {
        console.warn("Received low battery warning");
      } else if (responseType === RES_CMD_RESPONSE) {
        if (this.currentCmdRequest === CMD_GET_APP_VERSION) {
          // Extract firmware version string
          const decoder = new TextDecoder("utf-8");
          const firmwareVersion = decoder.decode(new Uint8Array(dataView.buffer.slice(2)));
          this.deviceInfo.firmwareVersion = firmwareVersion;

          if (this.onDeviceInfoCallback) {
            this.onDeviceInfoCallback({ ...this.deviceInfo });
          }
        } else if (this.currentCmdRequest === CMD_GET_BATTERY_VOLTAGE) {
          // Extract battery voltage (uint32, 4 bytes)
          const batteryVoltage = dataView.getUint32(2, true); // true for little-endian
          this.deviceInfo.batteryVoltage = batteryVoltage;

          if (this.onDeviceInfoCallback) {
            this.onDeviceInfoCallback({ ...this.deviceInfo });
          }
        } else if (this.currentCmdRequest === CMD_GET_ERROR_INFORMATION) {
          // Extract error information string
          const decoder = new TextDecoder("utf-8");
          const errorInfo = decoder.decode(new Uint8Array(dataView.buffer.slice(2)));
          this.deviceInfo.errorInfo = errorInfo;

          if (this.onDeviceInfoCallback) {
            this.onDeviceInfoCallback({ ...this.deviceInfo });
          }
        } else if (this.currentCmdRequest === CMD_START_WEIGHT_MEAS) {
          console.log("Measurement started successfully");
        } else if (this.currentCmdRequest === CMD_STOP_WEIGHT_MEAS) {
          console.log("Measurement stopped successfully");
        }
      }
    } catch (error) {
      console.error("Error processing notification:", error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }
}

export const tindeqService = new TindeqBluetoothService();
