"use client";

import { useState } from "react";
import DeviceConnection from "./components/DeviceConnection";
import ForceMeasurement from "./components/ForceMeasurement";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);

  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
  };

  return (
    <div className="min-h-screen p-8 pb-20 gap-8 sm:p-10 font-[family-name:var(--font-geist-sans)]">
      <header className="flex flex-col items-center mb-8">
        <div className="flex items-center mb-4">
          <h1 className="text-2xl font-bold">Tindeq Progressor Web GUI</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-center max-w-2xl">
          Connect to your Tindeq Progressor device via Bluetooth and measure force in real-time.
        </p>
      </header>

      <main className="max-w-4xl mx-auto flex flex-col gap-8">
        <DeviceConnection onConnectionChange={handleConnectionChange} />
        <ForceMeasurement isConnected={isConnected} />
      </main>

      <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          This application requires a browser that supports Web Bluetooth API.
          <br />
          Compatible with Chrome, Edge, and Opera on desktop and Android.
        </p>
      </footer>
    </div>
  );
}
