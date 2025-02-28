"use client";

import * as React from "react";
import DeviceConnection from "./components/DeviceConnection";
import ForceMeasurement from "./components/ForceMeasurement";
import { useTindeq } from "./hooks/useTindeq";

export default function Home() {
  useTindeq();

  return (
    <div className="min-h-screen px-8 mt-16 pb-20 gap-8 sm:px-10 font-[family-name:var(--font-geist-sans)]">
      <header className="flex flex-row justify-between items-start mb-8 max-w-4xl mx-auto">
        <div className="flex flex-col items-start w-2/3">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Unofficial Tindeq Progressor Interface</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
            Connect to your Tindeq Progressor device via Bluetooth and measure force in real-time. A Web Bluetooth API compatible browser (Chrome,
            Edge, Opera on desktop and Android) is required.
          </p>
        </div>
        <div className="w-1/3">
          <DeviceConnection />
        </div>
      </header>

      <main className="max-w-4xl mx-auto flex flex-col gap-8">
        <ForceMeasurement />
      </main>

      <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Web Bluetooth API compatible browser (Chrome, Edge, Opera on desktop and Android) required.
          <br />
          This unofficial project is not affiliated with Tindeq.
          <br />
          <a href="https://github.com/simonlandau/progressor-web-interface" target="_blank" rel="noopener noreferrer">
            View source code on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
