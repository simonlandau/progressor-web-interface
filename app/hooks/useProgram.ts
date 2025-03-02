import { useEffect, useCallback } from "react";
import useTindeqStore from "../store/tindeqStore";
import useProgramStore from "../store/programStore";
import { Program, ProgramBlock } from "@/types/program";
import { PREDEFINED_PROGRAMS } from "@/config/programs";

// Re-export types for use in components
/**
 * Custom hook for managing training programs
 */
export function useProgram() {
  const programState = useProgramStore();
  const { startMeasurement, stopMeasurement, resetMeasurements, setTargetValue, isMeasuring } = useTindeqStore();

  // Generate a unique ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Create a new program
  const createProgram = (name: string) => {
    const newProgram: Program = {
      id: generateId(),
      name,
      blocks: [],
    };
    programState.addProgram(newProgram);
    return newProgram;
  };

  // Add a block to a program
  const addBlock = (programId: string, block: Omit<ProgramBlock, "id">) => {
    const program = programState.programs.find((p) => p.id === programId);
    if (!program) return;

    const newBlock: ProgramBlock = {
      ...block,
      id: generateId(),
    };

    const updatedProgram = {
      ...program,
      blocks: [...program.blocks, newBlock],
    };

    programState.updateProgram(updatedProgram);
    return updatedProgram;
  };

  // Update a block in a program
  const updateBlock = (programId: string, blockId: string, updates: Partial<Omit<ProgramBlock, "id">>) => {
    const program = programState.programs.find((p) => p.id === programId);
    if (!program) return;

    const updatedProgram = {
      ...program,
      blocks: program.blocks.map((block) => (block.id === blockId ? { ...block, ...updates } : block)),
    };

    programState.updateProgram(updatedProgram);
    return updatedProgram;
  };

  // Delete a block from a program
  const deleteBlock = (programId: string, blockId: string) => {
    const program = programState.programs.find((p) => p.id === programId);
    if (!program) return;

    const updatedProgram = {
      ...program,
      blocks: program.blocks.filter((block) => block.id !== blockId),
    };

    programState.updateProgram(updatedProgram);
    return updatedProgram;
  };

  // Reorder blocks in a program
  const reorderBlocks = (programId: string, newOrder: string[]) => {
    const program = programState.programs.find((p) => p.id === programId);
    if (!program) return;

    // Create a map of block IDs to blocks for quick lookup
    const blockMap = program.blocks.reduce((map, block) => {
      map[block.id] = block;
      return map;
    }, {} as Record<string, ProgramBlock>);

    // Create a new array of blocks in the new order
    const reorderedBlocks = newOrder.map((id) => blockMap[id]).filter(Boolean);

    const updatedProgram = {
      ...program,
      blocks: reorderedBlocks,
    };

    programState.updateProgram(updatedProgram);
    return updatedProgram;
  };

  // Handle timer for program execution
  useEffect(() => {
    if (!programState.isRunning) return;

    const timer = setInterval(() => {
      useProgramStore.setState((state) => {
        // If we're not running, clear the interval
        if (!state.isRunning) return state;

        const newRemainingTime = state.remainingTime - 1;

        // If the block is complete, move to the next block
        if (newRemainingTime <= 0) {
          // Stop the current measurement if needed
          if (isMeasuring) {
            stopMeasurement();
          }

          // Move to the next block
          const nextIndex = state.currentBlockIndex + 1;

          // If we've reached the end of the program
          if (!state.activeProgram || nextIndex >= state.activeProgram.blocks.length) {
            return {
              isRunning: false,
              currentBlockIndex: 0,
              remainingTime: state.activeProgram?.blocks[0]?.duration || 0,
            };
          }

          // Set up the next block
          const nextBlock = state.activeProgram.blocks[nextIndex];

          // If the next block is a pull, start measurement
          if (nextBlock.type === "pull") {
            // Set target if specified
            setTargetValue(nextBlock.targetForce);

            // Start a new measurement
            resetMeasurements();
            startMeasurement();
          }

          return {
            currentBlockIndex: nextIndex,
            remainingTime: nextBlock.duration,
          };
        }

        return { remainingTime: newRemainingTime };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [programState.isRunning, isMeasuring, startMeasurement, stopMeasurement, resetMeasurements, setTargetValue]);

  // Start the active program
  const startActiveProgram = useCallback(() => {
    if (!programState.activeProgram || programState.isRunning) return;

    // Reset measurements before starting
    resetMeasurements();

    // Set up the first block
    const firstBlock = programState.activeProgram.blocks[0];

    // If the first block is a pull, start measurement and set target
    if (firstBlock && firstBlock.type === "pull") {
      setTargetValue(firstBlock.targetForce);
      startMeasurement();
    }

    programState.startProgram();
  }, [programState, resetMeasurements, setTargetValue, startMeasurement]);

  // Stop the active program
  const stopActiveProgram = useCallback(() => {
    if (!programState.isRunning) return;

    // Stop measurement if running
    if (isMeasuring) {
      stopMeasurement();
    }

    programState.stopProgram();
  }, [programState, isMeasuring, stopMeasurement]);

  // Reset the active program
  const resetActiveProgram = useCallback(() => {
    // Stop measurement if running
    if (isMeasuring) {
      stopMeasurement();
    }

    // Reset the program state
    programState.resetProgram();
  }, [programState, isMeasuring, stopMeasurement]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Get the current block
  const getCurrentBlock = () => {
    if (!programState.activeProgram) return null;
    return programState.activeProgram.blocks[programState.currentBlockIndex] || null;
  };

  // Load a predefined program
  const loadPredefinedProgram = useCallback(
    (programKey: keyof typeof PREDEFINED_PROGRAMS) => {
      programState.loadPredefinedProgram(programKey);
    },
    [programState]
  );

  // Create a custom program (renamed from createDefaultProgram)
  const createCustomProgram = () => {
    const program = createProgram("Custom Program");
    return program;
  };

  return {
    ...programState,
    createProgram,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    startActiveProgram,
    stopActiveProgram,
    resetActiveProgram,
    formatTime,
    getCurrentBlock,
    createCustomProgram,
    loadPredefinedProgram,
  };
}
