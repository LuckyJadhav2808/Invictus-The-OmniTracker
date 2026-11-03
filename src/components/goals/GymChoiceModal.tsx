"use client";

import React, { useState, useDeferredValue, useRef, useEffect } from "react";
import { Search, Plus, Sparkles, X, ChevronDown, Eye, ArrowLeft, Dumbbell, Flame, Layers } from "lucide-react";
import { AdaptiveDrawerDialog } from "@/components/shared/AdaptiveDrawerDialog";
import { HumanMuscleAnatomy } from "@/components/goals/anatomy/HumanMuscleAnatomy";
import {
  mapBodyPartToMuscleGroup,
  mapMuscleGroupToBodyPart,
} from "@/components/goals/anatomy/muscle-mapping";
import { GYM_TEMPLATE_PACKS } from "@/lib/templates-data";
import { TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { useExerciseLibrary } from "@/lib/queries/exercises";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GymChoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDay: string;
  onSelectExerciseFromLibrary: (exercise: any) => void;
  onAddCustomExercise: (customEx: {
    name: string;
    machineName?: string;
    targetMuscle?: string;
    notes?: string;
  }) => void;
  onApplyPresetPack: (pack: TemplatePack) => void;
  onViewGuide?: (exercise: any) => void;
  isPending?: boolean;
}

type ModalView = "menu" | "vault" | "custom" | "presets";

