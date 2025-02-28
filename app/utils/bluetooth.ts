// Tindeq Progressor Bluetooth Service
import "../../types/bluetooth"; // Import Web Bluetooth API types
import {
  MeasurementData,
  DeviceInfo,
  ProgressorCommand,
  ProgressorResponse,
  PROGRESSOR_SERVICE_UUID,
  DATA_CHAR_UUID,
  CTRL_POINT_CHAR_UUID,
} from "../../types/tindeq";
import { CommandQueueItem } from "../../types/bluetooth";

// Use enum values from imported types - only destructure what we need
const { TARE_SCALE, START_WEIGHT_MEAS, STOP_WEIGHT_MEAS, ENTER_SLEEP, GET_APP_VERSION, GET_ERROR_INFORMATION, GET_BATTERY_VOLTAGE } =
  ProgressorCommand;

const { CMD_RESPONSE, WEIGHT_MEAS, LOW_PWR_WARNING } = ProgressorResponse;

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

  // Command queue to prevent "GATT operation already in progress" errors
  private commandQueue: CommandQueueItem[] = [];
  private isProcessingQueue = false;

  constructor() {
    this.handleDisconnection = this.handleDisconnection.bind(this);
    this.handleNotification = this.handleNotification.bind(this);
    this.processCommandQueue = this.processCommandQueue.bind(this);
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
      // Clear the command queue
      this.commandQueue = [];
      this.isProcessingQueue = false;

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
    return this.queueCommand(START_WEIGHT_MEAS);
  }

  public async stopMeasurement() {
    return this.queueCommand(STOP_WEIGHT_MEAS);
  }

  public async tareScale() {
    return this.queueCommand(TARE_SCALE);
  }

  public async enterSleep() {
    return this.queueCommand(ENTER_SLEEP);
  }

  private async getDeviceInfo() {
    try {
      // Get firmware version
      await this.queueCommand(GET_APP_VERSION);
      // Wait a bit between commands to avoid overwhelming the device
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Get battery voltage
      await this.queueCommand(GET_BATTERY_VOLTAGE);
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Get error information
      await this.queueCommand(GET_ERROR_INFORMATION);
    } catch (error) {
      console.error("Error getting device info:", error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  // Add command to queue and process it when possible
  private queueCommand(command: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      // Add command to queue
      this.commandQueue.push({ command, resolve, reject });

      // Start processing queue if not already processing
      if (!this.isProcessingQueue) {
        this.processCommandQueue();
      }
    });
  }

  // Process commands in queue sequentially
  private async processCommandQueue() {
    if (this.isProcessingQueue || this.commandQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.commandQueue.length > 0) {
        const item = this.commandQueue[0];

        try {
          const result = await this.sendCommand(item.command);
          item.resolve(result);
        } catch (error) {
          item.reject(error instanceof Error ? error : new Error(String(error)));
        }

        // Remove the processed command
        this.commandQueue.shift();

        // Add a small delay between commands
        if (this.commandQueue.length > 0) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      console.error("Error processing command queue:", error);
    } finally {
      this.isProcessingQueue = false;
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

    // Clear the command queue
    this.commandQueue = [];
    this.isProcessingQueue = false;

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
      if (responseType === WEIGHT_MEAS) {
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
      } else if (responseType === LOW_PWR_WARNING) {
        console.warn("Received low battery warning");
      } else if (responseType === CMD_RESPONSE) {
        if (this.currentCmdRequest === GET_APP_VERSION) {
          // Extract firmware version string
          const decoder = new TextDecoder("utf-8");
          const firmwareVersion = decoder.decode(new Uint8Array(dataView.buffer.slice(2)));
          this.deviceInfo.firmwareVersion = firmwareVersion;

          if (this.onDeviceInfoCallback) {
            this.onDeviceInfoCallback({ ...this.deviceInfo });
          }
        } else if (this.currentCmdRequest === GET_BATTERY_VOLTAGE) {
          // Extract battery voltage (uint32, 4 bytes)
          const batteryVoltage = dataView.getUint32(2, true); // true for little-endian
          this.deviceInfo.batteryVoltage = batteryVoltage;

          if (this.onDeviceInfoCallback) {
            this.onDeviceInfoCallback({ ...this.deviceInfo });
          }
        } else if (this.currentCmdRequest === GET_ERROR_INFORMATION) {
          // Extract error information string
          const decoder = new TextDecoder("utf-8");
          const errorInfo = decoder.decode(new Uint8Array(dataView.buffer.slice(2)));
          this.deviceInfo.errorInfo = errorInfo;

          if (this.onDeviceInfoCallback) {
            this.onDeviceInfoCallback({ ...this.deviceInfo });
          }
        } else if (this.currentCmdRequest === START_WEIGHT_MEAS) {
          console.log("Measurement started successfully");
        } else if (this.currentCmdRequest === STOP_WEIGHT_MEAS) {
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

// Re-export types for convenience
export type { MeasurementData, DeviceInfo };
