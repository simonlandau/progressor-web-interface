import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Unit } from "../utils/units";

interface SettingsState {
  // UI preferences
  unit: Unit;

  // Actions
  setUnit: (unit: Unit) => void;
}

const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default preferences
      unit: "kg",

      // Actions
      setUnit: (unit: Unit) => set({ unit }),
    }),
    {
      name: "progressor-settings",
    }
  )
);

export default useSettingsStore;
