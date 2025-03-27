import { create } from "zustand";
import { ProgramState } from "@/types/program";
import { getPredefinedProgram, PREDEFINED_PROGRAMS } from "@/config/programs";

// Create a Zustand store for program state
const useProgramStore = create<ProgramState>((set, get) => ({
  programs: [],
  activeProgram: null,
  currentBlockIndex: 0,
  isRunning: false,
  remainingTime: 0,

  addProgram: (program) => {
    set((state) => ({
      programs: [...state.programs, program],
    }));
  },

  updateProgram: (program) => {
    set((state) => ({
      programs: state.programs.map((p) => (p.id === program.id ? program : p)),
      activeProgram: state.activeProgram?.id === program.id ? program : state.activeProgram,
    }));
  },

  deleteProgram: (id) => {
    set((state) => ({
      programs: state.programs.filter((p) => p.id !== id),
      activeProgram: state.activeProgram?.id === id ? null : state.activeProgram,
    }));
  },

  setActiveProgram: (program) => {
    set({
      activeProgram: program,
      currentBlockIndex: 0,
      isRunning: false,
      remainingTime: program?.blocks[0]?.duration || 0,
    });
  },

  startProgram: () => {
    const state = get();
    if (!state.activeProgram || state.activeProgram.blocks.length === 0) return;

    set({
      isRunning: true,
      remainingTime: state.activeProgram.blocks[state.currentBlockIndex].duration,
    });
  },

  stopProgram: () => {
    set({ isRunning: false });
  },

  nextBlock: () => {
    set((state) => {
      const nextIndex = state.currentBlockIndex + 1;

      // If we've reached the end of the program
      if (!state.activeProgram || nextIndex >= state.activeProgram.blocks.length) {
        return {
          isRunning: false,
          currentBlockIndex: 0,
          remainingTime: state.activeProgram?.blocks[0]?.duration || 0,
        };
      }

      // Move to the next block
      return {
        currentBlockIndex: nextIndex,
        remainingTime: state.activeProgram.blocks[nextIndex].duration,
      };
    });
  },

  resetProgram: () => {
    set({
      currentBlockIndex: 0,
      isRunning: false,
      remainingTime: get().activeProgram?.blocks[0]?.duration || 0,
    });
  },

  loadPredefinedProgram: (programKey: keyof typeof PREDEFINED_PROGRAMS) => {
    const program = getPredefinedProgram(programKey);

    // Check if this program already exists in the store
    const existingProgram = get().programs.find((p) => p.id === program.id);

    if (!existingProgram) {
      // Add the program if it doesn't exist
      get().addProgram(program);
    }

    // Set as active program
    get().setActiveProgram(program);
  },
}));

export default useProgramStore;
