"use client";

import { useState, useMemo } from "react";
import { Dumbbell, Plus, Trash2, Edit3, CheckCircle2, Circle, Flame, Sparkles, Layers, Search, Info, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { TemplateSelectionModal, TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { GYM_TEMPLATE_PACKS } from "@/lib/templates-data";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { ExerciseGuideModal } from "@/components/goals/ExerciseGuideModal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useGymRoutines, useAddGymRoutine, useUpdateGymRoutine, useDeleteGymRoutine } from "@/lib/queries/gym";
import { useExerciseLibrary } from "@/lib/queries/exercises";
import { getFriendlyWeekLabel } from "@/lib/utils/gym-rollover";

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
  const [addModalTab, setAddModalTab] = useState<"library" | "custom">("library");
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);
  const [selectedGuideExercise, setSelectedGuideExercise] = useState<any | null>(null);
  const [collapsedExercises, setCollapsedExercises] = useState<Record<string, boolean>>({});

  const toggleCollapse = (exId: string) => {
    setCollapsedExercises((prev) => ({
      ...prev,
      [exId]: !prev[exId],
    }));
  };

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
  const [selectedLibItem, setSelectedLibItem] = useState<any | null>(null);

  // 800+ Exercise Library Search State
  const [libQuery, setLibQuery] = useState("");
  const [libBodyPart, setLibBodyPart] = useState("all");
  const [libEquipment, setLibEquipment] = useState("all");
  const { data: libData } = useExerciseLibrary({
    query: libQuery,
    bodyPart: libBodyPart,
    equipment: libEquipment,
    limit: 25,
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

  // 1-Tap Direct Add from Library
  const handleAddExerciseFromLibrary = async (item: any) => {
    if (addRoutineMutation.isPending || updateRoutineMutation.isPending) return;

    const newExercise = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: item.title,
      machineName: item.equipment || "Free Weights",
      targetMuscle: item.bodyPart || "Chest",
      equipment: item.equipment || "Free Weights",
      instructions: item.instructions || [],
      images: item.images || [],
      gifUrl: item.gifUrl || item.images?.[0] || "",
      secondaryMuscles: item.secondaryMuscles || [],
      notes: item.desc ? item.desc.slice(0, 120) : `${item.level || ""} ${item.type || ""}`.trim(),
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
      toast.success(`Added '${item.title}' to ${selectedDay}! 💪`);
      setIsAddExerciseOpen(false);
      setLibQuery("");
    } catch {
      toast.error("Failed to add exercise to routine");
    }
  };

  // Add Custom Exercise from Form
  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName.trim()) return;

    const newExercise = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: exerciseName.trim(),
      machineName: machineName.trim() || "Free Weights",
      targetMuscle: targetMuscle.trim() || "Chest",
      equipment: machineName.trim() || "Free Weights",
      instructions: [],
      images: [],
      gifUrl: "",
      secondaryMuscles: [],
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
      toast.success(`Exercise '${exerciseName}' added to ${selectedDay}! 💪`);
      setIsAddExerciseOpen(false);
      setExerciseName("");
      setMachineName("");
      setExerciseNotes("");
      setTargetMuscle("Chest");
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
      if (field === "completed" && value === true) {
        const thisEx = updatedExercises.find((e: any) => e.id === exId);
        const thisExCompleted = thisEx && (thisEx.sets || []).length > 0 && (thisEx.sets || []).every((s: any) => s.completed);
        if (thisExCompleted) {
          toast.success(`'${thisEx.name}' sets crushed! 🎯`);
          // Auto-collapse completed exercise smoothly
          setTimeout(() => {
            setCollapsedExercises((prev) => ({ ...prev, [exId]: true }));
          }, 450);
        }

        const allDone = updatedExercises.every((e: any) =>
          (e.sets || []).every((s: any) => s.completed)
        );
        if (allDone && updatedExercises.length > 0) {
          toast.success(`Crushed it! All ${selectedDay} sets completed! 🏆🔥`);
        }
      }
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
      toast.success(`Checkmarks reset for ${selectedDay}! Ready for a fresh workout 🏋️`);
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

  const isAllCollapsed = useMemo(() => {
    if (currentExercises.length === 0) return false;
    return currentExercises.every((ex: any) => collapsedExercises[ex.id]);
  }, [currentExercises, collapsedExercises]);

  const toggleAllCollapse = () => {
    if (isAllCollapsed) {
      setCollapsedExercises({});
    } else {
      const all: Record<string, boolean> = {};
      currentExercises.forEach((ex: any) => {
        all[ex.id] = true;
      });
      setCollapsedExercises(all);
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] sm:shadow-[5px_5px_0px_0px_#161514] space-y-5">
      {/* Tracker Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b-2 border-[#161514]/15">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-400 border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[2px_2px_0px_0px_#161514] shrink-0">
            <Dumbbell className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h3
              className="text-lg font-heading font-black text-[#161514] tracking-wider uppercase"
            >
              GYM ROUTINE & SPLITS
            </h3>
            <p className="text-[11px] text-[#161514]/80 font-bold mt-0.5 flex items-center gap-2 flex-wrap">
              <span>
                Logged sets: <strong className="text-rose-600 font-black">{totalCompletedSets} / {totalSets} sets</strong>
              </span>
              <span className="neo-badge bg-[#EAF4F4] text-[#014651]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#03D26F] animate-pulse" />
                {getFriendlyWeekLabel()} (Auto-Rollover)
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalSets > 0 && (
            <button
              onClick={handleResetWeeklyTicks}
              className="text-[10px] font-heading font-black text-[#161514] bg-sky-100 hover:bg-sky-200 px-3 py-1.5 rounded-xl cursor-pointer transition-all border border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              title="Uncheck all sets to re-log without losing weights/reps"
            >
              🔄 Reset Sets
            </button>
          )}
          <button
            onClick={() => {
              setRoutineTitleInput(currentRoutine?.routineTitle || defaultRoutineTitles[selectedDay]);
              setIsRoutineTitleOpen(true);
            }}
            className="text-[10px] font-heading font-black text-[#161514] bg-amber-300 hover:bg-amber-400 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-1"
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
                "px-3.5 py-2 rounded-xl text-xs font-heading font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none select-none",
                isSelected
                  ? "bg-[#03D26F] text-[#161514] shadow-[3px_3px_0px_0px_#161514]"
                  : "bg-white text-[#161514] hover:bg-amber-100"
              )}
            >
              <span>{day.slice(0, 3)}</span>
              {isToday && (
                <span className="h-2 w-2 rounded-full bg-rose-600 border border-[#161514] animate-pulse" title="Today" />
              )}
              {hasExercises && !isToday && (
                <span className="h-2 w-2 rounded-full bg-[#CEF431] border border-[#161514]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Routine Title Banner */}
      <div className="bg-cream-bg/50 rounded-2xl p-3.5 sm:p-4 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-[9.5px] font-heading font-black uppercase tracking-widest text-[#161514]/70 block">
            {selectedDay} Workout Routine
          </span>
          <h4 className="text-sm sm:text-base font-heading font-black text-[#161514] mt-0.5 leading-snug break-words">
            {currentRoutine?.routineTitle || defaultRoutineTitles[selectedDay]}
          </h4>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {currentExercises.length > 1 && (
            <button
              type="button"
              onClick={toggleAllCollapse}
              className="bg-white hover:bg-cream-bg text-[#161514] font-heading font-black rounded-xl py-1.5 px-2.5 text-xs border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] cursor-pointer transition-all flex items-center gap-1 active:translate-y-0.5"
              title={isAllCollapsed ? "Expand all exercises" : "Collapse all exercises"}
            >
              {isAllCollapsed ? (
                <>
                  <ChevronDown className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Expand All</span>
                </>
              ) : (
                <>
                  <ChevronUp className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => setIsChoiceOpen(true)}
            className="bg-[#CEF431] hover:bg-[#D8F74E] text-[#161514] font-heading font-black rounded-xl py-1.5 px-3.5 text-xs border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Add Exercise</span>
          </button>
        </div>
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
        <div className="space-y-3 pb-2">
          {currentExercises.map((ex: any) => {
            const isCompleted = (ex.sets || []).length > 0 && (ex.sets || []).every((s: any) => s.completed);
            const completedCount = (ex.sets || []).filter((s: any) => s.completed).length;
            const totalCount = ex.sets?.length || 0;
            const isCollapsed = collapsedExercises[ex.id] ?? false;

            if (isCollapsed) {
              return (
                <div
                  key={ex.id}
                  className={cn(
                    "bg-cream-bg/60 hover:bg-cream-bg rounded-2xl p-3.5 border-2 border-[#161514] transition-all shadow-[2px_2px_0px_0px_#161514] cursor-pointer select-none",
                    isCompleted && "bg-emerald-50/80 border-[#161514]"
                  )}
                  onClick={() => toggleCollapse(ex.id)}
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Icon + Full Exercise Name + Expand Chevron */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-xl border-2 border-[#161514] flex items-center justify-center text-sm shrink-0 font-black shadow-[1.5px_1.5px_0px_0px_#161514] mt-0.5",
                            isCompleted ? "bg-[#03D26F] text-[#161514]" : "bg-amber-300 text-[#161514]"
                          )}
                        >
                          {isCompleted ? "✓" : "🏋️"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-black text-xs sm:text-sm text-[#161514] leading-snug break-words">
                            {ex.name}
                          </h5>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        <div
                          className="h-6 w-6 rounded-lg border-2 border-[#161514] flex items-center justify-center text-[#161514] bg-white shadow-[1px_1px_0px_0px_#161514]"
                          title="Expand exercise"
                        >
                          <ChevronDown className="h-3.5 w-3.5 stroke-[2.5]" />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Muscle & Equipment Pills + Progress Badge + Form Guide */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#161514]/10 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border-2 border-[#161514]">
                          {ex.targetMuscle || "General"}
                        </span>
                        {ex.machineName && (
                          <span className="text-[9.5px] font-bold text-[#161514]/70">
                            • {ex.machineName}
                          </span>
                        )}
                        <span className="text-[9.5px] font-black text-[#161514]/60">
                          • {totalCount} Sets
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                        <span
                          className={cn(
                            "text-[9.5px] font-black px-2 py-0.5 rounded-md border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514]",
                            isCompleted ? "bg-[#03D26F] text-[#161514]" : "bg-white text-[#161514]"
                          )}
                        >
                          {completedCount} / {totalCount} Done
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGuideExercise(ex);
                          }}
                          className="px-2 py-0.5 rounded-md bg-amber-300 hover:bg-amber-400 text-[#161514] text-[9.5px] font-black border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514] flex items-center gap-1 cursor-pointer transition-all active:translate-y-0.5 shrink-0"
                          title="Form Guide"
                        >
                          <Eye className="h-3 w-3 stroke-[2.5]" />
                          <span>Guide</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={ex.id}
                className={cn(
                  "bg-cream-bg/40 rounded-2xl p-4 border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514] space-y-3 transition-all",
                  isCompleted && "bg-emerald-50/40 border-[#161514]"
                )}
              >
                {/* Exercise Header */}
                <div className="space-y-2">
                  {/* Top line: Full Exercise Name + Actions (Edit, Delete, Collapse) */}
                  <div className="flex items-start justify-between gap-2">
                    <div
                      onClick={() => toggleCollapse(ex.id)}
                      className="cursor-pointer select-none min-w-0 flex-1"
                      title="Click to collapse"
                    >
                      <h5 className="font-black text-sm sm:text-base text-[#161514] leading-snug break-words">
                        {ex.name}
                      </h5>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setEditingExercise(ex);
                          setEditExName(ex.name);
                          setEditExMachine(ex.machineName || "");
                          setEditExTarget(ex.targetMuscle || "Chest");
                          setEditExNotes(ex.notes || "");
                        }}
                        className="p-1.5 rounded-lg bg-white hover:bg-amber-100 border-2 border-[#161514] text-[#161514] shadow-[1px_1px_0px_0px_#161514] cursor-pointer transition-all active:translate-y-0.5"
                        title="Edit exercise"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setDeleteExId(ex.id)}
                        className="p-1.5 rounded-lg bg-white hover:bg-rose-100 border-2 border-[#161514] text-rose-600 shadow-[1px_1px_0px_0px_#161514] cursor-pointer transition-all active:translate-y-0.5"
                        title="Delete exercise"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCollapse(ex.id)}
                        className="p-1.5 rounded-lg bg-white hover:bg-amber-100 border-2 border-[#161514] text-[#161514] shadow-[1px_1px_0px_0px_#161514] cursor-pointer transition-all active:translate-y-0.5"
                        title="Collapse exercise"
                      >
                        <ChevronUp className="h-3 w-3 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  {/* Sub-line: Muscle Tag + Machine + Form Guide Button */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border-2 border-[#161514]">
                        {ex.targetMuscle || "General"}
                      </span>
                      {ex.machineName && (
                        <span className="text-[10px] font-bold text-[#161514]/70 flex items-center gap-1">
                          <Layers className="h-3 w-3 text-rose-500" /> {ex.machineName}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedGuideExercise(ex)}
                      className="px-2.5 py-1 rounded-lg bg-amber-300 hover:bg-amber-400 text-[#161514] font-black text-[10px] border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514] flex items-center gap-1 cursor-pointer transition-all active:translate-y-0.5 shrink-0"
                      title="View execution form guide, muscle activation & posture"
                    >
                      <Eye className="h-3 w-3 stroke-[2.5]" />
                      <span>Form Guide</span>
                    </button>
                  </div>
                </div>

                {/* Sets Table */}
                <div className="bg-white rounded-xl border-2 border-[#161514] overflow-hidden text-xs shadow-[2px_2px_0px_0px_#161514]">
                  <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-[#FAF8F5] font-black text-[10px] text-[#161514] uppercase tracking-wider text-center border-b-2 border-[#161514]">
                    <span>Set</span>
                    <span>Weight (kg)</span>
                    <span>Reps</span>
                    <span>Done</span>
                  </div>

                  <div className="divide-y divide-[#161514]/10">
                    {(ex.sets || []).map((st: any, idx: number) => (
                      <div key={st.id || idx} className="grid grid-cols-4 gap-2 px-3 py-2 items-center text-center">
                        <span className="font-black text-[#161514] text-[11px]">Set {st.setNumber}</span>
                        <div className="flex justify-center">
                          <input
                            type="number"
                            value={st.weight}
                            onChange={(e) => handleSetChange(ex.id, idx, "weight", Number(e.target.value))}
                            className="w-full max-w-[58px] bg-[#FAF8F5] border-2 border-[#161514] rounded-lg py-1 px-1 text-center font-black text-[#161514] text-xs outline-none focus:bg-[#FFF9EA] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                            min={0}
                          />
                        </div>
                        <div className="flex justify-center">
                          <input
                            type="number"
                            value={st.reps}
                            onChange={(e) => handleSetChange(ex.id, idx, "reps", Number(e.target.value))}
                            className="w-full max-w-[58px] bg-[#FAF8F5] border-2 border-[#161514] rounded-lg py-1 px-1 text-center font-black text-[#161514] text-xs outline-none focus:bg-[#FFF9EA] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                            min={1}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSetChange(ex.id, idx, "completed", !st.completed)}
                          className="mx-auto cursor-pointer border-none bg-transparent outline-none flex items-center justify-center p-1 rounded-full hover:bg-emerald-50 active:scale-95 transition-all"
                          title={st.completed ? "Mark incomplete" : "Mark completed"}
                        >
                          {st.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-[#03D26F] fill-[#03D26F]/20 transition-transform active:scale-110" />
                          ) : (
                            <Circle className="h-5 w-5 text-[#161514]/40 hover:text-[#161514] transition-colors" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Set Actions Bar */}
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleAddSet(ex.id)}
                      className="font-bold text-[11px] text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-full cursor-pointer transition-colors border border-rose-200 flex items-center gap-1 shrink-0 whitespace-nowrap active:scale-95"
                    >
                      <Plus className="h-3 w-3 stroke-[2.5]" />
                      <span>Add Set</span>
                    </button>
                    {ex.sets && ex.sets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSet(ex.id)}
                        className="font-bold text-[11px] text-[#161514]/60 hover:text-rose-600 bg-cream-bg px-3 py-1 rounded-full cursor-pointer transition-colors border border-[#161514]/10 shrink-0 whitespace-nowrap active:scale-95"
                      >
                        Remove Set
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] font-extrabold text-[#161514]/60 uppercase tracking-wider">
                    {completedCount} / {totalCount} Done
                  </span>
                </div>

                {/* Form Cue / Notes Banner (Zero Clipping, Dedicated Full-Width Callout) */}
                {ex.notes && (
                  <div className="bg-amber-50/90 rounded-xl p-2.5 border border-amber-200/90 flex items-start gap-2 shadow-[1px_1px_0px_0px_rgba(245,158,11,0.15)]">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-[#161514] px-1.5 py-0.5 rounded border-2 border-[#161514] shrink-0 mt-0.5">
                      CUE
                    </span>
                    <p className="text-navy-900 text-[11px] font-bold leading-relaxed break-words flex-1">
                      {ex.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
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
        onSelectBlank={() => {
          setAddModalTab("library");
          setIsAddExerciseOpen(true);
        }}
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
        description="Search 4,300+ exercises with 1-tap add, animated guides, or log custom machines"
      >
        <div className="space-y-3 pt-1">
          {/* Segmented Mode Toggle: Library vs Custom Exercise */}
          <div className="flex p-1 bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] gap-1">
            <button
              type="button"
              onClick={() => setAddModalTab("library")}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                addModalTab === "library"
                  ? "bg-[#161514] text-white shadow-[1px_1px_0px_0px_#161514]"
                  : "text-[#161514] hover:bg-white"
              )}
            >
              <Search className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Library ({libData?.totalCount || 4325})</span>
            </button>
            <button
              type="button"
              onClick={() => setAddModalTab("custom")}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                addModalTab === "custom"
                  ? "bg-[#161514] text-white shadow-[1px_1px_0px_0px_#161514]"
                  : "text-[#161514] hover:bg-white"
              )}
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Custom Exercise</span>
            </button>
          </div>

          {addModalTab === "library" ? (
            /* 🔍 4,300+ EXERCISES SEARCH & DIRECT 1-TAP ADD */
            <div className="space-y-3">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search exercise name or muscle (e.g. Bench Press, Lat Pulldown)..."
                  value={libQuery}
                  onChange={(e) => setLibQuery(e.target.value)}
                  className="w-full bg-white rounded-xl border-2 border-[#161514] px-3.5 py-2.5 text-xs font-bold text-[#161514] outline-none placeholder:text-[#161514]/40 shadow-[2px_2px_0px_0px_#161514] focus:bg-[#FFF9EA]"
                  autoFocus
                />
              </div>

              {/* Muscle Group Quick Filters */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {["all", "Chest", "Back", "Shoulders", "Biceps", "Triceps", "Quadriceps", "Hamstrings", "Glutes", "Calves", "Abdominals", "Cardio"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setLibBodyPart(m)}
                    className={cn(
                      "text-[9px] font-black px-2 py-0.5 rounded-lg border-2 border-[#161514] transition-all cursor-pointer",
                      libBodyPart === m
                        ? "bg-[#161514] text-white shadow-[1px_1px_0px_0px_#161514]"
                        : "bg-white text-[#161514] hover:bg-amber-100"
                    )}
                  >
                    {m === "all" ? "ALL MUSCLES" : m.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Live Search Results List with 1-TAP DIRECT ADD */}
              {libData?.exercises && libData.exercises.length > 0 ? (
                <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1 pt-1 divide-y divide-amber-200/60 overscroll-contain">
                  {libData.exercises.map((item) => {
                    const thumbUrl = (item.images && item.images[0]) || item.gifUrl;
                    return (
                    <div
                      key={item.id}
                      onClick={() => handleAddExerciseFromLibrary(item)}
                      className="p-2.5 rounded-xl bg-white hover:bg-amber-100/90 border-2 border-[#161514] cursor-pointer transition-all flex items-center justify-between gap-2.5 shadow-[1.5px_1.5px_0px_0px_#161514] active:translate-y-0.5 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {thumbUrl ? (
                          <div className="h-11 w-11 rounded-lg bg-[#242220] border-2 border-[#161514] overflow-hidden shrink-0 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={thumbUrl} alt={item.title} className="h-full w-full object-contain" />
                          </div>
                        ) : (
                          <div className="h-11 w-11 rounded-lg bg-amber-200 border-2 border-[#161514] flex items-center justify-center text-[#161514] font-black text-xs shrink-0">
                            🏋️
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h5 className="font-black text-xs text-[#161514] leading-snug break-words group-hover:text-rose-600 transition-colors">
                            {item.title}
                          </h5>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-300 text-[#161514] border-2 border-[#161514]">
                              {item.bodyPart}
                            </span>
                            <span className="text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded bg-sky-200 text-[#161514] border-2 border-[#161514]">
                              {item.equipment}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGuideExercise(item);
                          }}
                          className="px-2 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-[#161514] text-[9px] font-black border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514] flex items-center gap-1 cursor-pointer transition-all active:translate-y-0.5"
                          title="View Exercise Form Guide"
                        >
                          <Eye className="h-2.5 w-2.5 stroke-[2.5]" />
                          <span>Guide</span>
                        </button>
                        <button
                          type="button"
                          disabled={addRoutineMutation.isPending || updateRoutineMutation.isPending}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddExerciseFromLibrary(item);
                          }}
                          className="text-[9px] font-black bg-[#03D26F] hover:bg-[#02b861] active:translate-y-0.5 text-[#161514] px-2.5 py-1 rounded-lg border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <span>USE</span>
                          <span className="font-black">➔</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
                </div>
              ) : (
                <div className="p-5 text-center bg-white rounded-2xl border-2 border-dashed border-[#161514]/40 space-y-2.5">
                  <p className="text-xs font-black text-[#161514]">
                    No exercise found matching &ldquo;{libQuery}&rdquo;
                  </p>
                  <p className="text-[11px] font-bold text-[#161514]/70">
                    Can&apos;t find this variation? Create it as a custom exercise with your own machines and target muscles.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setExerciseName(libQuery);
                      setAddModalTab("custom");
                    }}
                    className="text-xs font-black bg-rose-400 hover:bg-rose-500 text-[#161514] px-3.5 py-1.5 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] cursor-pointer inline-flex items-center gap-1.5 active:translate-y-0.5 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[3]" />
                    <span>Create &ldquo;{libQuery || "Custom"}&rdquo; Exercise</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ✍️ CUSTOM EXERCISE CREATION FORM */
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
                  autoFocus
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
                disabled={addRoutineMutation.isPending || updateRoutineMutation.isPending}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-full py-2.5 mt-2 border-none cursor-pointer"
              >
                Add Custom Exercise & Start Logging
              </Button>
            </form>
          )}
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

      {/* Exercise Form & Technique Guide Modal */}
      <ExerciseGuideModal
        open={selectedGuideExercise !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedGuideExercise(null);
        }}
        exercise={selectedGuideExercise}
      />
    </div>
  );
}
