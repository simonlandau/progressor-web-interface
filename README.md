# Tindeq Progressor Web GUI

A web-based interface for the Tindeq Progressor, a portable digital hanging scale designed for climbers and athletes to measure finger strength.

<!-- Replace the placeholder with an actual screenshot of your application -->

![Tindeq Progressor Web GUI](public/screenshot.png)

## Features

- Connect to Tindeq Progressor devices via Web Bluetooth API
- Real-time force measurement display
- Visual graph of force over time
- Maximum force tracking
- Tare functionality
- Battery level monitoring
- Automatic reconnection handling

## Requirements

- A Tindeq Progressor device
- A browser that supports the Web Bluetooth API:
  - Chrome, Edge, or Opera on desktop
  - Chrome on Android
  - (Not supported on iOS/Safari due to Web Bluetooth API limitations)

## Getting Started

### Online Version

The easiest way to use this application is through the hosted version at:
[https://tindeq.example.com](https://tindeq.example.com)

### Local Development

If you want to run the application locally or contribute to its development:

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/tindeq-web-gui.git
   cd tindeq-web-gui
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Building for Production

To create a production build:

```bash
npm run build
npm run start
```

## How It Works

This application uses the Web Bluetooth API to communicate with the Tindeq Progressor device. The communication protocol is based on the Tindeq Progressor's Bluetooth GATT service and characteristics.

### Architecture

The application is built with Next.js and React, using TypeScript for type safety. The main components are:

- **DeviceConnection**: Handles Bluetooth connection to the Tindeq device, displays connection status, battery level, and firmware version
- **ForceMeasurement**: Displays and records force measurements in real-time, showing current and maximum force values along with a visual graph
- **TindeqBluetoothService**: Core utility that manages the Bluetooth communication protocol with the device

### Bluetooth Communication

The Tindeq Progressor uses a custom Bluetooth GATT service with the following characteristics:

- **Service UUID**: `7e4e1701-1ea6-40c9-9dcc-13d34ffead57`
- **Data Characteristic**: `7e4e1702-1ea6-40c9-9dcc-13d34ffead57` - Used to receive measurement data
- **Control Point Characteristic**: `7e4e1703-1ea6-40c9-9dcc-13d34ffead57` - Used to send commands to the device

The application sends commands to the device through the Control Point characteristic, such as:

- Start/stop measurement
- Tare the scale
- Request battery voltage
- Request firmware version

The device sends measurement data through the Data characteristic, which the application processes and displays in real-time.

#### Data Sampling

The Tindeq Progressor device uses a notification-based approach rather than polling. When measurement is started, the device automatically sends data notifications whenever new measurements are available. The application doesn't poll at a fixed rate; instead, it receives data at the native sampling rate of the Tindeq device (approximately 10Hz or 10 samples per second).

The application includes a watchdog timer that checks for data interruptions every second and will attempt to restart the measurement if no data is received for more than 3 seconds.

### Data Visualization

Force measurements are visualized using Chart.js, which provides:

- Real-time updating line chart
- Time-based x-axis (seconds)
- Force-based y-axis (kilograms)

The application limits the displayed data points to maintain performance while providing a smooth visual representation of the force applied over time.

### Error Handling and Reconnection

The application includes robust error handling for Bluetooth connectivity issues:

- Automatic reconnection attempts when connection is lost
- Clear error messages for common Bluetooth issues
- Watchdog timer to detect and recover from measurement interruptions

### Browser Compatibility

Due to the reliance on the Web Bluetooth API, the application is compatible with:

- Chrome, Edge, and Opera on desktop
- Chrome on Android
- Not supported on Safari/iOS (Web Bluetooth API limitation)

## Acknowledgments

- [Tindeq](https://tindeq.com) for creating the Progressor device
- The Web Bluetooth API community

## Disclaimer

This is an unofficial project and is not affiliated with or endorsed by Tindeq. Use at your own risk.
