// Types for program blocks
export type BlockType = "pull" | "rest";

export interface ProgramBlock {
  id: string;
  type: BlockType;
  duration: number; // Duration in seconds
  targetForce: number | null; // Target force in kg (null for free pulls)
  name: string;
}

export interface Program {
  id: string;
  name: string;
  blocks: ProgramBlock[];
}

// Add import for PREDEFINED_PROGRAMS
import { PREDEFINED_PROGRAMS } from "@/config/programs";

export interface ProgramState {
  programs: Program[];
  activeProgram: Program | null;
  currentBlockIndex: number;
  isRunning: boolean;
  remainingTime: number;
  addProgram: (program: Program) => void;
  updateProgram: (program: Program) => void;
  deleteProgram: (id: string) => void;
  setActiveProgram: (program: Program | null) => void;
  startProgram: () => void;
  stopProgram: () => void;
  nextBlock: () => void;
  resetProgram: () => void;
  loadPredefinedProgram: (programKey: keyof typeof PREDEFINED_PROGRAMS) => void;
}
