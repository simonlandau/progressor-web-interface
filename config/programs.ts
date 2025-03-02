import { Program } from "@/types/program";

// Predefined training programs
export const PREDEFINED_PROGRAMS: Record<string, Program> = {
  WARM_UP: {
    id: "warm-up-program",
    name: "Warm Up Program",
    blocks: [
      {
        id: "wu-1",
        type: "pull",
        duration: 20,
        targetForce: 10,
        name: "Light Pull",
      },
      {
        id: "wu-2",
        type: "rest",
        duration: 30,
        targetForce: null,
        name: "Rest",
      },
      {
        id: "wu-3",
        type: "pull",
        duration: 20,
        targetForce: 15,
        name: "Medium Pull",
      },
      {
        id: "wu-4",
        type: "rest",
        duration: 30,
        targetForce: null,
        name: "Rest",
      },
      {
        id: "wu-5",
        type: "pull",
        duration: 20,
        targetForce: 20,
        name: "Strong Pull",
      },
    ],
  },

  MAX_HANG: {
    id: "max-hang-program",
    name: "Max Hang Program",
    blocks: [
      {
        id: "mh-1",
        type: "pull",
        duration: 10,
        targetForce: 80,
        name: "Max Hang 1",
      },
      {
        id: "mh-2",
        type: "rest",
        duration: 180,
        targetForce: null,
        name: "Rest",
      },
      {
        id: "mh-3",
        type: "pull",
        duration: 10,
        targetForce: 80,
        name: "Max Hang 2",
      },
      {
        id: "mh-4",
        type: "rest",
        duration: 180,
        targetForce: null,
        name: "Rest",
      },
      {
        id: "mh-5",
        type: "pull",
        duration: 10,
        targetForce: 80,
        name: "Max Hang 3",
      },
      {
        id: "mh-6",
        type: "rest",
        duration: 180,
        targetForce: null,
        name: "Rest",
      },
      {
        id: "mh-7",
        type: "pull",
        duration: 10,
        targetForce: 80,
        name: "Max Hang 4",
      },
      {
        id: "mh-8",
        type: "rest",
        duration: 180,
        targetForce: null,
        name: "Rest",
      },
      {
        id: "mh-9",
        type: "pull",
        duration: 10,
        targetForce: 80,
        name: "Max Hang 5",
      },
    ],
  },

  REPEATERS: {
    id: "repeaters-program",
    name: "Repeaters Program",
    blocks: [
      // Set 1
      {
        id: "rp-1-1",
        type: "pull",
        duration: 7,
        targetForce: 60,
        name: "Repeater 1.1",
      },
      {
        id: "rp-1-2",
        type: "rest",
        duration: 3,
        targetForce: null,
        name: "Short Rest",
      },
      {
        id: "rp-1-3",
        type: "pull",
        duration: 7,
        targetForce: 60,
        name: "Repeater 1.2",
      },
      {
        id: "rp-1-4",
        type: "rest",
        duration: 3,
        targetForce: null,
        name: "Short Rest",
      },
      {
        id: "rp-1-5",
        type: "pull",
        duration: 7,
        targetForce: 60,
        name: "Repeater 1.3",
      },
      {
        id: "rp-1-6",
        type: "rest",
        duration: 3,
        targetForce: null,
        name: "Short Rest",
      },
      {
        id: "rp-1-7",
        type: "pull",
        duration: 7,
        targetForce: 60,
        name: "Repeater 1.4",
      },
      {
        id: "rp-1-8",
        type: "rest",
        duration: 3,
        targetForce: null,
        name: "Short Rest",
      },
      {
        id: "rp-1-9",
        type: "pull",
        duration: 7,
        targetForce: 60,
        name: "Repeater 1.5",
      },
      {
        id: "rp-1-10",
        type: "rest",
        duration: 3,
        targetForce: null,
        name: "Short Rest",
      },
      {
        id: "rp-1-11",
        type: "pull",
        duration: 7,
        targetForce: 60,
        name: "Repeater 1.6",
      },
      // Long rest between sets
      {
        id: "rp-rest-1",
        type: "rest",
        duration: 180,
        targetForce: null,
        name: "Long Rest",
      },
      // Set 2 (repeat)
      {
        id: "rp-2-1",
        type: "pull",
        duration: 7,
        targetForce: 60,
        name: "Repeater 2.1",
      },
      {
        id: "rp-2-2",
        type: "rest",
        duration: 3,
        targetForce: null,
        name: "Short Rest",
      },
      {
        id: "rp-2-3",
        type: "pull",
        duration: 7,
        targetForce: 60,
        name: "Repeater 2.2",
      },
      {
        id: "rp-2-4",
        type: "rest",
        duration: 3,
        targetForce: null,
        name: "Short Rest",
      },
      {
        id: "rp-2-5",
        type: "pull",
        duration: 7,
        targetForce: 60,
        name: "Repeater 2.3",
      },
      {
        id: "rp-2-6",
        type: "rest",
        duration: 3,
        targetForce: null,
        name: "Short Rest",
      },
      {
        id: "rp-2-7",
        type: "pull",
        duration: 7,
        targetForce: 60,
        name: "Repeater 2.4",
      },
      {
        id: "rp-2-8",
        type: "rest",
        duration: 3,
        targetForce: null,
        name: "Short Rest",
      },
      {
        id: "rp-2-9",
        type: "pull",
        duration: 7,
        targetForce: 60,
        name: "Repeater 2.5",
      },
      {
        id: "rp-2-10",
        type: "rest",
        duration: 3,
        targetForce: null,
        name: "Short Rest",
      },
      {
        id: "rp-2-11",
        type: "pull",
        duration: 7,
        targetForce: 60,
        name: "Repeater 2.6",
      },
    ],
  },

  CUSTOM: {
    id: "custom-program",
    name: "Custom Program",
    blocks: [],
  },
};

// Helper function to get a deep copy of a predefined program
export function getPredefinedProgram(programKey: keyof typeof PREDEFINED_PROGRAMS): Program {
  const program = PREDEFINED_PROGRAMS[programKey];
  return JSON.parse(JSON.stringify(program));
}
