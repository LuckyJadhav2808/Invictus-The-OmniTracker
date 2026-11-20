"use client";

import { useState, useMemo, useDeferredValue, useEffect } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { VList } from "virtua";
import {
  Dumbbell,
  Search,
  Check,
  Plus,
  Trash2,
  Eye,
  Sparkles,
  X,
  Layers,
  ChevronRight,
  Flame,
} from "lucide-react";
import { AdaptiveDrawerDialog } from "@/components/shared/AdaptiveDrawerDialog";
import { StrobiCompanion } from "@/components/mascot/StrobiCompanion";
import { useGymRoutines, useAddGymRoutine, useUpdateGymRoutine } from "@/lib/queries/gym";
import { useExerciseLibrary } from "@/lib/queries/exercises";
import { soundFX } from "@/components/shared/SoundFX";
import { strobiToast } from "@/lib/utils/toasts";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const ExerciseGuideModal = dynamic(
  () => import("@/components/goals/ExerciseGuideModal").then((m) => m.ExerciseGuideModal),
  { ssr: false }
);

interface QuickWorkoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: string;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

const DEFAULT_ROUTINE_TITLES: Record<string, string> = {
  Monday: "Chest & Triceps Focus",
  Tuesday: "Back & Biceps Hypertrophy",
  Wednesday: "Legs & Core Power",
  Thursday: "Shoulders & Arms Pump",
  Friday: "Upper Body Strength",
  Saturday: "Full Body & Cardio",
  Sunday: "Active Recovery & Mobility",
};

function getTodayDayName(): DayOfWeek {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const idx = new Date().getDay();
  return (days[idx] as DayOfWeek) || "Monday";
}

/**
 * Miniature animated SVG rep lifter & image frame switcher.
 * Alternates between eccentric (lowering) and concentric (lifting) phases
 * every 1.2s to visually teach the exercise motion without clipping.
 */
function ExerciseThumbnailAnimation({
  images,
  gifUrl,
  targetMuscle = "Chest",
  onOpenGuide,
}: {
  images?: string[];
  gifUrl?: string;
  targetMuscle?: string;
  onOpenGuide?: () => void;
}) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev === 0 ? 1 : 0));
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  const hasTwoImages = images && images.length >= 2;
  const currentImg = hasTwoImages ? images[frame] : images?.[0] || gifUrl;

  return (
    <button
      type="button"
      onClick={onOpenGuide}
      title="View exercise form guide"
      className="size-12 rounded-xl border-2 border-[#161514] dark:border-[#38332E] overflow-hidden bg-white dark:bg-[#1C1A18] flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer group relative will-change-transform"
    >
      {currentImg ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={currentImg}
          alt="Exercise motion"
          className="w-full h-full object-cover transition-opacity duration-200"
          loading="lazy"
        />
      ) : (
        /* High-Definition 2-Frame Repetition Animation */
        <svg
          viewBox="0 0 32 32"
          className="size-7 text-amber-600 dark:text-amber-400 transition-all duration-300 ease-out will-change-transform"
          style={{
            transform: frame === 1 ? "scale(1.08) translateY(-2px)" : "scale(0.95) translateY(1px)",
          }}
        >
          {/* Head & Torso */}
          <circle cx="16" cy="8" r="3" fill="currentColor" opacity={frame === 1 ? 1 : 0.85} />
          <line x1="16" y1="11" x2="16" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="16" y1="20" x2="12" y2="28" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="16" y1="20" x2="20" y2="28" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />

          {/* Alternating concentric vs eccentric barbell position */}
          {frame === 0 ? (
            <>
              {/* Lowered (Eccentric) */}
              <line x1="16" y1="13" x2="9" y2="17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="16" y1="13" x2="23" y2="17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <rect x="5" y="15" width="22" height="2.5" rx="1" fill="#161514" />
              <circle cx="5" cy="16.25" r="2.5" fill="currentColor" />
              <circle cx="27" cy="16.25" r="2.5" fill="currentColor" />
            </>
          ) : (
            <>
              {/* Pressed / Lifted (Concentric Peak) */}
              <line x1="16" y1="13" x2="11" y2="7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="16" y1="13" x2="21" y2="7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <rect x="5" y="4" width="22" height="2.5" rx="1" fill="#161514" />
              <circle cx="5" cy="5.25" r="2.5" fill="currentColor" />
              <circle cx="27" cy="5.25" r="2.5" fill="currentColor" />
            </>
          )}
        </svg>
      )}

      {/* Subtle indicator dot showing active motion phase */}
      <span
        className={cn(
          "absolute bottom-0.5 right-0.5 size-1.5 rounded-full transition-colors",
          frame === 1 ? "bg-[#03D26F]" : "bg-[#161514]/40 dark:bg-white/40"
        )}
      />
    </button>
  );
}

