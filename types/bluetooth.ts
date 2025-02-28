// Web Bluetooth API types
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

// Command queue item interface
export interface CommandQueueItem {
  command: number;
  resolve: (value: boolean) => void;
  reject: (reason: Error) => void;
}
