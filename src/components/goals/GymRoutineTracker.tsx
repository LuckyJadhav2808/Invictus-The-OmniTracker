"use client";

import { useState, useMemo } from "react";
import { Dumbbell, Plus, Trash2, Edit3, CheckCircle2, Circle, Flame, Sparkles, Layers } from "lucide-react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { TemplateSelectionModal, TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { GYM_TEMPLATE_PACKS } from "@/lib/templates-data";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useGymRoutines, useAddGymRoutine, useUpdateGymRoutine, useDeleteGymRoutine } from "@/lib/queries/gym";
import { useExerciseLibrary } from "@/lib/queries/exercises";
import { Search } from "lucide-react";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export function GymRoutineTracker() {
  // Determine current day of week (e.g. "Monday")
  const currentDayName = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const idx = new Date().getDay();
    return days[idx] as typeof DAYS_OF_WEEK[number];
  }, []);

  const [selectedDay, setSelectedDay] = useState<typeof DAYS_OF_WEEK[number]>(currentDayName);

  const { data: routines = [], isLoading } = useGymRoutines();
  const addRoutineMutation = useAddGymRoutine();
  const updateRoutineMutation = useUpdateGymRoutine();
  const deleteRoutineMutation = useDeleteGymRoutine();

  // Active routine for selected day
  const currentRoutine = useMemo(() => {
    return routines.find((r: any) => r.dayOfWeek === selectedDay);
  }, [routines, selectedDay]);

  // Modals state
  const [isRoutineTitleOpen, setIsRoutineTitleOpen] = useState(false);
  const [routineTitleInput, setRoutineTitleInput] = useState("");

  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);

  const handleApplyGymPack = (pack: TemplatePack) => {
    const newExercises = pack.items.map((item, idx) => ({
      id: "ex_" + Date.now() + "_" + idx,
      name: item.title,
      machine: "Free Weight / Cable",
      targetMuscle: "Hypertrophy",
      sets: [
        { setNumber: 1, reps: 10, weightKg: 20, completed: false },
        { setNumber: 2, reps: 10, weightKg: 20, completed: false },
        { setNumber: 3, reps: 10, weightKg: 20, completed: false },
      ],
      notes: item.desc || "",
    }));

    if (currentRoutine) {
      updateRoutineMutation.mutate({
        id: currentRoutine.id,
        exercises: [...currentRoutine.exercises, ...newExercises],
      });
    } else {
      addRoutineMutation.mutate({
        dayOfWeek: selectedDay,
        routineTitle: pack.name,
        exercises: newExercises,
      });
    }
    toast.success(`Applied ${pack.name} to ${selectedDay}!`);
  };
  const [exerciseName, setExerciseName] = useState("");
  const [machineName, setMachineName] = useState("");
  const [targetMuscle, setTargetMuscle] = useState("Chest");
  const [exerciseNotes, setExerciseNotes] = useState("");

  // 2,900+ Exercise Library Search State
  const [libQuery, setLibQuery] = useState("");
  const [libBodyPart, setLibBodyPart] = useState("all");
  const [libEquipment, setLibEquipment] = useState("all");
  const { data: libData } = useExerciseLibrary({
    query: libQuery,
    bodyPart: libBodyPart,
    equipment: libEquipment,
    limit: 20,
  });

  const [editingExercise, setEditingExercise] = useState<any | null>(null);
  const [editExName, setEditExName] = useState("");
  const [editExMachine, setEditExMachine] = useState("");
  const [editExTarget, setEditExTarget] = useState("");
  const [editExNotes, setEditExNotes] = useState("");

  const [deleteExId, setDeleteExId] = useState<string | null>(null);

  // Default suggested routines if day has no title yet
  const defaultRoutineTitles: Record<string, string> = {
    Monday: "Chest & Triceps Focus",
    Tuesday: "Back & Biceps Hypertrophy",
    Wednesday: "Legs & Core Power",
    Thursday: "Shoulders & Arms Pump",
    Friday: "Upper Body Strength",
    Saturday: "Full Body & Cardio",
    Sunday: "Active Recovery & Mobility",
  };

  // --- Handlers ---

  const handleSaveRoutineTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineTitleInput.trim()) return;

    try {
      if (currentRoutine) {
        await updateRoutineMutation.mutateAsync({
          id: currentRoutine.id,
          routineTitle: routineTitleInput.trim(),
        });
      } else {
        await addRoutineMutation.mutateAsync({
          dayOfWeek: selectedDay,
          routineTitle: routineTitleInput.trim(),
          exercises: [],
        });
      }
      toast.success(`${selectedDay} routine updated! 🏋️`);
      setIsRoutineTitleOpen(false);
    } catch {
      toast.error("Failed to update routine title");
    }
  };

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName.trim()) return;

    const newExercise = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: exerciseName.trim(),
      machineName: machineName.trim() || "Free Weights",
      targetMuscle: targetMuscle || "Chest",
      notes: exerciseNotes.trim(),
      sets: [
        { id: `set_1_${Date.now()}`, setNumber: 1, weight: 20, reps: 12, completed: false },
        { id: `set_2_${Date.now()}`, setNumber: 2, weight: 25, reps: 10, completed: false },
        { id: `set_3_${Date.now()}`, setNumber: 3, weight: 30, reps: 8, completed: false },
      ],
    };

    const existingExercises = currentRoutine?.exercises || [];
    const updatedExercises = [...existingExercises, newExercise];

    try {
      if (currentRoutine) {
        await updateRoutineMutation.mutateAsync({
          id: currentRoutine.id,
          exercises: updatedExercises,
        });
      } else {
        await addRoutineMutation.mutateAsync({
          dayOfWeek: selectedDay,
          routineTitle: defaultRoutineTitles[selectedDay] || "Daily Workout Split",
          exercises: updatedExercises,
        });
      }
      toast.success(`Exercise '${exerciseName}' added! 💪`);
      setIsAddExerciseOpen(false);
      setExerciseName("");
      setMachineName("");
      setExerciseNotes("");
    } catch {
      toast.error("Failed to add exercise");
    }
  };

  const handleUpdateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExercise || !editExName.trim() || !currentRoutine) return;

    const updatedExercises = (currentRoutine.exercises || []).map((ex: any) => {
      if (ex.id === editingExercise.id) {
        return {
          ...ex,
          name: editExName.trim(),
          machineName: editExMachine.trim(),
          targetMuscle: editExTarget,
          notes: editExNotes.trim(),
        };
      }
      return ex;
    });

    try {
      await updateRoutineMutation.mutateAsync({
        id: currentRoutine.id,
        exercises: updatedExercises,
      });
      toast.success("Exercise details updated! 📝");
      setEditingExercise(null);
    } catch {
      toast.error("Failed to update exercise");
    }
  };

  const handleDeleteExercise = async (exId: string) => {
    if (!currentRoutine) return;
    const updatedExercises = (currentRoutine.exercises || []).filter((ex: any) => ex.id !== exId);

    try {
      await updateRoutineMutation.mutateAsync({
        id: currentRoutine.id,
        exercises: updatedExercises,
      });
      toast.success("Exercise removed 🗑️");
      setDeleteExId(null);
    } catch {
      toast.error("Failed to remove exercise");
    }
  };

  // Add a new set to an exercise
  const handleAddSet = async (exId: string) => {
    if (!currentRoutine) return;

    const updatedExercises = (currentRoutine.exercises || []).map((ex: any) => {
      if (ex.id === exId) {
        const nextSetNum = (ex.sets?.length || 0) + 1;
        const lastSet = ex.sets?.[ex.sets.length - 1];
        const newSet = {
          id: `set_${nextSetNum}_${Date.now()}`,
          setNumber: nextSetNum,
          weight: lastSet ? lastSet.weight : 20,
          reps: lastSet ? lastSet.reps : 10,
          completed: false,
        };
        return { ...ex, sets: [...(ex.sets || []), newSet] };
      }
      return ex;
    });

    try {
      await updateRoutineMutation.mutateAsync({
        id: currentRoutine.id,
        exercises: updatedExercises,
      });
      toast.success("Set added!");
    } catch {
      toast.error("Failed to add set");
    }
  };

  // Remove last set from an exercise
  const handleRemoveSet = async (exId: string) => {
    if (!currentRoutine) return;

    const updatedExercises = (currentRoutine.exercises || []).map((ex: any) => {
      if (ex.id === exId && ex.sets && ex.sets.length > 1) {
        return { ...ex, sets: ex.sets.slice(0, -1) };
      }
      return ex;
    });

    try {
      await updateRoutineMutation.mutateAsync({
        id: currentRoutine.id,
        exercises: updatedExercises,
      });
      toast.success("Set removed");
    } catch {
      toast.error("Failed to remove set");
    }
  };

  // Update specific set (weight, reps, completed)
  const handleSetChange = async (exId: string, setIndex: number, field: string, value: any) => {
    if (!currentRoutine) return;

    const updatedExercises = (currentRoutine.exercises || []).map((ex: any) => {
      if (ex.id === exId && ex.sets) {
        const updatedSets = ex.sets.map((st: any, idx: number) => {
          if (idx === setIndex) {
            return { ...st, [field]: value };
          }
          return st;
        });
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });

    try {
      await updateRoutineMutation.mutateAsync({
        id: currentRoutine.id,
        exercises: updatedExercises,
      });
    } catch {
      toast.error("Failed to update set details");
    }
  };

  // Reset all ticks for current day routine for new week
  const handleResetWeeklyTicks = async () => {
    if (!currentRoutine) return;
    const updatedExercises = (currentRoutine.exercises || []).map((ex: any) => ({
      ...ex,
      sets: (ex.sets || []).map((st: any) => ({ ...st, completed: false })),
    }));
    try {
      await updateRoutineMutation.mutateAsync({
        id: currentRoutine.id,
        exercises: updatedExercises,
      });
      toast.success(`Reset set checkmarks for ${selectedDay}! Ready for a new week 🏋️`);
    } catch {
      toast.error("Failed to reset ticks");
    }
  };

  const currentExercises = currentRoutine?.exercises || [];
  const totalCompletedSets = currentExercises.reduce(
    (sum: number, ex: any) => sum + (ex.sets?.filter((s: any) => s.completed).length || 0),
    0
  );
  const totalSets = currentExercises.reduce((sum: number, ex: any) => sum + (ex.sets?.length || 0), 0);

  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-5 my-4">
      {/* Tracker Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b-2 border-navy-950/10">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-400 border-2 border-navy-950 flex items-center justify-center text-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] shrink-0">
            <Dumbbell className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h3
              className="text-lg font-black text-navy-950 tracking-wider uppercase"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              GYM ROUTINE & SPLITS
            </h3>
            <p className="text-[11px] text-navy-700 font-bold mt-0.5">
              Logged sets today: <strong className="text-rose-600 font-black">{totalCompletedSets} / {totalSets} sets</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalSets > 0 && (
            <button
              onClick={handleResetWeeklyTicks}
              className="text-[10px] font-black text-navy-950 bg-sky-200 hover:bg-sky-300 px-3 py-1.5 rounded-xl cursor-pointer transition-all border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
              title="Uncheck all sets to reuse routine for a new week"
            >
              🔄 New Week Reset
            </button>
          )}
          <button
            onClick={() => {
              setRoutineTitleInput(currentRoutine?.routineTitle || defaultRoutineTitles[selectedDay]);
              setIsRoutineTitleOpen(true);
            }}
            className="text-[10px] font-black text-navy-950 bg-amber-300 hover:bg-amber-400 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1"
          >
            <Edit3 className="h-3 w-3 stroke-[2.5]" /> Split Title
          </button>
        </div>
      </div>

      {/* Day Split Selector Bar (Monday - Sunday) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = selectedDay === day;
          const isToday = currentDayName === day;
          const dayRoutine = routines.find((r: any) => r.dayOfWeek === day);
          const hasExercises = (dayRoutine?.exercises?.length || 0) > 0;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(31,36,48,1)]",
                isSelected
                  ? "bg-rose-400 text-navy-950 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)]"
                  : "bg-white text-navy-950 hover:bg-amber-100"
              )}
            >
              <span>{day.slice(0, 3)}</span>
              {isToday && (
                <span className="h-2 w-2 rounded-full bg-rose-600 border border-black animate-pulse" title="Today" />
              )}
              {hasExercises && !isToday && (
                <span className="h-2 w-2 rounded-full bg-emerald-400 border border-black" />
              )}
            </button>
          );
        })}
      </div>

      {/* Routine Title Banner */}
      <div className="bg-cream-bg/40 rounded-2xl p-4 border border-border/70 flex items-center justify-between">
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-navy-600 block">
            {selectedDay} Workout Routine
          </span>
          <h4 className="text-sm font-black text-navy-900 mt-0.5">
            {currentRoutine?.routineTitle || defaultRoutineTitles[selectedDay]}
          </h4>
        </div>

        <button
          onClick={() => setIsChoiceOpen(true)}
          className="bg-rose-400 hover:bg-rose-500 text-navy-950 font-black rounded-xl py-1.5 px-3 text-xs border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center gap-1 transition-all"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" /> Add Exercise
        </button>
      </div>

      {/* Exercise & Machine Cards List */}
      {isLoading ? (
        <div className="h-24 animate-pulse bg-cream-bg/30 rounded-2xl" />
      ) : currentExercises.length === 0 ? (
        <div className="bg-cream-bg/30 rounded-2xl p-6 border border-dashed border-border text-center space-y-2">
          <p className="text-xs font-black text-navy-900">No exercises scheduled for {selectedDay}! 🏋️‍♂️</p>
          <p className="text-[10px] text-navy-600 font-medium max-w-sm mx-auto">
            Click '+ Add Exercise' above to log target machines (e.g. Lat Pulldown, Bench Press, Cable Flyes) and track sets & reps.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentExercises.map((ex: any) => (
            <div key={ex.id} className="bg-cream-bg/40 rounded-2xl p-4 border border-border/80 space-y-3">
              {/* Exercise Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-extrabold text-sm text-navy-900">{ex.name}</h5>
                    <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full uppercase">
                      {ex.targetMuscle || "General"}
                    </span>
                  </div>
                  {ex.machineName && (
                    <span className="text-[10px] font-semibold text-navy-600 flex items-center gap-1 mt-0.5">
                      <Layers className="h-3 w-3 text-rose-500" /> Machine: {ex.machineName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingExercise(ex);
                      setEditExName(ex.name);
                      setEditExMachine(ex.machineName || "");
                      setEditExTarget(ex.targetMuscle || "Chest");
                      setEditExNotes(ex.notes || "");
                    }}
                    className="text-navy-600 hover:text-navy-900 p-1 cursor-pointer transition-colors border-none bg-transparent"
                    title="Edit exercise"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteExId(ex.id)}
                    className="text-navy-600 hover:text-rose-600 p-1 cursor-pointer transition-colors border-none bg-transparent"
                    title="Delete exercise"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Sets Table */}
              <div className="bg-white rounded-xl border border-border/70 overflow-hidden text-xs">
                <div className="grid grid-cols-4 bg-cream-bg/60 p-2 font-black text-[10px] text-navy-600 uppercase tracking-wider text-center border-b">
                  <span>Set</span>
                  <span>Weight (kg)</span>
                  <span>Reps</span>
                  <span>Done</span>
                </div>

                <div className="divide-y divide-border/40">
                  {(ex.sets || []).map((st: any, idx: number) => (
                    <div key={st.id || idx} className="grid grid-cols-4 p-2 items-center text-center">
                      <span className="font-bold text-navy-900 text-[11px]">Set {st.setNumber}</span>
                      <input
                        type="number"
                        value={st.weight}
                        onChange={(e) => handleSetChange(ex.id, idx, "weight", Number(e.target.value))}
                        className="w-16 mx-auto bg-cream-bg/50 border rounded-lg py-0.5 px-1 text-center font-extrabold text-navy-900 outline-none focus:ring-1 focus:ring-rose-500"
                        min={0}
                      />
                      <input
                        type="number"
                        value={st.reps}
                        onChange={(e) => handleSetChange(ex.id, idx, "reps", Number(e.target.value))}
                        className="w-14 mx-auto bg-cream-bg/50 border rounded-lg py-0.5 px-1 text-center font-extrabold text-navy-900 outline-none focus:ring-1 focus:ring-rose-500"
                        min={1}
                      />
                      <button
                        type="button"
                        onClick={() => handleSetChange(ex.id, idx, "completed", !st.completed)}
                        className="mx-auto cursor-pointer border-none bg-transparent outline-none"
                      >
                        {st.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 fill-emerald-100" />
                        ) : (
                          <Circle className="h-5 w-5 text-navy-600/40 hover:text-navy-900" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Set Actions Bar */}
              <div className="flex justify-between items-center pt-1 text-[10px]">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddSet(ex.id)}
                    className="font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-full cursor-pointer transition-colors border-none outline-none flex items-center gap-0.5"
                  >
                    <Plus className="h-3 w-3" /> Add Set
                  </button>
                  {ex.sets && ex.sets.length > 1 && (
                    <button
                      onClick={() => handleRemoveSet(ex.id)}
                      className="font-bold text-navy-600 hover:text-rose-600 bg-cream-bg px-2.5 py-1 rounded-full cursor-pointer transition-colors border-none outline-none"
                    >
                      Remove Set
                    </button>
                  )}
                </div>
                {ex.notes && <span className="text-navy-600 italic truncate max-w-[200px]">Note: {ex.notes}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Exercise Choice Modal */}
      <TemplateSelectionModal
        open={isChoiceOpen}
        onOpenChange={setIsChoiceOpen}
        title="ADD GYM ROUTINE"
        subtitle="START FROM SCRATCH OR APPLY A WORKOUT SPLIT PACK."
        blankLabel="BLANK EXERCISE"
        blankDesc="CUSTOM MACHINE, TARGET MUSCLE & SETS"
        templatesLabel="WORKOUT PACKS"
        templatesDesc="PUSH DAY, PULL DAY, LEGS, HYPERTROPHY..."
        templatePacks={GYM_TEMPLATE_PACKS}
        onSelectBlank={() => setIsAddExerciseOpen(true)}
        onApplyTemplatePack={handleApplyGymPack}
      />

      {/* Routine Title Modal */}
      <ResponsiveFormContainer
        open={isRoutineTitleOpen}
        onOpenChange={setIsRoutineTitleOpen}
        title={`Set ${selectedDay} Routine Title`}
        description="Name your workout split for this day (e.g. Chest & Triceps Focus)"
      >
        <form onSubmit={handleSaveRoutineTitle} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Routine Title</label>
            <input
              type="text"
              placeholder="e.g. Chest & Triceps Focus, Leg Day Blitz"
              value={routineTitleInput}
              onChange={(e) => setRoutineTitleInput(e.target.value)}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={updateRoutineMutation.isPending || addRoutineMutation.isPending}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-full py-2.5 mt-2 border-none cursor-pointer"
          >
            Save Routine Title
          </Button>
        </form>
      </ResponsiveFormContainer>

      {/* Add Exercise Modal */}
      <ResponsiveFormContainer
        open={isAddExerciseOpen}
        onOpenChange={setIsAddExerciseOpen}
        title={`Add Exercise to ${selectedDay}`}
        description="Search from 2,900+ Gym Exercise Library or enter custom details"
      >
        <div className="space-y-4 pt-2">
          {/* 🔍 DATASET 1: 2,900+ EXERCISES SEARCH & AUTO-FILL LIBRARY */}
          <div className="bg-amber-50 rounded-2xl p-3.5 border-2 border-navy-950 shadow-[2.5px_2.5px_0px_0px_rgba(31,36,48,1)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-navy-950 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-navy-950 stroke-[3]" />
                🔍 Search 2,900+ Exercise Library
              </span>
              <span className="text-[9px] font-black bg-amber-400 text-navy-950 px-2 py-0.5 rounded-md border border-navy-950">
                {libData?.totalCount || 2919} Exercises
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search exercise name or muscle (e.g. Bench Press, Squat, Crunch)..."
                value={libQuery}
                onChange={(e) => {
                  setLibQuery(e.target.value);
                }}
                className="w-full bg-white rounded-xl border-2 border-navy-950 px-3.5 py-2 text-xs font-bold text-navy-950 outline-none placeholder:text-navy-400 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]"
              />
            </div>

            {/* Muscle Group Quick Filters */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {["all", "Abdominals", "Chest", "Back", "Biceps", "Triceps", "Shoulders", "Quadriceps", "Hamstrings", "Glutes"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setLibBodyPart(m)}
                  className={cn(
                    "text-[9px] font-black px-2 py-0.5 rounded-lg border border-navy-950 transition-all cursor-pointer",
                    libBodyPart === m
                      ? "bg-navy-950 text-white shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]"
                      : "bg-white text-navy-950 hover:bg-amber-100"
                  )}
                >
                  {m === "all" ? "ALL MUSCLES" : m.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Live Search Results List */}
            {libData?.exercises && libData.exercises.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 pt-1 divide-y divide-amber-200/60">
                {libData.exercises.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setExerciseName(item.title);
                      setMachineName(item.equipment || "Free Weights");
                      setTargetMuscle(item.bodyPart || "Chest");
                      setExerciseNotes(item.desc ? item.desc.slice(0, 120) + "..." : `${item.level} ${item.type}`);
                      toast.success(`Selected '${item.title}' from library! 🎯`);
                    }}
                    className="p-2 rounded-xl bg-white hover:bg-amber-100/80 border border-navy-950 cursor-pointer transition-all flex items-center justify-between gap-2 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]"
                  >
                    <div>
                      <h5 className="font-black text-xs text-navy-950">{item.title}</h5>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-400 text-navy-950 border border-navy-950">
                          {item.bodyPart}
                        </span>
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-sky-200 text-navy-950 border border-navy-950">
                          {item.equipment}
                        </span>
                        {item.level && (
                          <span className="text-[8px] font-black uppercase text-navy-600">
                            • {item.level}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-black bg-emerald-400 text-navy-950 px-2 py-0.5 rounded-lg border border-navy-950 shrink-0">
                      USE ➔
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleAddExercise} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Exercise Name</label>
              <input
                type="text"
                placeholder="e.g. Incline Dumbbell Press, Lat Pulldown"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Machine / Equipment</label>
                <input
                  type="text"
                  placeholder="e.g. Cable Station, Smith Machine"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Target Muscle</label>
                <input
                  type="text"
                  placeholder="e.g. Chest, Back, Abdominals"
                  value={targetMuscle}
                  onChange={(e) => setTargetMuscle(e.target.value)}
                  className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Notes / Form Cue</label>
              <input
                type="text"
                placeholder="e.g. Squeeze at top, 2 second slow negative"
                value={exerciseNotes}
                onChange={(e) => setExerciseNotes(e.target.value)}
                className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-full py-2.5 mt-2 border-none cursor-pointer"
            >
              Add Exercise & Start Logging
            </Button>
          </form>
        </div>
      </ResponsiveFormContainer>

      {/* Edit Exercise Modal */}
      <ResponsiveFormContainer
        open={editingExercise !== null}
        onOpenChange={(open) => {
          if (!open) setEditingExercise(null);
        }}
        title="Edit Exercise Details"
        description="Update exercise title, equipment, or muscle group"
      >
        <form onSubmit={handleUpdateExercise} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Exercise Name</label>
            <input
              type="text"
              value={editExName}
              onChange={(e) => setEditExName(e.target.value)}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Machine / Equipment</label>
              <input
                type="text"
                value={editExMachine}
                onChange={(e) => setEditExMachine(e.target.value)}
                className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Target Muscle</label>
              <select
                value={editExTarget}
                onChange={(e) => setEditExTarget(e.target.value)}
                className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
              >
                {["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Legs", "Abs/Core", "Cardio"].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-full py-2.5 mt-2 border-none cursor-pointer"
          >
            Save Changes
          </Button>
        </form>
      </ResponsiveFormContainer>

      {/* Delete Exercise Modal */}
      <DeleteConfirmationModal
        open={deleteExId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteExId(null);
        }}
        onConfirm={() => {
          if (deleteExId) handleDeleteExercise(deleteExId);
        }}
        title="Remove Exercise"
        description="Are you sure you want to remove this exercise from today's routine split?"
      />
    </div>
  );
}