export function GymChoiceModal({
  open,
  onOpenChange,
  selectedDay,
  onSelectExerciseFromLibrary,
  onAddCustomExercise,
  onApplyPresetPack,
  onViewGuide,
  isPending = false,
}: GymChoiceModalProps) {
  const [view, setView] = useState<ModalView>("menu");

  // Reset to menu when opened
  useEffect(() => {
    if (open) {
      setView("menu");
    }
  }, [open]);

  // 4,300+ Exercise Library State
  const [libQuery, setLibQuery] = useState("");
  const deferredLibQuery = useDeferredValue(libQuery);
  const [libBodyPart, setLibBodyPart] = useState("all");
  const [libEquipment, setLibEquipment] = useState("all");
  const [displayLimit, setDisplayLimit] = useState(50);
  const [showBodyMapFilter, setShowBodyMapFilter] = useState(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset display limit when query/filters change
  useEffect(() => {
    setDisplayLimit(50);
  }, [deferredLibQuery, libBodyPart, libEquipment]);

  const { data: libData, isFetching: isLibFetching } = useExerciseLibrary({
    query: deferredLibQuery,
    bodyPart: libBodyPart,
    equipment: libEquipment,
    limit: displayLimit,
  });

  // Infinite scroll
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

  // Custom Exercise Form State
  const [customName, setCustomName] = useState("");
  const [customMachine, setCustomMachine] = useState("");
  const [customTargetMuscle, setCustomTargetMuscle] = useState("");
  const [customNotes, setCustomNotes] = useState("");

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    onAddCustomExercise({
      name: customName.trim(),
      machineName: customMachine.trim() || "Free Weights",
      targetMuscle: customTargetMuscle.trim() || "Chest",
      notes: customNotes.trim(),
    });

    setCustomName("");
    setCustomMachine("");
    setCustomTargetMuscle("");
    setCustomNotes("");
    soundFX.playPop();
  };

  const muscleFilterCategories = [
    "all",
    "Chest",
    "Back",
    "Shoulders",
    "Biceps",
    "Triceps",
    "Quadriceps",
    "Hamstrings",
    "Glutes",
    "Calves",
    "Abdominals",
    "Cardio",
  ] as const;

  return (
    <AdaptiveDrawerDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        view === "menu"
          ? `Add Movement to ${selectedDay}`
          : view === "vault"
          ? "Exercise Vault (4,300+ DB)"
          : view === "custom"
          ? "Create Custom Exercise"
          : "Curated Workout Presets"
      }
      description={
        view === "menu"
          ? "Choose how you want to expand your workout routine today."
          : view === "vault"
          ? "Search movements, filter by anatomy, and 1-tap add to routine."
          : view === "custom"
          ? "Define your own machine, equipment, and targeted muscles."
          : "Instantly load high-volume hypertrophy and strength splits."
      }
    >
      <div className="space-y-4 pt-1">
        {/* Navigation Bar when inside sub-screens */}
        {view !== "menu" && (
          <div className="flex items-center justify-between pb-2 border-b-2 border-[#161514]">
            <button
              type="button"
              onClick={() => {
                setView("menu");
                soundFX.playPop();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#23201D] hover:bg-[#FAF8F5] text-[#161514] dark:text-white font-medium text-xs border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <ArrowLeft className="size-3.5 stroke-[2]" />
              <span>Back to Options</span>
            </button>
            <span className="text-xs font-mono text-[#6E6B65] dark:text-[#9E9A90]">
              {view === "vault" ? "Database Search" : view === "custom" ? "Custom Entry" : "Presets"}
            </span>
          </div>
        )}

        {/* 1. SELECTION STAGE (3 Clean Linear-Grade Cards) */}
        {view === "menu" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: 4,300+ Database */}
            <button
              type="button"
              onClick={() => {
                setView("vault");
                soundFX.playPop();
              }}
              className="p-4 rounded-2xl bg-white dark:bg-[#1C1A18] hover:bg-[#FAF8F5] dark:hover:bg-[#23201D] border border-[#E8E5DF] dark:border-[#2A2724] hover:border-[#161514] dark:hover:border-white/20 shadow-xs text-left cursor-pointer transition-all flex flex-col justify-between min-h-[160px] group active:scale-98"
            >
              <div>
                <div className="size-10 rounded-xl bg-[#03D26F]/10 text-[#047857] dark:text-[#03D26F] border border-[#03D26F]/20 flex items-center justify-center font-medium mb-3">
                  <Search className="size-5 stroke-[2]" />
                </div>
                <h4 className="font-heading font-bold text-sm text-[#161514] dark:text-white leading-tight">
                  Exercise Vault
                </h4>
                <p className="text-xs text-[#6E6B65] dark:text-[#9E9A90] mt-1 leading-snug">
                  4,300+ movements with animated GIFs, equipment tags & anatomy guides.
                </p>
              </div>
              <div className="pt-3 flex items-center justify-between text-xs font-medium text-[#161514] dark:text-white">
                <span className="bg-[#FAF8F5] dark:bg-[#23201D] text-[#6E6B65] dark:text-[#9E9A90] px-2 py-0.5 rounded-md text-[10px] font-mono border border-[#E8E5DF] dark:border-[#2A2724]">4,300+ DB</span>
                <span className="group-hover:translate-x-1 transition-transform text-[#047857] dark:text-[#03D26F]">Explore ➔</span>
              </div>
            </button>

            {/* Card 2: Custom Exercise */}
            <button
              type="button"
              onClick={() => {
                setView("custom");
                soundFX.playPop();
              }}
              className="p-4 rounded-2xl bg-white dark:bg-[#1C1A18] hover:bg-[#FAF8F5] dark:hover:bg-[#23201D] border border-[#E8E5DF] dark:border-[#2A2724] hover:border-[#161514] dark:hover:border-white/20 shadow-xs text-left cursor-pointer transition-all flex flex-col justify-between min-h-[160px] group active:scale-98"
            >
              <div>
                <div className="size-10 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-medium mb-3">
                  <Plus className="size-5 stroke-[2]" />
                </div>
                <h4 className="font-heading font-bold text-sm text-[#161514] dark:text-white leading-tight">
                  Custom Movement
                </h4>
                <p className="text-xs text-[#6E6B65] dark:text-[#9E9A90] mt-1 leading-snug">
                  Quickly log your own machines, specialty cables, or bodyweight supersets.
                </p>
              </div>
              <div className="pt-3 flex items-center justify-between text-xs font-medium text-[#161514] dark:text-white">
                <span className="bg-[#FAF8F5] dark:bg-[#23201D] text-[#6E6B65] dark:text-[#9E9A90] px-2 py-0.5 rounded-md text-[10px] font-mono border border-[#E8E5DF] dark:border-[#2A2724]">FREEFORM</span>
                <span className="group-hover:translate-x-1 transition-transform text-amber-600 dark:text-amber-400">Create ➔</span>
              </div>
            </button>

            {/* Card 3: Pro Template Presets */}
            <button
              type="button"
              onClick={() => {
                setView("presets");
                soundFX.playPop();
              }}
              className="p-4 rounded-2xl bg-white dark:bg-[#1C1A18] hover:bg-[#FAF8F5] dark:hover:bg-[#23201D] border border-[#E8E5DF] dark:border-[#2A2724] hover:border-[#161514] dark:hover:border-white/20 shadow-xs text-left cursor-pointer transition-all flex flex-col justify-between min-h-[160px] group active:scale-98"
            >
              <div>
                <div className="size-10 rounded-xl bg-[#C084FC]/10 text-[#7E22CE] dark:text-[#C084FC] border border-[#C084FC]/20 flex items-center justify-center font-medium mb-3">
                  <Layers className="size-5 stroke-[2]" />
                </div>
                <h4 className="font-heading font-bold text-sm text-[#161514] dark:text-white leading-tight">
                  Pro Split Presets
                </h4>
                <p className="text-xs text-[#6E6B65] dark:text-[#9E9A90] mt-1 leading-snug">
                  1-tap apply curated Push/Pull/Legs, Arnold Split, or Upper/Lower templates.
                </p>
              </div>
              <div className="pt-3 flex items-center justify-between text-xs font-medium text-[#161514] dark:text-white">
                <span className="bg-[#FAF8F5] dark:bg-[#23201D] text-[#6E6B65] dark:text-[#9E9A90] px-2 py-0.5 rounded-md text-[10px] font-mono border border-[#E8E5DF] dark:border-[#2A2724]">PRESETS</span>
                <span className="group-hover:translate-x-1 transition-transform text-purple-600 dark:text-purple-400">Browse ➔</span>
              </div>
            </button>
          </div>
        )}

        {/* 2. EXERCISE VAULT (4,300+ DATABASE SEARCH) */}
        {view === "vault" && (
          <div className="space-y-3">
            {/* Search Input Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search exercise or muscle (e.g. Incline Bench Press, Lat Pulldown)..."
                value={libQuery}
                onChange={(e) => setLibQuery(e.target.value)}
                className="w-full bg-white dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] pl-3.5 pr-9 py-2.5 text-xs text-[#161514] dark:text-white outline-none placeholder:text-[#6E6B65]/40 shadow-xs focus:border-[#161514] dark:focus:border-white"
                autoFocus
              />
              {libQuery && (
                <button
                  type="button"
                  onClick={() => setLibQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#6E6B65] hover:text-[#161514] hover:bg-[#F1EFEA] cursor-pointer transition-colors"
                  title="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Muscle Filter Categories & Body Map Toggle */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-xs font-medium text-[#6E6B65] dark:text-[#9E9A90]">
                Filter by Muscle
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowBodyMapFilter(!showBodyMapFilter);
                  soundFX.playPop();
                }}
                className={cn(
                  "text-xs font-medium px-2.5 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1 active:scale-95",
                  showBodyMapFilter
                    ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] border-[#161514] dark:border-white shadow-xs"
                    : "bg-white dark:bg-[#1C1A18] hover:bg-[#F1EFEA] text-[#161514] dark:text-white border-[#E8E5DF] dark:border-[#2A2724] shadow-xs"
                )}
              >
                <span>{showBodyMapFilter ? "Hide Visual Map" : "Visual Muscle Map 🗺️"}</span>
              </button>
            </div>

            {/* Interactive Visual Anatomy Body Map Filter */}
            {showBodyMapFilter && (
              <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-none animate-in fade-in zoom-in-95 duration-150">
                <div className="text-center mb-2 min-h-[34px] flex flex-col items-center justify-center">
                  <p className="text-xs text-[#6E6B65] dark:text-[#9E9A90]">
                    Tap any muscle on the model to filter 4,300+ movements
                  </p>
                  {libBodyPart !== "all" ? (
                    <span className="inline-block mt-0.5 text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-[#03D26F]/15 text-[#047857] dark:text-[#03D26F] border border-[#03D26F]/30">
                      Filtered by: {libBodyPart}
                    </span>
                  ) : (
                    <span className="inline-block mt-0.5 text-xs text-[#6E6B65]/60 dark:text-[#9E9A90]/60">
                      Viewing all muscle groups
                    </span>
                  )}
                </div>
                <div className="flex justify-center">
                  <HumanMuscleAnatomy
                    size="sm"
                    interactive={true}
                    selectedMuscle={mapBodyPartToMuscleGroup(libBodyPart)}
                    onMuscleClick={(muscle) => {
                      const mappedPart = mapMuscleGroupToBodyPart(muscle);
                      setLibBodyPart(mappedPart);
                      toast.info(`Filtered exercises for ${mappedPart}`);
                    }}
                    showViewToggle={true}
                    showLegend={false}
                  />
                </div>
              </div>
            )}

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {muscleFilterCategories.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setLibBodyPart(m)}
                  className={cn(
                    "text-[9px] font-black px-2 py-0.5 rounded-lg border transition-all cursor-pointer",
                    libBodyPart === m
                      ? "bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514] border-[#161514] dark:border-[#FAF8F5] shadow-xs"
                      : "bg-white dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] hover:bg-[#FAF8F5] dark:hover:bg-[#252321] border-[#E8E5DF] dark:border-[#2A2724]"
                  )}
                >
                  {m === "all" ? "ALL MUSCLES" : m.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Counter & Status */}
            <div className="flex items-center justify-between text-[11px] font-bold text-[#161514]/70 dark:text-[#A8A29E] px-0.5">
              <span>
                Showing <strong className="text-[#161514] dark:text-[#FAF8F5] font-black">{libData?.exercises ? Math.min(libData.exercises.length, libData.totalCount) : 0}</strong> of <strong className="text-[#161514] dark:text-[#FAF8F5] font-black">{libData?.totalCount || 4334}</strong> exercises
              </span>
              {isLibFetching && (
                <span className="text-rose-600 dark:text-rose-400 font-black text-[10px] uppercase tracking-wider animate-pulse flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                  Searching...
                </span>
              )}
            </div>

            {/* Search Results List */}
            {libData?.exercises && libData.exercises.length > 0 ? (
              <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1 pt-1 divide-y divide-[#E8E5DF] dark:divide-[#2A2724] overscroll-contain">
                {libData.exercises.map((item) => {
                  const thumbUrl = (item.images && item.images[0]) || item.gifUrl;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectExerciseFromLibrary(item)}
                      className="p-2.5 rounded-xl bg-white dark:bg-[#1C1A18] hover:bg-[#FAF8F5] dark:hover:bg-[#252321] border border-[#E8E5DF] dark:border-[#2A2724] cursor-pointer transition-all flex items-center justify-between gap-2.5 shadow-xs active:translate-y-0.5 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {thumbUrl ? (
                          <div className="h-11 w-11 rounded-lg bg-[#242220] border border-[#E8E5DF] dark:border-[#2A2724] overflow-hidden shrink-0 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={thumbUrl}
                              alt={item.title}
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="h-11 w-11 rounded-lg bg-amber-100 dark:bg-amber-950/30 border border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-center text-[#161514] dark:text-[#FAF8F5] font-black text-xs shrink-0">
                            🏋️
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h5 className="font-black text-xs text-[#161514] dark:text-[#FAF8F5] leading-snug break-words group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                            {item.title}
                          </h5>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800/50">
                              {item.bodyPart}
                            </span>
                            <span className="text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 border border-sky-300 dark:border-sky-800/50">
                              {item.equipment}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onViewGuide && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewGuide(item);
                            }}
                            className="px-2 py-1 rounded-lg bg-[#FAF8F5] dark:bg-[#252321] hover:bg-[#F1EFEA] dark:hover:bg-[#2F2C29] text-[#161514] dark:text-[#FAF8F5] text-[9px] font-black border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center gap-1 cursor-pointer transition-all active:translate-y-0.5"
                            title="View Exercise Form Guide"
                          >
                            <Eye className="size-2.5 stroke-[2.5]" />
                            <span>Guide</span>
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectExerciseFromLibrary(item);
                          }}
                          className="text-[9px] font-black bg-[#03D26F] hover:bg-[#02b861] active:translate-y-0.5 text-[#161514] px-2.5 py-1 rounded-lg border border-[#03D26F] shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <span>USE</span>
                          <span className="font-black">➔</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div ref={loadMoreSentinelRef} className="h-2 w-full" />

                {libData && libData.totalCount > libData.exercises.length && (
                  <div className="pt-2 pb-1 text-center">
                    <button
                      type="button"
                      onClick={() => setDisplayLimit((prev) => prev + 50)}
                      disabled={isLibFetching}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] hover:bg-[#F1EFEA] dark:hover:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] font-heading font-black text-xs border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                    >
                      <span>
                        {isLibFetching
                          ? "Loading More Exercises..."
                          : `Load More Movements (${libData.totalCount - libData.exercises.length} remaining)`}
                      </span>
                      <ChevronDown className="size-4 stroke-[3]" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 text-center bg-white dark:bg-[#1C1A18] rounded-2xl border border-dashed border-[#E8E5DF] dark:border-[#2A2724] space-y-2.5">
                <p className="text-xs font-black text-[#161514] dark:text-[#FAF8F5]">
                  No exercise found matching &ldquo;{libQuery}&rdquo;
                </p>
                <p className="text-[11px] font-bold text-[#161514]/70 dark:text-[#A8A29E]">
                  Can&apos;t find this variation? Create it as a custom exercise.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCustomName(libQuery);
                    setView("custom");
                  }}
                  className="text-xs font-black bg-rose-500 hover:bg-rose-600 text-white px-3.5 py-1.5 rounded-xl border border-rose-600 shadow-xs cursor-pointer inline-flex items-center gap-1.5 active:translate-y-0.5 transition-all"
                >
                  <Plus className="size-3.5 stroke-[3]" />
                  <span>Create &ldquo;{libQuery || "Custom"}&rdquo; Exercise</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. CUSTOM EXERCISE FORM */}
        {view === "custom" && (
          <form onSubmit={handleCustomSubmit} className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <label className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]">
                Exercise Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Incline Dumbbell Bench Press, Lat Pulldown"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3.5 py-2.5 text-xs font-bold text-[#161514] dark:text-[#FAF8F5] shadow-xs focus:border-[#161514] dark:focus:border-white outline-none"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]">
                  Machine / Equipment
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cable Station, Free Weights"
                  value={customMachine}
                  onChange={(e) => setCustomMachine(e.target.value)}
                  className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3.5 py-2 text-xs font-bold text-[#161514] dark:text-[#FAF8F5] shadow-xs focus:border-[#161514] dark:focus:border-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]">
                  Target Muscle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chest, Back, Deltoids"
                  value={customTargetMuscle}
                  onChange={(e) => setCustomTargetMuscle(e.target.value)}
                  className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3.5 py-2 text-xs font-bold text-[#161514] dark:text-[#FAF8F5] shadow-xs focus:border-[#161514] dark:focus:border-white outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]">
                Form Cue / Personal Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Keep elbows at 45 degrees, slow 3-second negative"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3.5 py-2 text-xs font-bold text-[#161514] dark:text-[#FAF8F5] shadow-xs focus:border-[#161514] dark:focus:border-white outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isPending || !customName.trim()}
              className="w-full min-h-[46px] bg-[#CEF431] hover:bg-[#D8F74E] text-[#161514] font-heading font-black text-xs uppercase tracking-wider rounded-xl py-3 border border-[#161514] shadow-xs cursor-pointer transition-all active:translate-y-0.5 disabled:opacity-50"
            >
              Add Custom Exercise to {selectedDay} ➔
            </button>
          </form>
        )}

        {/* 4. CURATED WORKOUT PRESETS */}
        {view === "presets" && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-[#161514]/70 dark:text-[#A8A29E]">
              Select a battle-tested training pack to instantly load into {selectedDay}:
            </p>
            <div className="grid grid-cols-1 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {GYM_TEMPLATE_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center justify-between gap-3 hover:bg-[#FAF8F5] dark:hover:bg-[#252321] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{pack.icon || "🏋️"}</span>
                      <h5 className="font-heading font-black text-xs text-[#161514] dark:text-[#FAF8F5] truncate">
                        {pack.name}
                      </h5>
                    </div>
                    <p className="text-[11px] font-bold text-[#161514]/65 dark:text-[#A8A29E] mt-0.5 line-clamp-1">
                      {pack.tagline}
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-mono font-black text-[#161514] dark:text-[#FAF8F5] bg-[#FAF8F5] dark:bg-[#252321] px-2 py-0.5 rounded border border-[#E8E5DF] dark:border-[#2A2724]">
                      {pack.items.length} Movements included
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      onApplyPresetPack(pack);
                      soundFX.playPop();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#03D26F] hover:bg-[#02b861] text-[#161514] font-heading font-black text-xs border border-[#03D26F] shadow-xs cursor-pointer transition-all active:translate-y-0.5 whitespace-nowrap"
                  >
                    Apply Split ➔
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdaptiveDrawerDialog>
  );
}
