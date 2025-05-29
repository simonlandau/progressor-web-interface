export type Unit = "kg" | "lbs";

export const UNITS: Record<Unit, { label: string; symbol: string }> = {
  kg: { label: "Kilograms", symbol: "kg" },
  lbs: { label: "Pounds", symbol: "lbs" },
};

// Convert kg to lbs
export const kgToLbs = (kg: number): number => kg * 2.20462;

// Convert lbs to kg
export const lbsToKg = (lbs: number): number => lbs / 2.20462;

// Convert from kg to the specified unit
export const convertFromKg = (kg: number, unit: Unit): number => {
  return unit === "lbs" ? kgToLbs(kg) : kg;
};

// Convert to kg from the specified unit
export const convertToKg = (value: number, unit: Unit): number => {
  return unit === "lbs" ? lbsToKg(value) : value;
};

// Format a force value with the appropriate unit symbol and precision
export const formatForce = (value: number | null, unit: Unit, precision: number = 1): string => {
  if (value === null) return "-";
  const convertedValue = convertFromKg(value, unit);
  return `${convertedValue.toFixed(precision)} ${UNITS[unit].symbol}`;
};