export function QuickWorkoutModal({
  open,
  onOpenChange,
  selectedDate,
}: QuickWorkoutModalProps) {
  const todayDay = useMemo(() => getTodayDayName(), []);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayDay);

  // Synchronized gym routines data
  const { data: routines = [] } = useGymRoutines();
  const addRoutineMutation = useAddGymRoutine();
  const updateRoutineMutation = useUpdateGymRoutine();

  // Active routine for selected day
  const currentRoutine = useMemo(() => {
    return routines.find((r: any) => r.dayOfWeek === selectedDay);
  }, [routines, selectedDay]);

  // Performance-optimized 60fps layout animations (Zero CLS)
  const [exercisesListRef] = useAutoAnimate<HTMLDivElement>({ duration: 180, easing: "ease-out" });
  const [searchDeckRef] = useAutoAnimate<HTMLDivElement>({ duration: 150, easing: "ease-out" });

  const exercises = currentRoutine?.exercises || [];
  const completedCount = exercises.filter((ex: any) => ex.completed).length;

  // Search & ||| Deck State
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery.trim());

  // Guide Modal State
  const [selectedGuideExercise, setSelectedGuideExercise] = useState<any | null>(null);

  // 4,300+ Exercise Library Hook
  const { data: libraryResults, isFetching: isSearching } = useExerciseLibrary({
    query: showSearch && deferredSearch.length >= 2 ? deferredSearch : "",
    limit: 6,
  });

  const libraryMatches = libraryResults?.exercises || [];

  // Reset search when modal opens/closes
  useEffect(() => {
    if (!open) {
      setShowSearch(false);
      setSearchQuery("");
      setSelectedDay(todayDay);
    }
  }, [open, todayDay]);

  // Toggle Exercise Check / Uncheck (CRUD - Update)
  const handleToggleExercise = async (exId: string) => {
    if (!currentRoutine) return;
    soundFX.playPop();

    const targetEx = exercises.find((e: any) => e.id === exId);
    const willBeCompleted = !targetEx?.completed;

    const updatedExercises = exercises.map((ex: any) => {
      if (ex.id === exId) {
        return {
          ...ex,
          completed: willBeCompleted,
          sets: (ex.sets || []).map((s: any) => ({ ...s, completed: willBeCompleted })),
        };
      }
      return ex;
    });

    try {
      await updateRoutineMutation.mutateAsync({
        id: currentRoutine.id,
        exercises: updatedExercises,
      });

      if (willBeCompleted) {
        soundFX.playCompleteChime();
        soundFX.vibrate([40, 60, 100]);
        strobiToast.habits(`Crushed ${targetEx?.name || "Exercise"}! 💪`, {
          quip: "Discipline compounds. Every rep locks in your strength identity.",
        });
      } else {
        strobiToast.habits("Exercise uncompleted");
      }
    } catch {
      strobiToast.habits("Failed to update exercise");
    }
  };

  // Delete Exercise (CRUD - Delete)
  const handleDeleteExercise = async (exId: string, exName: string) => {
    if (!currentRoutine) return;
    soundFX.playPop();
    soundFX.vibrate(20);

    const updatedExercises = exercises.filter((ex: any) => ex.id !== exId);

    try {
      await updateRoutineMutation.mutateAsync({
        id: currentRoutine.id,
        exercises: updatedExercises,
      });
      strobiToast.habits(`Removed '${exName}' from ${selectedDay}`);
    } catch {
      strobiToast.habits("Failed to remove exercise");
    }
  };

  // Add Exercise from 4,300+ Database (CRUD - Create)
  const handleAddFromLibrary = async (item: any) => {
    soundFX.playPop();
    soundFX.vibrate(25);

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
      completed: false,
      notes: item.desc ? item.desc.slice(0, 120) : `${item.level || ""} ${item.type || ""}`.trim(),
      sets: [
        { id: `set_1_${Date.now()}`, setNumber: 1, weight: 20, reps: 12, completed: false },
        { id: `set_2_${Date.now()}`, setNumber: 2, weight: 25, reps: 10, completed: false },
        { id: `set_3_${Date.now()}`, setNumber: 3, weight: 30, reps: 8, completed: false },
      ],
    };

    const updatedExercises = [...exercises, newExercise];

    try {
      if (currentRoutine) {
        await updateRoutineMutation.mutateAsync({
          id: currentRoutine.id,
          exercises: updatedExercises,
        });
      } else {
        await addRoutineMutation.mutateAsync({
          dayOfWeek: selectedDay,
          routineTitle: DEFAULT_ROUTINE_TITLES[selectedDay] || "Daily Workout Split",
          exercises: updatedExercises,
        });
      }
      strobiToast.habits(`Added '${item.title}' to ${selectedDay}! 🏋️`);
      setSearchQuery("");
      setShowSearch(false);
    } catch {
      strobiToast.habits("Failed to add exercise");
    }
  };

  // Add Custom Exercise (if not present in dataset)
  const handleAddCustomExercise = async () => {
    if (!searchQuery.trim()) return;
    soundFX.playPop();
    soundFX.vibrate(25);

    const customName = searchQuery.trim();
    const newExercise = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: customName,
      machineName: "Custom Exercise",
      targetMuscle: "Full Body",
      equipment: "Free Weight / Machine",
      instructions: [],
      images: [],
      gifUrl: "",
      secondaryMuscles: [],
      completed: false,
      notes: "Custom entry",
      sets: [
        { id: `set_1_${Date.now()}`, setNumber: 1, weight: 20, reps: 10, completed: false },
        { id: `set_2_${Date.now()}`, setNumber: 2, weight: 20, reps: 10, completed: false },
        { id: `set_3_${Date.now()}`, setNumber: 3, weight: 20, reps: 10, completed: false },
      ],
    };

    const updatedExercises = [...exercises, newExercise];

    try {
      if (currentRoutine) {
        await updateRoutineMutation.mutateAsync({
          id: currentRoutine.id,
          exercises: updatedExercises,
        });
      } else {
        await addRoutineMutation.mutateAsync({
          dayOfWeek: selectedDay,
          routineTitle: DEFAULT_ROUTINE_TITLES[selectedDay] || "Daily Workout Split",
          exercises: updatedExercises,
        });
      }
      strobiToast.habits(`Added custom '${customName}' to ${selectedDay}! 🏋️`);
      setSearchQuery("");
      setShowSearch(false);
    } catch {
      strobiToast.habits("Failed to add custom exercise");
    }
  };

  return (
    <>
      <AdaptiveDrawerDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Workout & Routines Cockpit"
        description="Daily exercises, animated form guides, and full-week routine builder"
      >
        <div className="space-y-3.5 py-1 select-none">
          {/* ================= 1. 7-DAY WHOLE-WEEK ROUTINE BUILDER STRIP ================= */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-heading font-black uppercase tracking-wider text-muted-foreground">
                Whole-Week Split
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                Tap day to build routine
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 bg-secondary/50 p-1 rounded-2xl border border-border">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedDay === day;
                const isToday = todayDay === day;
                const dayRoutine = routines.find((r: any) => r.dayOfWeek === day);
                const exCount = dayRoutine?.exercises?.length || 0;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setSelectedDay(day);
                      setShowSearch(false);
                    }}
                    className={cn(
                      "min-h-[46px] py-1.5 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer relative",
                      isSelected
                        ? "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] font-black border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]"
                        : "bg-white dark:bg-[#1C1A18] text-foreground border border-border/80 hover:bg-secondary"
                    )}
                  >
                    <span className="text-[10px] font-heading font-black uppercase tracking-tight">
                      {day.slice(0, 3)}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] font-mono font-bold mt-0.5",
                        isSelected
                          ? "opacity-95"
                          : exCount > 0
                          ? "text-[#03D26F] dark:text-[#03D26F]"
                          : "text-muted-foreground"
                      )}
                    >
                      {exCount > 0 ? `${exCount}ex` : "—"}
                    </span>
                    {isToday && (
                      <span className="absolute -top-1 -right-1 size-2 rounded-full bg-[#CEF431] border border-[#161514]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================= 2. ACTIVE DAY HEADER + ||| SEARCH TOGGLE BUTTON ================= */}
          <div className="p-3 bg-white dark:bg-[#1C1A18] rounded-2xl border-2 border-[#161514] dark:border-[#38332E] shadow-[2.5px_2.5px_0px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_0px_#000000] flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-muted-foreground">
                  {selectedDay === todayDay ? "TODAY" : selectedDay.toUpperCase()} ROUTINE
                </span>
                {exercises.length > 0 && (
                  <span className="text-[9.5px] font-mono font-bold bg-[#03D26F]/10 text-[#047857] dark:text-[#03D26F] border border-[#03D26F]/30 px-1.5 py-0.2 rounded-md">
                    {completedCount}/{exercises.length} Crushed
                  </span>
                )}
              </div>
              <h4 className="font-heading font-black text-sm text-foreground truncate mt-0.5">
                {currentRoutine?.routineTitle || DEFAULT_ROUTINE_TITLES[selectedDay]}
              </h4>
            </div>

            {/* Tactical ||| Button to Choose Exercises from 4,300+ Database */}
            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                setShowSearch(!showSearch);
              }}
              className={cn(
                "h-10 px-3 rounded-xl border-2 border-[#161514] dark:border-[#38332E] font-heading font-black text-xs flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer shrink-0",
                showSearch
                  ? "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514]"
                  : "bg-[#CEF431] text-[#161514] hover:bg-[#b8dd24]"
              )}
              title="Search 4,300+ Exercise Database"
            >
              <span className="font-mono font-black text-sm tracking-tighter">|||</span>
              <span>{showSearch ? "Close" : "Add Ex"}</span>
            </button>
          </div>

          {/* ================= 3. ||| LIVE 4,300+ EXERCISE SEARCH & BUILDER DECK ================= */}
          <div ref={searchDeckRef}>
            {showSearch && (
              <div className="p-3 bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] rounded-2xl shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-heading font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Search className="size-3 text-[#161514] dark:text-[#FAF8F5]" />
                    <span>4,300+ Exercise Database</span>
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {isSearching ? "Searching library…" : "Instant auto-complete"}
                  </span>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type exercise (e.g. Incline Bench, Squat, Lat Pulldown)..."
                    className="w-full h-11 pl-3.5 pr-9 bg-[#FAF8F5] dark:bg-[#252321] border-2 border-[#161514] dark:border-[#38332E] rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#CEF431] placeholder:text-muted-foreground/50"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>

                {/* Matched Exercises from Database (Virtualized for 60fps Scrolling) */}
                {deferredSearch.length >= 2 && (
                  <div className="space-y-1 pr-0.5">
                    {libraryMatches.length > 0 ? (
                      libraryMatches.length > 4 ? (
                        <VList style={{ height: 210 }}>
                          {libraryMatches.map((item) => (
                            <div
                              key={item.id}
                              className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary/70 dark:hover:bg-secondary/40 border border-border/80 transition-all cursor-pointer mb-1.5"
                              onClick={() => handleAddFromLibrary(item)}
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <span className="block font-heading font-black text-xs text-foreground group-hover:text-amber-600 transition-colors truncate">
                                  {item.title}
                                </span>
                                <span className="block text-[10px] font-mono text-muted-foreground truncate mt-0.5">
                                  {item.bodyPart} • {item.equipment}
                                </span>
                              </div>

                              <button
                                type="button"
                                className="px-2.5 py-1 rounded-lg bg-[#CEF431] text-[#161514] font-heading font-black text-[10px] border border-[#161514] shadow-[1px_1px_0px_0px_#161514] flex items-center gap-1 shrink-0 group-hover:scale-105 transition-all"
                              >
                                <Plus className="size-3 stroke-[3]" />
                                <span>Add</span>
                              </button>
                            </div>
                          ))}
                        </VList>
                      ) : (
                        libraryMatches.map((item) => (
                          <div
                            key={item.id}
                            className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary/70 dark:hover:bg-secondary/40 border border-border/80 transition-all cursor-pointer"
                            onClick={() => handleAddFromLibrary(item)}
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <span className="block font-heading font-black text-xs text-foreground group-hover:text-amber-600 transition-colors truncate">
                                {item.title}
                              </span>
                              <span className="block text-[10px] font-mono text-muted-foreground truncate mt-0.5">
                                {item.bodyPart} • {item.equipment}
                              </span>
                            </div>

                            <button
                              type="button"
                              className="px-2.5 py-1 rounded-lg bg-[#CEF431] text-[#161514] font-heading font-black text-[10px] border border-[#161514] shadow-[1px_1px_0px_0px_#161514] flex items-center gap-1 shrink-0 group-hover:scale-105 transition-all"
                            >
                              <Plus className="size-3 stroke-[3]" />
                              <span>Add</span>
                            </button>
                          </div>
                        ))
                      )
                    ) : (
                      /* Fallback to Custom Exercise Entry if not present in dataset */
                      <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2 text-center">
                        <p className="text-xs font-mono text-muted-foreground">
                          No match found for &ldquo;{searchQuery}&rdquo;
                        </p>
                        <button
                          type="button"
                          onClick={handleAddCustomExercise}
                          className="w-full py-2 px-3 bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514] rounded-xl font-heading font-black text-xs flex items-center justify-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_#161514] cursor-pointer"
                        >
                          <Plus className="size-3.5 stroke-[3]" />
                          <span>Add &ldquo;{searchQuery}&rdquo; as Custom Exercise</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ================= 4. PRESENT DAY'S EXERCISES LIST (CRUD) ================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-heading font-black uppercase tracking-wider text-muted-foreground">
                Exercises for {selectedDay} ({exercises.length})
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                Tap checkbox to complete
              </span>
            </div>

            {exercises.length === 0 ? (
              /* Small Strobi Empty State if no exercises for the day */
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1A18] border-2 border-dashed border-[#161514]/30 dark:border-white/20 text-center space-y-3">
                <div className="flex justify-center">
                  <StrobiCompanion gear="fitness" size={52} expression="joy" state="idle" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading font-black text-sm text-foreground">
                    Zero Exercises on {selectedDay}
                  </h4>
                  <p className="text-xs text-muted-foreground font-mono max-w-xs mx-auto leading-relaxed">
                    Scheduled rest day or time to load iron? Tap{" "}
                    <strong className="text-foreground font-heading font-black">|||</strong> to pick
                    from 4,300+ exercises or add custom!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setShowSearch(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#CEF431] text-[#161514] border-2 border-[#161514] rounded-xl font-heading font-black text-xs shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer hover:scale-105 transition-all"
                >
                  <Search className="size-3.5 stroke-[2.5]" />
                  <span>Search 4,300+ Exercise Library</span>
                </button>
              </div>
            ) : (
              /* Exercise Cards List with Animated Miniatures, Guide, and Check/Uncheck */
              <div ref={exercisesListRef} className="space-y-2 max-h-[360px] overflow-y-auto pr-0.5">
                {exercises.map((ex: any) => {
                  const isDone = Boolean(ex.completed);

                  return (
                    <div
                      key={ex.id}
                      className={cn(
                        "p-3 rounded-2xl border-2 border-[#161514] dark:border-[#38332E] flex items-center justify-between gap-3 shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] transition-all",
                        isDone
                          ? "bg-[#03D26F]/10 dark:bg-[#03D26F]/15 border-[#03D26F]"
                          : "bg-white dark:bg-[#1C1A18]"
                      )}
                    >
                      {/* 1. Animated Rep Miniature / Video Frame Toggle */}
                      <ExerciseThumbnailAnimation
                        images={ex.images}
                        gifUrl={ex.gifUrl}
                        targetMuscle={ex.targetMuscle}
                        onOpenGuide={() => setSelectedGuideExercise(ex)}
                      />

                      {/* 2. Exercise Title, Machine & Guide Link (Zero Text Clipping) */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5
                            className={cn(
                              "font-heading font-black text-xs leading-snug break-words",
                              isDone ? "line-through text-muted-foreground" : "text-foreground"
                            )}
                          >
                            {ex.name}
                          </h5>
                          {ex.targetMuscle && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-secondary text-muted-foreground shrink-0 border border-border">
                              {ex.targetMuscle}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-muted-foreground flex-wrap">
                          <span>
                            {ex.sets?.length || 3} sets • {ex.machineName || "Free Weights"}
                          </span>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => setSelectedGuideExercise(ex)}
                            className="text-[#161514] dark:text-[#CEF431] font-heading font-black hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <Eye className="size-3" />
                            <span>Guide</span>
                          </button>
                        </div>
                      </div>

                      {/* 3. Action Buttons: Check/Uncheck & Trash */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Delete Exercise */}
                        <button
                          type="button"
                          onClick={() => handleDeleteExercise(ex.id, ex.name)}
                          className="size-8 rounded-xl border border-border hover:border-rose-400 bg-secondary/40 text-muted-foreground hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                          title="Remove exercise"
                        >
                          <Trash2 className="size-3.5" />
                        </button>

                        {/* Check / Uncheck Tactile Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleExercise(ex.id)}
                          className={cn(
                            "size-9 rounded-xl border-2 border-[#161514] flex items-center justify-center transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
                            isDone
                              ? "bg-[#03D26F] text-[#161514]"
                              : "bg-white dark:bg-[#1C1A18] text-transparent hover:text-muted-foreground/30 hover:bg-secondary"
                          )}
                          title={isDone ? "Mark incomplete" : "Mark exercise complete"}
                        >
                          <Check className="size-4 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </AdaptiveDrawerDialog>

      {/* Exercise Form & Anatomy Guide Modal */}
      {selectedGuideExercise && (
        <ExerciseGuideModal
          open={Boolean(selectedGuideExercise)}
          onOpenChange={(v) => {
            if (!v) setSelectedGuideExercise(null);
          }}
          exercise={selectedGuideExercise}
        />
      )}
    </>
  );
}
