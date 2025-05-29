"use client";

import * as React from "react";
import MeasurementTabs from "./components/MeasurementTabs";
import { useTindeqTimer } from "./hooks/useTindeqTimer";
import { useTindeqWatchdog } from "./hooks/useTindeqWatchdog";
import { useTindeqAutoReconnect } from "./hooks/useTindeqAutoReconnect";
import { useTindeqMeasurementCleanup } from "./hooks/useTindeqMeasurementCleanup";

export default function Home() {
  // Use focused hooks for specific functionality
  useTindeqTimer();
  useTindeqWatchdog();
  useTindeqAutoReconnect();
  useTindeqMeasurementCleanup();

  return (
    <div className="px-8 pt-8 pb-20 gap-8 sm:px-10 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-4xl mx-auto flex flex-col gap-8">
        <MeasurementTabs />
      </main>

      <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Web Bluetooth API compatible browser (Chrome, Edge, Opera on desktop and Android) required.
          <br />
          This unofficial project is not affiliated with Tindeq.
          <br />
        </p>
      </footer>
    </div>
  );
}
