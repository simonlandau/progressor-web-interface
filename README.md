# Tindeq Progressor Web Interface

A web-based interface for the Tindeq Progressor, a portable digital hanging scale designed for climbers and athletes to measure finger strength.

## Features

- Connect to Tindeq Progressor devices via Web Bluetooth API
- Real-time force measurement display
- Visual graph of force over time with target line
- Maximum force tracking
- Target setting with visual feedback
- Tare functionality
- Battery level monitoring
- Automatic reconnection handling
- Dark/light mode support

## Requirements

- A Tindeq Progressor device
- A browser that supports the Web Bluetooth API:
  - Chrome, Edge, or Opera on desktop
  - Chrome on Android
  - (Not supported on iOS/Safari due to Web Bluetooth API limitations)

## Getting Started

### Online Version

The easiest way to use this application is through the hosted version at:
[https://progressor-web-interface.vercel.app/](https://progressor-web-interface.vercel.app/)

### Local Development

If you want to run the application locally or contribute to its development:

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/progressor-web-interface.git
   cd progressor-web-interface
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

The application is built with Next.js and React, using TypeScript for type safety. The architecture follows a provider + focused hooks pattern for robust state management and service initialization.

#### Core Components

- **Header**: Contains the site branding and control buttons (Bluetooth popover and theme toggle)
- **DeviceConnection**: Bluetooth connection interface displayed in a popover, handles device pairing and connection status
- **ForceMeasurement**: Displays and records force measurements in real-time with visual feedback
- **MeasurementTabs**: Tab interface for switching between Live Measurement and Programs

#### State Management Architecture

- **TindeqProvider**: App-level provider that initializes Bluetooth services and handles device communication
- **useTindeqStore**: Zustand store for global application state
- **Focused Hooks**: Composable hooks with single responsibilities:
  - `useTindeqTimer`: Handles elapsed time updates during measurement
  - `useTindeqWatchdog`: Detects and handles measurement interruptions
  - `useTindeqAutoReconnect`: Manages automatic reconnection attempts
  - `useTindeqMeasurementCleanup`: Handles measurement lifecycle and cleanup

#### Service Layer

- **TindeqBluetoothService**: Core utility that manages the Bluetooth communication protocol with the device

This architecture ensures:

- **Reliability**: Service initialization happens once at the app level
- **Composability**: Hooks can be used independently based on component needs
- **Maintainability**: Each hook has a single, clear responsibility
- **Performance**: Direct store access where no additional logic is needed

### UI Framework

The application uses:

- **shadcn/ui**: A collection of reusable components built with Radix UI and Tailwind CSS
- **Tailwind CSS**: For styling and responsive design
- **react-icons & lucide-react**: For icon components
- **Chart.js**: For data visualization
- **Zustand**: For state management

### Target Feature

The application includes a target setting feature that allows users to:

- Set a specific force target in kilograms
- See a visual target line on the force graph
- Get real-time feedback on how close they are to their target
- Visual indicators change color based on proximity to target:
  - Green: Within 1kg of target (on target)
  - Yellow: Within 3kg of target (getting closer)
  - Red: More than 3kg from target (keep trying)

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
- Target line with color feedback
- Automatic y-axis scaling based on measurements and target

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

- [Tindeq](https://tindeq.com) for creating the Progressor device and providing an open standard for device communication
- The Web Bluetooth API community
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components

## Disclaimer

This is an unofficial project and is not affiliated with or endorsed by Tindeq. The Tindeq Progressor device uses an open communication standard that allows third-party applications like this one to interface with it. While we strive to maintain compatibility with the device, this software is provided "as is" without warranty of any kind. Use at your own risk.

The Tindeq name and Progressor are trademarks of Tindeq, and their use in this project is for identification purposes only.
