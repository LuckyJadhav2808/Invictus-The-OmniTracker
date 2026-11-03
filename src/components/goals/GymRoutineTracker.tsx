"use client";

import { useState, useMemo, useEffect, useDeferredValue, useRef } from "react";
import { Dumbbell, Plus, Trash2, Edit3, CheckCircle2, Circle, Flame, Sparkles, Layers, Search, Info, Eye, ChevronDown, ChevronUp, Timer, Play, Pause, X, RotateCcw } from "lucide-react";
import { AdaptiveDrawerDialog } from "@/components/shared/AdaptiveDrawerDialog";
import { soundFX } from "@/components/shared/SoundFX";
import { TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { GymChoiceModal } from "@/components/goals/GymChoiceModal";
import { GYM_TEMPLATE_PACKS } from "@/lib/templates-data";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { ExerciseGuideModal } from "@/components/goals/ExerciseGuideModal";
import { HumanMuscleAnatomy } from "@/components/goals/anatomy/HumanMuscleAnatomy";
import {
  MuscleGroup,
  resolveExerciseAnatomy,
  mapMuscleGroupToBodyPart,
  mapBodyPartToMuscleGroup,
} from "@/components/goals/anatomy/muscle-mapping";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLiveActivityStore } from "@/store/live-activity-store";
import { useGymRoutines, useAddGymRoutine, useUpdateGymRoutine, useDeleteGymRoutine } from "@/lib/queries/gym";
import { useExerciseLibrary } from "@/lib/queries/exercises";
import { getFriendlyWeekLabel } from "@/lib/utils/gym-rollover";
import { useWakeLock } from "@/lib/hooks/useWakeLock";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export function GymRoutineTracker() {
  // Determine current day of week (e.g. "Monday")
  const currentDayName = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const idx = new Date().getDay();
    return days[idx] as typeof DAYS_OF_WEEK[number];
  }, []);

  const [selectedDay, setSelectedDay] = useState<typeof DAYS_OF_WEEK[number]>(currentDayName);

  // Automatic Gladiator Rest Timer State (Synchronized via Live Activity Store)
  const {
    activeActivity,
    gymRest,
    startGymRest,
    togglePauseGymRest,
    addGymRestSeconds,
    stopGymRest,
  } = useLiveActivityStore();

  const [defaultRestDuration, setDefaultRestDuration] = useState<number>(60);
  const restSecondsLeft =
    activeActivity === "gym_rest" && gymRest.secondsLeft > 0 ? gymRest.secondsLeft : null;
  const restDuration = activeActivity === "gym_rest" ? (gymRest.totalSeconds || defaultRestDuration) : defaultRestDuration;
  const isTimerPaused = gymRest.isPaused;

  const isTimerRunning = restSecondsLeft !== null && !isTimerPaused;
  useWakeLock(isTimerRunning);

  const startRestTimer = (seconds: number = restDuration, exName?: string) => {
    startGymRest(seconds, exName || "Workout Recovery");
    soundFX.playPop();
  };

  const togglePauseTimer = () => {
    togglePauseGymRest();
    soundFX.playPop();
  };

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
  const [showBodyMapFilter, setShowBodyMapFilter] = useState(false);
  const [isSplitAnatomyOpen, setIsSplitAnatomyOpen] = useState(false);
  const [isAnatomyExpanded, setIsAnatomyExpanded] = useState(true);

  const toggleCollapse = (exId: string) => {
    setCollapsedExercises((prev) => ({
      ...prev,
      [exId]: !(prev[exId] ?? true),
    }));
  };

  const handleAddCustomExerciseFromChoice = async (custom: {
    name: string;
    machineName?: string;
    targetMuscle?: string;
    notes?: string;
  }) => {
    const newExercise = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: custom.name,
      machineName: custom.machineName || "Free Weights",
      targetMuscle: custom.targetMuscle || "Chest",
      equipment: custom.machineName || "Free Weights",
      instructions: [],
      images: [],
      gifUrl: "",
      secondaryMuscles: [],
      notes: custom.notes || "",
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
      toast.success(`Exercise '${custom.name}' added to ${selectedDay}! 💪`);
      setCollapsedExercises((prev) => ({ ...prev, [newExercise.id]: false }));
      setIsChoiceOpen(false);
    } catch {
      toast.error("Failed to add exercise");
    }
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

  // 4,300+ Exercise Library Search & Progressive Loading State
  const [libQuery, setLibQuery] = useState("");
  const deferredLibQuery = useDeferredValue(libQuery);
  const [libBodyPart, setLibBodyPart] = useState("all");
  const [libEquipment, setLibEquipment] = useState("all");
  const [displayLimit, setDisplayLimit] = useState(50);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset display limit to 50 whenever filter or search query changes
  useEffect(() => {
    setDisplayLimit(50);
  }, [deferredLibQuery, libBodyPart, libEquipment]);

  const { data: libData, isLoading: isLibLoading, isFetching: isLibFetching } = useExerciseLibrary({
    query: deferredLibQuery,
    bodyPart: libBodyPart,
    equipment: libEquipment,
    limit: displayLimit,
  });

  // Infinite scroll observer: Automatically loads more items as user scrolls near bottom
  useEffect(() => {
    if (!loadMoreSentinelRef.current || !libData?.hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLibFetching) {
          setDisplayLimit((prev) => prev + 50);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(loadMoreSentinelRef.current);
    return () => observer.disconnect();
  }, [libData?.hasMore, isLibFetching]);

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
      setCollapsedExercises((prev) => ({ ...prev, [newExercise.id]: false }));
      setIsChoiceOpen(false);
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

  // Hevy-style progressive overload memory: retrieves previous session performance or set baseline
  const getPreviousSetGhost = (ex: any, setIdx: number) => {
    if (!ex) return { weight: 20, reps: 10, isFromPreviousSession: false };
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`invictus_gym_last_${ex.name?.toLowerCase().trim()}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.sets?.[setIdx] && parsed.sets[setIdx].weight) {
            return {
              weight: parsed.sets[setIdx].weight,
              reps: parsed.sets[setIdx].reps || 10,
              isFromPreviousSession: true,
            };
          }
          if (parsed?.weight) {
            return {
              weight: parsed.weight,
              reps: parsed.reps || 10,
              isFromPreviousSession: true,
            };
          }
        }
      } catch {}
    }
    // Fallback: previous set within current routine
    if (setIdx > 0 && ex.sets?.[setIdx - 1]) {
      return {
        weight: ex.sets[setIdx - 1].weight || 20,
        reps: ex.sets[setIdx - 1].reps || 10,
        isFromPreviousSession: false,
      };
    }
    return { weight: 20, reps: 10, isFromPreviousSession: false };
  };

  // Add a new set to an exercise
  const handleAddSet = async (exId: string) => {
    if (!currentRoutine) return;

    const updatedExercises = (currentRoutine.exercises || []).map((ex: any) => {
      if (ex.id === exId) {
        const nextSetNum = (ex.sets?.length || 0) + 1;
        const ghost = getPreviousSetGhost(ex, nextSetNum - 1);
        const lastSet = ex.sets?.[ex.sets.length - 1];
        const newSet = {
          id: `set_${nextSetNum}_${Date.now()}`,
          setNumber: nextSetNum,
          weight: lastSet?.weight ? lastSet.weight : ghost.weight,
          reps: lastSet?.reps ? lastSet.reps : ghost.reps,
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
      if (field === "completed") {
        if (value === true) {
          soundFX.playPop();
          soundFX.vibrate(25);
          startRestTimer(restDuration);
          const thisEx = updatedExercises.find((e: any) => e.id === exId);
          // Auto-persist previous session memory for Hevy progressive overload
          if (typeof window !== "undefined" && thisEx?.name) {
            try {
              const memory = {
                name: thisEx.name,
                updatedAt: new Date().toISOString(),
                sets: (thisEx.sets || []).map((s: any) => ({ weight: s.weight, reps: s.reps })),
                weight: (thisEx.sets || [])[setIndex]?.weight || 20,
                reps: (thisEx.sets || [])[setIndex]?.reps || 10,
              };
              localStorage.setItem(`invictus_gym_last_${thisEx.name.toLowerCase().trim()}`, JSON.stringify(memory));
            } catch {}
          }
          const thisExCompleted = thisEx && (thisEx.sets || []).length > 0 && (thisEx.sets || []).every((s: any) => s.completed);
          if (thisExCompleted) {
            soundFX.playCompleteChime();
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
        } else {
          soundFX.playPop();
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

  const splitAnatomy = useMemo(() => {
    const primaryMuscles: MuscleGroup[] = [];
    const secondaryMuscles: MuscleGroup[] = [];

    (currentExercises || []).forEach((ex: any) => {
      const res = resolveExerciseAnatomy({
        title: ex.name,
        targetMuscle: ex.targetMuscle,
        primaryMuscles: ex.primaryMuscles,
        secondaryMuscles: ex.secondaryMuscles,
      });
      res.primary.forEach((m) => {
        if (!primaryMuscles.includes(m)) primaryMuscles.push(m);
      });
      res.secondary.forEach((m) => {
        if (!secondaryMuscles.includes(m) && !primaryMuscles.includes(m)) {
          secondaryMuscles.push(m);
        }
      });
    });

    return { primary: primaryMuscles, secondary: secondaryMuscles };
  }, [currentExercises]);

  const totalCompletedSets = currentExercises.reduce(
    (sum: number, ex: any) => sum + (ex.sets?.filter((s: any) => s.completed).length || 0),
    0
  );
  const totalSets = currentExercises.reduce((sum: number, ex: any) => sum + (ex.sets?.length || 0), 0);

  const isAllCollapsed = useMemo(() => {
    if (currentExercises.length === 0) return true;
    return currentExercises.every((ex: any) => (collapsedExercises[ex.id] ?? true));
  }, [currentExercises, collapsedExercises]);

  const toggleAllCollapse = () => {
    if (isAllCollapsed) {
      // User tapped "Expand All": set each exercise to expanded (false)
      const all: Record<string, boolean> = {};
      currentExercises.forEach((ex: any) => {
        all[ex.id] = false;
      });
      setCollapsedExercises(all);
    } else {
      // User tapped "Collapse": set each exercise to collapsed (true)
      const all: Record<string, boolean> = {};
      currentExercises.forEach((ex: any) => {
        all[ex.id] = true;
      });
      setCollapsedExercises(all);
    }
  };

  return (
    <div className="bg-white dark:bg-[#161514] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-5">
      {/* Tracker Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E5DF] dark:border-[#2A2724]">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-[#03D26F]/10 border border-[#03D26F]/20 text-[#047857] dark:text-[#03D26F] flex items-center justify-center shrink-0">
            <Dumbbell className="size-5 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-heading font-bold text-[#161514] dark:text-white tracking-tight">
              Gym Routine & Splits
            </h3>
            <p className="text-xs text-[#6E6B65] dark:text-[#9E9A90] font-normal mt-0.5 flex items-center gap-2 flex-wrap">
              <span>
                Logged sets: <strong className="text-[#161514] dark:text-white font-semibold font-mono">{totalCompletedSets} / {totalSets} sets</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#03D26F]/10 text-[#047857] dark:text-[#03D26F] text-[10px] font-mono border border-[#03D26F]/20">
                <span className="size-1.5 rounded-full bg-[#03D26F] animate-pulse" />
                {getFriendlyWeekLabel()}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalSets > 0 && (
            <button
              onClick={handleResetWeeklyTicks}
              className="text-xs font-medium text-[#161514] dark:text-white bg-[#F1EFEA] hover:bg-[#E8E5DF] dark:bg-[#23201D] dark:hover:bg-[#2A2724] px-3 py-1.5 rounded-xl cursor-pointer transition-all border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs active:scale-95"
              title="Uncheck all sets to re-log without losing weights/reps"
            >
              Reset Sets
            </button>
          )}
          <button
            onClick={() => {
              setRoutineTitleInput(currentRoutine?.routineTitle || defaultRoutineTitles[selectedDay]);
              setIsRoutineTitleOpen(true);
            }}
            className="text-xs font-medium text-[#161514] dark:text-white bg-white hover:bg-[#F1EFEA] dark:bg-[#1C1A18] px-3.5 py-1.5 rounded-xl cursor-pointer transition-all border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs hover:border-[#161514]/30 flex items-center gap-1.5 active:scale-95"
          >
            <Edit3 className="size-3.5 stroke-[2]" /> Split Title
          </button>
        </div>
      </div>

      {/* Day Split Selector Bar (Monday - Sunday) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
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
                "px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border select-none active:scale-95",
                isSelected
                  ? "border-[#161514] dark:border-white bg-[#161514] text-white dark:bg-white dark:text-[#161514] shadow-xs"
                  : "border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#1C1A18] text-[#6E6B65] dark:text-[#9E9A90] hover:text-[#161514] hover:bg-[#F1EFEA] dark:hover:bg-white/5"
              )}
            >
              <span>{day.slice(0, 3)}</span>
              {isToday && (
                <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" title="Today" />
              )}
              {hasExercises && !isToday && (
                <span className="size-1.5 rounded-full bg-[#03D26F]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Rest Duration Presets Bar */}
      <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] rounded-2xl p-3 shadow-none flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Timer className="size-4 text-[#161514] dark:text-white stroke-[2]" />
          <span className="text-xs font-medium text-[#161514] dark:text-white">
            Auto Rest Duration:
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {[30, 45, 60, 90, 120].map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => {
                setDefaultRestDuration(sec);
                soundFX.playPop();
                toast.success(`Default rest timer set to ${sec}s`);
              }}
              className={cn(
                "text-xs font-mono font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer active:scale-95",
                restDuration === sec
                  ? "border-[#161514] dark:border-white bg-[#161514] text-white dark:bg-white dark:text-[#161514] shadow-xs"
                  : "border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#23201D] text-[#6E6B65] dark:text-[#9E9A90] hover:text-[#161514]"
              )}
            >
              {sec}s
            </button>
          ))}
        </div>
      </div>

      {/* Stage 1 Sub-Banner: Routine Split Title & Telemetry Progress */}
      <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] rounded-2xl p-4 shadow-none space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono text-[#6E6B65] dark:text-[#9E9A90] block">
              {selectedDay} Workout Split
            </span>
            <h4 className="text-base sm:text-lg font-heading font-bold text-[#161514] dark:text-white mt-0.5 leading-snug break-words">
              {currentRoutine?.routineTitle || defaultRoutineTitles[selectedDay]}
            </h4>
          </div>

          {/* Quick Telemetry Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-[#23201D] border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs text-xs font-mono font-medium text-[#161514] dark:text-white">
              <Flame className="size-3.5 fill-rose-500 text-rose-600" />
              <span>{splitAnatomy.primary.length + splitAnatomy.secondary.length} Focus Areas</span>
            </div>
            {isTimerRunning && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#161514] text-white border border-white/10 shadow-xs text-xs font-mono font-medium animate-pulse">
                <Timer className="size-3.5 text-white/80" />
                <span>REST: {gymRest.secondsLeft}s</span>
              </div>
            )}
          </div>
        </div>

        {/* Sets Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-mono text-[#6E6B65] dark:text-[#9E9A90]">
            <span>Workout Completion</span>
            <span className="text-[#161514] dark:text-white font-medium">
              {totalSets > 0 ? Math.round((totalCompletedSets / totalSets) * 100) : 0}% Complete ({totalCompletedSets}/{totalSets} sets)
            </span>
          </div>
          <div className="h-2 w-full bg-[#E8E5DF] dark:bg-[#2A2724] rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-[#03D26F] rounded-full transition-all duration-300"
              style={{ width: `${totalSets > 0 ? (totalCompletedSets / totalSets) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── STAGE 2: TARGET MUSCLE BODY SVG STAGE (EMBEDDED IN PAGE) ─── */}
      <div className="bg-white dark:bg-[#161514] border border-[#E8E5DF] dark:border-[#2A2724] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#E8E5DF] dark:border-[#2A2724] flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-[#03D26F]/10 border border-[#03D26F]/20 text-[#047857] dark:text-[#03D26F] flex items-center justify-center text-sm font-semibold shrink-0">
              🧬
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm text-[#161514] dark:text-white leading-tight flex items-center gap-2">
                <span>Target Muscle Anatomy & Activation</span>
                <span className="text-[10px] font-mono font-semibold bg-[#03D26F]/15 text-[#047857] dark:text-[#03D26F] px-2 py-0.5 rounded-full border border-[#03D26F]/30">
                  Real-time
                </span>
              </h4>
              <p className="text-xs text-[#6E6B65] dark:text-[#9E9A90]">
                {splitAnatomy.primary.length + splitAnatomy.secondary.length > 0
                  ? `${splitAnatomy.primary.length + splitAnatomy.secondary.length} muscle groups illuminated in today's split`
                  : "No movements logged yet for today. Add exercises below to illuminate your anatomical heatmap!"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAnatomyExpanded(!isAnatomyExpanded)}
            className="text-xs font-medium px-3 py-1.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] hover:bg-[#F1EFEA] text-[#161514] dark:text-white shadow-xs cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
          >
            {isAnatomyExpanded ? (
              <>
                <ChevronUp className="size-3.5 stroke-[2]" />
                <span>Hide Anatomy</span>
              </>
            ) : (
              <>
                <ChevronDown className="size-3.5 stroke-[2]" />
                <span>Inspect Anatomy ({splitAnatomy.primary.length + splitAnatomy.secondary.length})</span>
              </>
            )}
          </button>
        </div>

        {/* Embedded Body Model */}
        {isAnatomyExpanded && (
          <div className="space-y-3 pt-1 animate-in fade-in duration-200">
            <div className="flex justify-center py-2 bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724]">
              <HumanMuscleAnatomy
                highlightedMuscles={splitAnatomy}
                size="md"
                interactive={true}
                showViewToggle={true}
                showLegend={true}
              />
            </div>

            {/* Focus Area Badges Strip */}
            <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-[#161514] dark:text-white">
                <span>Active Split Focus Areas:</span>
                <span className="text-[#047857] dark:text-[#03D26F] font-mono text-[11px]">
                  {splitAnatomy.primary.length} Primary &bull; {splitAnatomy.secondary.length} Secondary
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {splitAnatomy.primary.map((m) => (
                  <span
                    key={m}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 text-xs font-medium flex items-center gap-1.5"
                  >
                    <Flame className="size-3 fill-rose-500 text-rose-600" />
                    <span>{m}</span>
                  </span>
                ))}
                {splitAnatomy.secondary.map((m) => (
                  <span
                    key={m}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 text-xs font-medium flex items-center gap-1.5"
                  >
                    <Sparkles className="size-3 text-amber-600" />
                    <span>{m}</span>
                  </span>
                ))}
                {splitAnatomy.primary.length === 0 && splitAnatomy.secondary.length === 0 && (
                  <span className="text-xs text-[#6E6B65] dark:text-[#9E9A90] italic">
                    Add movements in Stage 3 below to light up muscle activation.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── STAGE 3: IN BETWEEN: IMMERSIVE MOVEMENT CHOICE & ACTION BAR ─── */}
      <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-2xl p-3.5 sm:p-4 border border-[#E8E5DF] dark:border-[#2A2724] shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-heading font-bold text-[#161514] dark:text-white">
              {selectedDay} Movements
            </span>
            <span className="bg-[#161514] dark:bg-white text-white dark:text-[#161514] text-[10px] font-mono font-medium px-2 py-0.5 rounded-full">
              {currentExercises.length} Exercises
            </span>
          </div>
          <p className="text-xs text-[#6E6B65] dark:text-[#9E9A90] mt-0.5">
            Log sets, weights, and reps below. Tap '+ Add Movement' to choose from 4,300+ exercises or pick a proven split.
          </p>
        </div>

        {/* Action Buttons with flex-wrap ensuring ZERO OVERFLOW */}
        <div className="flex flex-wrap items-center justify-end gap-2 shrink min-w-0 w-full sm:w-auto">
          {currentExercises.length > 1 && (
            <button
              type="button"
              onClick={toggleAllCollapse}
              className="bg-white dark:bg-[#23201D] hover:bg-[#F1EFEA] text-[#161514] dark:text-white font-medium rounded-xl py-2 px-3 text-xs border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs cursor-pointer transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap"
              title={isAllCollapsed ? "Expand all exercises" : "Collapse all exercises"}
            >
              {isAllCollapsed ? (
                <>
                  <ChevronDown className="size-3.5 stroke-[2]" />
                  <span>Expand All</span>
                </>
              ) : (
                <>
                  <ChevronUp className="size-3.5 stroke-[2]" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => {
              setIsChoiceOpen(true);
              soundFX.playPop();
            }}
            className="bg-[#161514] hover:bg-[#2A2724] dark:bg-white dark:hover:bg-white/90 text-white dark:text-[#161514] font-medium rounded-xl py-2 px-4 text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition-all whitespace-nowrap active:scale-95"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>Add Movement</span>
          </button>
        </div>
      </div>

      {/* Exercise & Machine Cards List */}
      {isLoading ? (
        <div className="h-24 animate-pulse bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724]" />
      ) : currentExercises.length === 0 ? (
        <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-2xl p-6 border border-[#E8E5DF] dark:border-[#2A2724] text-center space-y-4">
          <div className="size-12 rounded-2xl bg-[#03D26F]/10 border border-[#03D26F]/20 text-[#047857] dark:text-[#03D26F] flex items-center justify-center mx-auto">
            <Dumbbell className="size-6 stroke-[1.8]" />
          </div>
          <div className="space-y-1">
            <h4 className="font-heading font-bold text-base text-[#161514] dark:text-white">
              No workout scheduled for {selectedDay} yet
            </h4>
            <p className="text-xs text-[#6E6B65] dark:text-[#9E9A90] max-w-md mx-auto">
              Start your session in seconds. Apply a battle-tested routine preset in one tap or select movements from our 4,300+ exercise library.
            </p>
          </div>

          {/* 1-Tap Split Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-xl mx-auto pt-1">
            {GYM_TEMPLATE_PACKS.slice(0, 3).map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => {
                  handleApplyGymPack(pack);
                  soundFX.playPop();
                }}
                className="p-3 rounded-xl bg-white dark:bg-[#23201D] border border-[#E8E5DF] dark:border-[#2A2724] hover:border-[#161514] dark:hover:border-white/30 transition-all text-left shadow-xs cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#161514] dark:text-white group-hover:text-[#047857] dark:group-hover:text-[#03D26F] transition-colors">
                    {pack.name}
                  </span>
                  <span className="text-[10px] font-mono text-[#6E6B65] dark:text-[#9E9A90]">
                    {pack.items.length} moves
                  </span>
                </div>
                <p className="text-[10px] text-[#6E6B65] dark:text-[#9E9A90] mt-1 line-clamp-1">
                  {pack.tagline}
                </p>
              </button>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsChoiceOpen(true);
                soundFX.playPop();
              }}
              className="px-4 py-2 rounded-xl bg-[#161514] text-white font-medium text-xs shadow-xs hover:bg-[#2A2724] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="size-3.5" />
              <span>Browse 4,300+ Exercise Library</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 pb-2">
          {currentExercises.map((ex: any) => {
            const isCompleted = (ex.sets || []).length > 0 && (ex.sets || []).every((s: any) => s.completed);
            const completedCount = (ex.sets || []).filter((s: any) => s.completed).length;
            const totalCount = ex.sets?.length || 0;
            const isCollapsed = collapsedExercises[ex.id] ?? true;

            if (isCollapsed) {
              return (
                <div
                  key={ex.id}
                  className={cn(
                    "bg-white dark:bg-[#1C1A18] hover:bg-[#FAF8F5] dark:hover:bg-[#23201D] rounded-2xl p-3.5 border border-[#E8E5DF] dark:border-[#2A2724] transition-all shadow-none cursor-pointer select-none",
                    isCompleted && "bg-emerald-50/50 dark:bg-emerald-950/20 border-[#03D26F]/30"
                  )}
                  onClick={() => toggleCollapse(ex.id)}
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Icon + Full Exercise Name + Expand Chevron */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div
                          className={cn(
                            "size-8 rounded-xl border flex items-center justify-center text-sm shrink-0 font-medium mt-0.5",
                            isCompleted
                              ? "bg-[#03D26F]/15 border-[#03D26F]/30 text-[#047857] dark:text-[#03D26F]"
                              : "bg-[#F1EFEA] dark:bg-[#23201D] border-[#E8E5DF] dark:border-[#2A2724] text-[#161514] dark:text-white"
                          )}
                        >
                          {isCompleted ? "✓" : "🏋️"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-semibold text-xs sm:text-sm text-[#161514] dark:text-white leading-snug break-words">
                            {ex.name}
                          </h5>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        <div
                          className="size-6 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-center text-[#6E6B65] dark:text-[#9E9A90] bg-white dark:bg-[#23201D]"
                          title="Expand exercise"
                        >
                          <ChevronDown className="size-3.5 stroke-[2]" />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Muscle & Equipment Pills + Progress Badge + Form Guide */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E8E5DF]/60 dark:border-[#2A2724] flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                          {ex.targetMuscle || "General"}
                        </span>
                        {ex.machineName && (
                          <span className="text-[10px] font-normal text-[#6E6B65] dark:text-[#9E9A90]">
                            • {ex.machineName}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-[#6E6B65] dark:text-[#9E9A90]">
                          • {totalCount} Sets
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                        <span
                          className={cn(
                            "text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border",
                            isCompleted
                              ? "bg-[#03D26F]/15 text-[#047857] dark:text-[#03D26F] border-[#03D26F]/30"
                              : "bg-[#FAF8F5] dark:bg-[#23201D] text-[#161514] dark:text-white border-[#E8E5DF] dark:border-[#2A2724]"
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
                          className="px-2 py-0.5 rounded-md bg-[#FAF8F5] dark:bg-[#23201D] hover:bg-[#F1EFEA] text-[#161514] dark:text-white text-[10px] font-medium border border-[#E8E5DF] dark:border-[#2A2724] flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
                          title="Form Guide"
                        >
                          <Eye className="size-3 stroke-[2]" />
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
                  "bg-white dark:bg-[#1C1A18] rounded-2xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] shadow-none space-y-3.5 transition-all",
                  isCompleted && "bg-emerald-50/40 dark:bg-emerald-950/20 border-[#03D26F]/30"
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
                      <h5 className="font-semibold text-sm sm:text-base text-[#161514] dark:text-white leading-snug break-words">
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
                        className="size-7 rounded-lg bg-white dark:bg-[#23201D] hover:bg-[#F1EFEA] border border-[#E8E5DF] dark:border-[#2A2724] text-[#6E6B65] hover:text-[#161514] shadow-xs cursor-pointer transition-all flex items-center justify-center active:scale-95"
                        title="Edit exercise"
                      >
                        <Edit3 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteExId(ex.id)}
                        className="size-7 rounded-lg bg-white dark:bg-[#23201D] hover:bg-rose-50 border border-[#E8E5DF] dark:border-[#2A2724] text-[#6E6B65] hover:text-rose-600 shadow-xs cursor-pointer transition-all flex items-center justify-center active:scale-95"
                        title="Delete exercise"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCollapse(ex.id)}
                        className="size-7 rounded-lg bg-white dark:bg-[#23201D] hover:bg-[#F1EFEA] border border-[#E8E5DF] dark:border-[#2A2724] text-[#6E6B65] hover:text-[#161514] shadow-xs cursor-pointer transition-all flex items-center justify-center active:scale-95"
                        title="Collapse exercise"
                      >
                        <ChevronUp className="size-3.5 stroke-[2]" />
                      </button>
                    </div>
                  </div>

                  {/* Sub-line: Muscle Tag + Machine + Form Guide Button + Progressive Overload Ghost Target */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                        {ex.targetMuscle || "General"}
                      </span>
                      {ex.machineName && (
                        <span className="text-xs text-[#6E6B65] dark:text-[#9E9A90] flex items-center gap-1">
                          <Layers className="size-3 text-[#6E6B65]" /> {ex.machineName}
                        </span>
                      )}
                      {(() => {
                        const ghost = getPreviousSetGhost(ex, 0);
                        return (
                          <span
                            title="Hevy Progressive Overload Target"
                            className="text-[10px] font-mono text-[#6E6B65] dark:text-[#9E9A90] bg-[#FAF8F5] dark:bg-[#23201D] px-2 py-0.5 rounded-md border border-[#E8E5DF] dark:border-[#2A2724] flex items-center gap-1"
                          >
                            <Flame className="size-2.5 text-orange-500 fill-orange-400" />
                            <span>{ghost.isFromPreviousSession ? `Prev: ${ghost.weight}kg × ${ghost.reps}` : `Target: ${ghost.weight}kg × ${ghost.reps}`}</span>
                          </span>
                        );
                      })()}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedGuideExercise(ex)}
                      className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] dark:bg-[#23201D] hover:bg-[#F1EFEA] text-[#161514] dark:text-white font-medium text-xs border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
                      title="View execution form guide, muscle activation & posture"
                    >
                      <Eye className="size-3 stroke-[2]" />
                      <span>Form Guide</span>
                    </button>
                  </div>
                </div>

                {/* Sets Table */}
                <div className="bg-white dark:bg-[#161514] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] overflow-hidden text-xs shadow-none">
                  <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-[#FAF8F5] dark:bg-[#1C1A18] font-mono text-[10px] text-[#6E6B65] dark:text-[#9E9A90] uppercase tracking-wider text-center border-b border-[#E8E5DF] dark:border-[#2A2724]">
                    <span>Set</span>
                    <span>Weight (kg)</span>
                    <span>Reps</span>
                    <span>Done</span>
                  </div>

                  <div className="divide-y divide-[#E8E5DF]/60 dark:divide-[#2A2724]">
                    {(ex.sets || []).map((st: any, idx: number) => {
                      const ghost = getPreviousSetGhost(ex, idx);
                      return (
                        <div key={st.id || idx} className="grid grid-cols-4 gap-2 px-3 py-2.5 items-center text-center">
                          <span className="font-mono font-medium text-[#161514] dark:text-white text-xs">Set {st.setNumber}</span>
                          <div className="flex justify-center">
                            <input
                              type="number"
                              value={st.weight === 0 ? "" : st.weight}
                              placeholder={String(ghost.weight)}
                              onChange={(e) => handleSetChange(ex.id, idx, "weight", e.target.value === "" ? 0 : Number(e.target.value))}
                              className="w-full max-w-[64px] bg-[#FAF8F5] dark:bg-[#23201D] border border-[#E8E5DF] dark:border-[#2A2724] rounded-xl py-1.5 px-1 text-center font-mono font-medium text-[#161514] dark:text-white placeholder:text-[#6E6B65]/40 text-base sm:text-xs outline-none focus:border-[#161514] dark:focus:border-white shadow-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                              min={0}
                            />
                          </div>
                          <div className="flex justify-center">
                            <input
                              type="number"
                              value={st.reps === 0 ? "" : st.reps}
                              placeholder={String(ghost.reps)}
                              onChange={(e) => handleSetChange(ex.id, idx, "reps", e.target.value === "" ? 0 : Number(e.target.value))}
                              className="w-full max-w-[64px] bg-[#FAF8F5] dark:bg-[#23201D] border border-[#E8E5DF] dark:border-[#2A2724] rounded-xl py-1.5 px-1 text-center font-mono font-medium text-[#161514] dark:text-white placeholder:text-[#6E6B65]/40 text-base sm:text-xs outline-none focus:border-[#161514] dark:focus:border-white shadow-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                              min={1}
                            />
                          </div>
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleSetChange(ex.id, idx, "completed", !st.completed)}
                            className={cn(
                              "size-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all shadow-xs active:scale-95",
                              st.completed
                                ? "bg-[#03D26F] border-[#03D26F] text-white shadow-xs"
                                : "bg-white dark:bg-[#23201D] border-[#E8E5DF] dark:border-[#2A2724] text-[#6E6B65] hover:text-[#161514] hover:bg-[#FAF8F5]"
                            )}
                            title={st.completed ? "Mark incomplete" : "Mark completed (Starts Rest Timer)"}
                          >
                            {st.completed ? (
                              <CheckCircle2 className="size-5 stroke-[2] text-white" />
                            ) : (
                              <Circle className="size-5 stroke-[2]" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>

                {/* Set Actions Bar */}
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleAddSet(ex.id)}
                      className="font-medium text-xs text-[#047857] dark:text-[#03D26F] bg-[#03D26F]/10 hover:bg-[#03D26F]/20 px-3 py-1 rounded-full cursor-pointer transition-colors border border-[#03D26F]/20 flex items-center gap-1 shrink-0 whitespace-nowrap active:scale-95"
                    >
                      <Plus className="size-3 stroke-[2]" />
                      <span>Add Set</span>
                    </button>
                    {ex.sets && ex.sets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSet(ex.id)}
                        className="font-medium text-xs text-[#6E6B65] hover:text-rose-600 bg-[#F1EFEA] hover:bg-rose-50 px-3 py-1 rounded-full cursor-pointer transition-colors border border-[#E8E5DF] shrink-0 whitespace-nowrap active:scale-95"
                      >
                        Remove Set
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-[#6E6B65] dark:text-[#9E9A90]">
                    {completedCount} / {totalCount} Done
                  </span>
                </div>

                {/* Form Cue / Notes Banner */}
                {ex.notes && (
                  <div className="bg-[#FAF8F5] dark:bg-[#23201D] rounded-xl p-2.5 border border-[#E8E5DF] dark:border-[#2A2724] flex items-start gap-2 text-xs">
                    <span className="text-[10px] font-mono font-semibold bg-[#161514] text-white px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                      CUE
                    </span>
                    <p className="text-[#6E6B65] dark:text-[#9E9A90] text-xs leading-relaxed break-words flex-1">
                      {ex.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── IMMERSIVE MOVEMENT CHOICE MODAL (4,300+ DB VAULT, CUSTOM, PRESETS) ─── */}
      <GymChoiceModal
        open={isChoiceOpen}
        onOpenChange={setIsChoiceOpen}
        selectedDay={selectedDay}
        onSelectExerciseFromLibrary={handleAddExerciseFromLibrary}
        onAddCustomExercise={handleAddCustomExerciseFromChoice}
        onApplyPresetPack={handleApplyGymPack}
        onViewGuide={(ex) => setSelectedGuideExercise(ex)}
        isPending={addRoutineMutation.isPending || updateRoutineMutation.isPending}
      />

      {/* Routine Title Modal */}
      <AdaptiveDrawerDialog
        open={isRoutineTitleOpen}
        onOpenChange={setIsRoutineTitleOpen}
        title={`Set ${selectedDay} Routine Title`}
        description="Name your workout split for this day (e.g. Chest & Triceps Focus)"
      >
        <form onSubmit={handleSaveRoutineTitle} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]">Routine Title</label>
            <input
              type="text"
              placeholder="e.g. Chest & Triceps Focus, Leg Day Blitz"
              value={routineTitleInput}
              onChange={(e) => setRoutineTitleInput(e.target.value)}
              className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-4 py-2.5 text-base font-bold text-[#161514] dark:text-[#FAF8F5] shadow-xs focus:outline-none focus:ring-1 focus:ring-[#161514] dark:focus:ring-white"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={updateRoutineMutation.isPending || addRoutineMutation.isPending}
            className="w-full min-h-[48px] bg-[#161514] hover:bg-[#252321] dark:bg-[#FAF8F5] dark:hover:bg-[#E8E5DF] text-[#FAF8F5] dark:text-[#161514] font-heading font-black text-sm rounded-xl py-3 mt-2 border border-[#161514] dark:border-[#FAF8F5] shadow-xs cursor-pointer active:translate-y-0.5 transition-all"
          >
            Save Routine Title
          </Button>
        </form>
      </AdaptiveDrawerDialog>

      {/* Edit Exercise Modal */}
      <AdaptiveDrawerDialog
        open={editingExercise !== null}
        onOpenChange={(open) => {
          if (!open) setEditingExercise(null);
        }}
        title="Edit Exercise Details"
        description="Update exercise title, equipment, or muscle group"
      >
        <form onSubmit={handleUpdateExercise} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]">
              Exercise Name
            </label>
            <input
              type="text"
              value={editExName}
              onChange={(e) => setEditExName(e.target.value)}
              className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-4 py-2.5 text-base font-bold text-[#161514] dark:text-[#FAF8F5] shadow-xs focus:outline-none focus:ring-1 focus:ring-[#161514] dark:focus:ring-white"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]">
                Machine / Equipment
              </label>
              <input
                type="text"
                value={editExMachine}
                onChange={(e) => setEditExMachine(e.target.value)}
                className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-4 py-2.5 text-base font-bold text-[#161514] dark:text-[#FAF8F5] shadow-xs focus:outline-none focus:ring-1 focus:ring-[#161514] dark:focus:ring-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]">
                Target Muscle
              </label>
              <select
                value={editExTarget}
                onChange={(e) => setEditExTarget(e.target.value)}
                className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-4 py-2.5 text-base font-bold text-[#161514] dark:text-[#FAF8F5] shadow-xs focus:outline-none focus:ring-1 focus:ring-[#161514] dark:focus:ring-white"
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
            className="w-full min-h-[48px] bg-[#161514] hover:bg-[#252321] dark:bg-[#FAF8F5] dark:hover:bg-[#E8E5DF] text-[#FAF8F5] dark:text-[#161514] font-heading font-black text-sm rounded-xl py-3 mt-2 border border-[#161514] dark:border-[#FAF8F5] shadow-xs cursor-pointer active:translate-y-0.5 transition-all"
          >
            Save Changes
          </Button>
        </form>
      </AdaptiveDrawerDialog>

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

      {/* Daily Workout Split Cumulative Muscle Heatmap Modal */}
      <AdaptiveDrawerDialog
        open={isSplitAnatomyOpen}
        onOpenChange={setIsSplitAnatomyOpen}
        title={`${selectedDay} Split Anatomy`}
        description="Muscular activation and volume distribution across today's workout"
      >
        <div className="space-y-4 pt-1 pb-3 text-center">
          <div className="flex justify-center">
            <HumanMuscleAnatomy
              highlightedMuscles={splitAnatomy}
              size="md"
              interactive={true}
              showViewToggle={true}
              showLegend={true}
            />
          </div>

          <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs text-left text-xs space-y-1.5">
            <span className="font-heading font-black uppercase text-[#161514] dark:text-[#FAF8F5] block">
              Active Focus Areas ({splitAnatomy.primary.length} Muscle Groups)
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {splitAnatomy.primary.map((m) => (
                <span
                  key={m}
                  className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800/50 text-[10px] font-black uppercase shadow-xs"
                >
                  🔥 {m}
                </span>
              ))}
              {splitAnatomy.secondary.map((m) => (
                <span
                  key={m}
                  className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800/50 text-[10px] font-black uppercase shadow-xs"
                >
                  ⚡ {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </AdaptiveDrawerDialog>

      {/* Hevy-Style Persistent Floating Rest Countdown Timer Dock */}
      {restSecondsLeft !== null && (
        <div
          role="region"
          aria-label="Floating Rest Timer"
          className="fixed bottom-24 lg:bottom-8 right-3 sm:right-6 z-50 max-w-[360px] w-[calc(100%-1.5rem)] sm:w-auto bg-[#FAF8F5] border-2 border-[#161514] rounded-2xl p-3 sm:p-3.5 shadow-[4px_4px_0px_0px_#161514] animate-in slide-in-from-bottom-4 duration-200 select-none"
        >
          <div className="flex items-center justify-between gap-3">
            {/* Timer Icon & Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  "size-9 rounded-xl border-2 border-[#161514] flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0 transition-colors",
                  restSecondsLeft <= 5 ? "bg-rose-400 text-white animate-bounce" : "bg-[#CEF431] text-[#161514]"
                )}
              >
                <Timer className="size-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514]">
                    Rest Clock
                  </span>
                  {isTimerPaused && (
                    <span className="text-[8px] font-black uppercase px-1 rounded bg-amber-200 border border-[#161514]">
                      Paused
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className={cn(
                      "text-xl sm:text-2xl font-mono font-black tracking-tight",
                      restSecondsLeft <= 5 ? "text-rose-600 animate-pulse" : "text-[#161514]"
                    )}
                  >
                    {Math.floor(restSecondsLeft / 60)}:{(restSecondsLeft % 60).toString().padStart(2, "0")}
                  </span>
                  <span className="text-[9px] font-bold text-[#161514]/60">left</span>
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  addGymRestSeconds(-15);
                }}
                className="px-2 py-1.5 rounded-lg border-2 border-[#161514] bg-white hover:bg-[#FFF9EA] text-[#161514] font-heading font-black text-[10px] shadow-[1px_1px_0px_0px_#161514] active:translate-y-0.5 cursor-pointer"
                title="Subtract 15s"
              >
                -15s
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  addGymRestSeconds(30);
                }}
                className="px-2 py-1.5 rounded-lg border-2 border-[#161514] bg-[#CEF431] hover:bg-[#D8F74E] text-[#161514] font-heading font-black text-[10px] shadow-[1px_1px_0px_0px_#161514] active:translate-y-0.5 cursor-pointer"
                title="Add 30s"
              >
                +30s
              </button>
              <button
                type="button"
                onClick={togglePauseTimer}
                className="size-8 rounded-lg border-2 border-[#161514] bg-white hover:bg-[#FFF9EA] text-[#161514] flex items-center justify-center shadow-[1px_1px_0px_0px_#161514] active:translate-y-0.5 cursor-pointer"
                title={isTimerPaused ? "Resume" : "Pause"}
              >
                {isTimerPaused ? <Play className="size-3.5 fill-current" /> : <Pause className="size-3.5 fill-current" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  stopGymRest();
                }}
                className="size-8 rounded-lg border-2 border-[#161514] bg-rose-100 hover:bg-rose-200 text-[#161514] flex items-center justify-center shadow-[1px_1px_0px_0px_#161514] active:translate-y-0.5 cursor-pointer"
                title="Dismiss rest timer"
              >
                <X className="size-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Micro progress bar along bottom */}
          <div className="w-full h-1.5 bg-[#161514]/10 rounded-full border border-[#161514]/20 overflow-hidden mt-2">
            <div
              className={cn(
                "h-full transition-all duration-500",
                restSecondsLeft <= 5 ? "bg-rose-500" : "bg-[#03D26F]"
              )}
              style={{
                width: `${Math.min(100, Math.max(0, ((restSecondsLeft || 0) / restDuration) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
