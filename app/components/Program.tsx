"use client";

import { useState, useEffect } from "react";
import { FaPlay, FaStop, FaPlus, FaTrash, FaEdit, FaClock, FaDumbbell, FaRedo } from "react-icons/fa";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProgram } from "../hooks/useProgram";
import { BlockType, ProgramBlock } from "@/types/program";
import useTindeqStore from "../store/tindeqStore";
import { useTarget } from "../hooks/useTarget";
import { AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

export default function Program() {
  const {
    programs,
    activeProgram,
    isRunning,
    currentBlockIndex,
    remainingTime,
    addBlock,
    updateBlock,
    deleteBlock,
    setActiveProgram,
    startActiveProgram,
    stopActiveProgram,
    resetActiveProgram,
    formatTime,
    getCurrentBlock,
    createCustomProgram,
    loadPredefinedProgram,
  } = useProgram();

  const { isConnected, currentForce } = useTindeqStore();
  const { TARGET_TOLERANCE, TARGET_TOLERANCE_WARNING } = useTarget();

  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ProgramBlock | null>(null);
  const [blockForm, setBlockForm] = useState<{
    name: string;
    type: BlockType;
    duration: number;
    targetForce: string;
  }>({
    name: "",
    type: "pull",
    duration: 10,
    targetForce: "",
  });

  // Initialize with a custom program if none exists
  useEffect(() => {
    if (programs.length === 0) {
      const customProgram = createCustomProgram();
      setActiveProgram(customProgram);
    }
  }, [programs, createCustomProgram, setActiveProgram]);

  // Handle program selection
  const handleProgramSelect = (value: string) => {
    if (value === "custom-program") {
      // Find existing custom program or create a new one
      loadPredefinedProgram("CUSTOM");
    } else if (value === "warm-up-program") {
      loadPredefinedProgram("WARM_UP");
    } else if (value === "max-hang-program") {
      loadPredefinedProgram("MAX_HANG");
    } else if (value === "repeaters-program") {
      loadPredefinedProgram("REPEATERS");
    }
  };

  const handleAddBlock = () => {
    if (!activeProgram) return;

    addBlock(activeProgram.id, {
      name: blockForm.name,
      type: blockForm.type,
      duration: blockForm.duration,
      targetForce: blockForm.type === "pull" && blockForm.targetForce ? parseFloat(blockForm.targetForce) : null,
    });

    resetBlockForm();
    setShowBlockDialog(false);
  };

  const handleUpdateBlock = () => {
    if (!activeProgram || !editingBlock) return;

    updateBlock(activeProgram.id, editingBlock.id, {
      name: blockForm.name,
      type: blockForm.type,
      duration: blockForm.duration,
      targetForce: blockForm.type === "pull" && blockForm.targetForce ? parseFloat(blockForm.targetForce) : null,
    });

    resetBlockForm();
    setEditingBlock(null);
    setShowBlockDialog(false);
  };

  const handleEditBlock = (block: ProgramBlock) => {
    setEditingBlock(block);
    setBlockForm({
      name: block.name,
      type: block.type,
      duration: block.duration,
      targetForce: block.targetForce !== null ? block.targetForce.toString() : "",
    });
    setShowBlockDialog(true);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!activeProgram) return;
    deleteBlock(activeProgram.id, blockId);
  };

  const resetBlockForm = () => {
    setBlockForm({
      name: "",
      type: "pull",
      duration: 10,
      targetForce: "",
    });
  };

  const currentBlock = getCurrentBlock();

  // Calculate pull count
  const getPullCount = () => {
    if (!activeProgram) return { current: 0, total: 0 };

    const pullBlocks = activeProgram.blocks.filter((block) => block.type === "pull");
    const currentPullIndex = activeProgram.blocks.slice(0, currentBlockIndex + 1).filter((block) => block.type === "pull").length;

    return {
      current: currentBlock?.type === "pull" ? currentPullIndex : currentPullIndex,
      total: pullBlocks.length,
    };
  };

  const pullCount = getPullCount();

  // Calculate progress percentage toward target
  const getTargetProgress = () => {
    if (!currentBlock || currentBlock.type !== "pull" || !currentBlock.targetForce || !currentForce) {
      return 0;
    }

    const progress = (currentForce / currentBlock.targetForce) * 100;
    return Math.min(Math.max(progress, 0), 100); // Clamp between 0-100
  };

  // Get progress bar color based on proximity to target
  const getProgressBarColor = () => {
    if (!currentBlock || currentBlock.type !== "pull" || !currentBlock.targetForce || !currentForce) {
      return "h-2";
    }

    const distance = Math.abs(currentForce - currentBlock.targetForce);

    if (distance <= TARGET_TOLERANCE) return "h-2 [&>div]:bg-green-500"; // Green when within tolerance
    if (distance <= TARGET_TOLERANCE_WARNING) return "h-2 [&>div]:bg-yellow-500"; // Yellow when within warning
    return "h-2 [&>div]:bg-red-500"; // Red when outside warning
  };

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="mb-4 md:mb-0 w-full">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-2">
                <span className="text-sm text-muted-foreground">Time Remaining</span>
                <div className="text-3xl font-bold">{formatTime(remainingTime)}</div>
              </div>
              {currentBlock && (
                <div className="p-2">
                  <span className="text-sm text-muted-foreground">Current Block</span>
                  <div className="text-xl font-bold flex items-center">
                    {currentBlock.type === "pull" ? <FaDumbbell className="mr-2 text-blue-500" /> : <FaClock className="mr-2 text-green-500" />}
                    {currentBlock.name}
                    {currentBlock.type === "pull" && currentBlock.targetForce && (
                      <span className="ml-2 text-sm font-normal">({currentBlock.targetForce} kg)</span>
                    )}
                  </div>
                </div>
              )}

              {isRunning && (
                <div className="p-2">
                  <span className="text-sm text-muted-foreground">Pull</span>
                  <div className="text-3xl font-bold">
                    {pullCount.current} of {pullCount.total}
                  </div>
                </div>
              )}

              {isRunning && currentBlock?.type === "pull" && (
                <div className="p-2">
                  <span className="text-sm text-muted-foreground">Current Force</span>
                  <div className="text-3xl font-bold">{currentForce ? currentForce.toFixed(1) : 0} kg</div>
                </div>
              )}
            </div>

            {currentBlock?.type === "pull" && currentBlock.targetForce && isRunning && (
              <div className="w-full mt-2">
                <Progress value={getTargetProgress()} className={getProgressBarColor()} />
              </div>
            )}
          </div>

          <div className="flex space-x-2 mb-auto">
            {!isRunning ? (
              <>
                <Button
                  onClick={resetActiveProgram}
                  disabled={
                    !activeProgram ||
                    activeProgram.blocks.length === 0 ||
                    (currentBlockIndex === 0 && remainingTime === (activeProgram?.blocks[0]?.duration || 0))
                  }
                  variant="outline"
                >
                  <FaRedo className="mr-2" />
                  <span>Reset</span>
                </Button>
                <Button
                  onClick={startActiveProgram}
                  disabled={!isConnected || !activeProgram || activeProgram.blocks.length === 0}
                  variant={!isConnected ? "outline" : "default"}
                >
                  <FaPlay className="mr-2" />
                  <span>Start Program</span>
                </Button>
              </>
            ) : (
              <Button onClick={stopActiveProgram} variant="destructive">
                <FaStop className="mr-2" />
                <span>Stop Program</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Select value={activeProgram?.id} onValueChange={handleProgramSelect} disabled={isRunning}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warm-up-program">Warm Up Program</SelectItem>
                <SelectItem value="max-hang-program">Max Hang Program</SelectItem>
                <SelectItem value="repeaters-program">Repeaters Program</SelectItem>
                <SelectItem value="custom-program">Custom Program</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2">
            <Dialog
              open={showBlockDialog}
              onOpenChange={(open: boolean) => {
                if (!open) {
                  resetBlockForm();
                  setEditingBlock(null);
                }
                setShowBlockDialog(open);
              }}
            >
              <DialogTrigger asChild>
                <Button variant="default" size="sm" disabled={!activeProgram || isRunning}>
                  <FaPlus className="mr-2" />
                  Add Block
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBlock ? "Edit Block" : "Add New Block"}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div>
                    <Label htmlFor="block-name">Block Name</Label>
                    <Input
                      id="block-name"
                      value={blockForm.name}
                      onChange={(e) => setBlockForm({ ...blockForm, name: e.target.value })}
                      className="mt-2"
                      placeholder="e.g., Warm-up Pull"
                    />
                  </div>

                  <div>
                    <Label htmlFor="block-type">Block Type</Label>
                    <Select value={blockForm.type} onValueChange={(value: BlockType) => setBlockForm({ ...blockForm, type: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pull">Pull</SelectItem>
                        <SelectItem value="rest">Rest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="block-duration">Duration (seconds)</Label>
                    <Input
                      id="block-duration"
                      type="number"
                      min="1"
                      value={blockForm.duration}
                      onChange={(e) => setBlockForm({ ...blockForm, duration: parseInt(e.target.value) || 10 })}
                      className="mt-2"
                    />
                  </div>

                  {blockForm.type === "pull" && (
                    <div>
                      <Label htmlFor="block-target">Target Force (kg, optional)</Label>
                      <Input
                        id="block-target"
                        type="number"
                        min="0"
                        step="0.1"
                        value={blockForm.targetForce}
                        onChange={(e) => setBlockForm({ ...blockForm, targetForce: e.target.value })}
                        className="mt-2"
                        placeholder="Leave empty for free pull"
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetBlockForm();
                      setEditingBlock(null);
                      setShowBlockDialog(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={editingBlock ? handleUpdateBlock : handleAddBlock}>{editingBlock ? "Update" : "Add"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {!activeProgram && (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium">No Program Selected</h3>
            <p className="mt-2">Create a new program or select an existing one to get started.</p>
          </div>
        )}

        {activeProgram && activeProgram.blocks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium">No Blocks Added</h3>
            <p className="mt-2">Add blocks to your program to get started.</p>
          </div>
        )}

        {activeProgram && activeProgram.blocks.length > 0 && (
          <div className="space-y-2 mt-4">
            <h3 className="text-lg font-medium mb-2">Program Blocks</h3>
            {activeProgram.blocks.map((block, index) => (
              <div
                key={block.id}
                className={`flex items-center justify-between p-3 rounded-md border ${
                  currentBlockIndex === index && isRunning ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-gray-200 dark:border-gray-800"
                }`}
              >
                <div className="flex items-center">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full mr-3 text-white bg-gray-700">{index + 1}</div>
                  <div>
                    <div className="flex items-center">
                      {block.type === "pull" ? <FaDumbbell className="mr-2 text-blue-500" /> : <FaClock className="mr-2 text-green-500" />}
                      <span className="font-medium">{block.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatTime(block.duration)} {block.type === "pull" && block.targetForce && `• ${block.targetForce} kg`}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEditBlock(block)} disabled={isRunning}>
                    <FaEdit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteBlock(block.id)} disabled={isRunning}>
                    <FaTrash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
