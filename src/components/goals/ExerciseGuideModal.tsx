"use client";

import { useState, useEffect } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { Dumbbell, Target, Layers, Sparkles, CheckCircle2, Play, Pause, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: {
    id?: string;
    name?: string;
    title?: string;
    targetMuscle?: string;
    bodyPart?: string;
    equipment?: string;
    machineName?: string;
    instructions?: string[];
    secondaryMuscles?: string[];
    images?: string[];
    gifUrl?: string;
    mechanic?: string;
    level?: string;
    notes?: string;
    desc?: string;
  } | null;
}

export function ExerciseGuideModal({
  open,
  onOpenChange,
  exercise,
}: ExerciseGuideModalProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-fetch full guide if instructions or images are missing
  useEffect(() => {
    if (!open || !exercise) {
      setDetails(null);
      setLoading(false);
      return;
    }

    const exName = exercise.title || exercise.name || "";
    const exMuscle = exercise.targetMuscle || exercise.bodyPart || "";
    const hasImages = (exercise.images && exercise.images.length > 0) || Boolean(exercise.gifUrl);
    const hasInstructions = exercise.instructions && exercise.instructions.length > 0;

    // Immediately set available props so modal is never blank
    setDetails(exercise);

    if (hasImages && hasInstructions) {
      setLoading(false);
      return;
    }

    if (exName) {
      if (!hasImages) setLoading(true);

      const url = `/api/gym/exercises?name=${encodeURIComponent(exName)}&targetMuscle=${encodeURIComponent(exMuscle)}`;
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data?.exercise) {
            setDetails((prev: any) => ({
              ...prev,
              ...exercise,
              ...data.exercise,
              title: data.exercise.title || exName,
              bodyPart: data.exercise.bodyPart || exMuscle,
              targetMuscle: data.exercise.bodyPart || exMuscle,
              instructions: data.exercise.instructions?.length
                ? data.exercise.instructions
                : exercise.instructions?.length
                ? exercise.instructions
                : [],
              images: data.exercise.images?.length
                ? data.exercise.images
                : exercise.images?.length
                ? exercise.images
                : exercise.gifUrl
                ? [exercise.gifUrl]
                : [],
              secondaryMuscles: data.exercise.secondaryMuscles?.length
                ? data.exercise.secondaryMuscles
                : exercise.secondaryMuscles?.length
                ? exercise.secondaryMuscles
                : [],
              equipment: data.exercise.equipment || exercise.equipment || exercise.machineName,
            }));
          }
        })
        .catch((err) => console.error("Guide lookup error:", err))
        .finally(() => setLoading(false));
    }
  }, [open, exercise]);

  // Looping animation toggle between image 0 (Start) and image 1 (Contracted)
  const resolvedImages: string[] =
    (details?.images && details.images.length > 0 ? details.images : null) ||
    (exercise?.images && exercise.images.length > 0 ? exercise.images : null) ||
    (details?.gifUrl ? [details.gifUrl] : null) ||
    (exercise?.gifUrl ? [exercise.gifUrl] : null) ||
    [];

  useEffect(() => {
    if (!open || !isPlaying || resolvedImages.length < 2) return;

    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev === 0 ? 1 : 0));
    }, 1200);

    return () => clearInterval(interval);
  }, [open, isPlaying, resolvedImages.length]);

  if (!exercise) return null;

  const title = details?.title || details?.name || exercise.title || exercise.name || "Exercise Form Guide";
  const targetMuscle = details?.targetMuscle || details?.bodyPart || exercise.targetMuscle || exercise.bodyPart || "General";
  const equipment = details?.equipment || details?.machineName || exercise.equipment || exercise.machineName || "Free Weight / Machine";
  const rawInstructions = details?.instructions?.length ? details.instructions : exercise.instructions?.length ? exercise.instructions : [];
  const instructions = rawInstructions.length > 0 ? rawInstructions : [
    `Set up your equipment (${equipment}) and brace your core with a neutral spine.`,
    `Focus mind-muscle connection directly on the ${targetMuscle} through the full range of motion.`,
    `Control the eccentric (lowering) phase for 2-3 full seconds for maximum hypertrophy tension.`,
    `Drive through the concentric phase with explosive, controlled power while exhaling.`,
  ];
  const secondaryMuscles = details?.secondaryMuscles?.length ? details.secondaryMuscles : exercise.secondaryMuscles || [];

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title="EXERCISE FORM & TECHNIQUE GUIDE"
      description="Proper biomechanics, target muscles, and injury-prevention cues"
    >
      <div className="space-y-4 pt-1 pb-2">
        {/* Header Title Card */}
        <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#CEF431] text-[#161514] border border-[#161514] inline-block mb-1.5 shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]">
                {targetMuscle}
              </span>
              <h2 className="text-base font-black text-[#161514] uppercase tracking-tight leading-tight">
                {title}
              </h2>
            </div>
            <div className="h-9 w-9 rounded-xl bg-amber-300 border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] flex items-center justify-center text-amber-950 font-black shrink-0">
              <Dumbbell className="h-5 w-5 stroke-[2.5]" />
            </div>
          </div>

          {/* Quick Spec Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2.5 border-t border-[#161514]/10 text-[11px] font-bold text-[#161514]">
            <span className="bg-white px-2 py-0.5 rounded-lg border border-[#161514] flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]">
              <span className="text-gray-500">Equipment:</span> {equipment}
            </span>
            {details?.mechanic && (
              <span className="bg-white px-2 py-0.5 rounded-lg border border-[#161514] flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] capitalize">
                <span className="text-gray-500">Type:</span> {details.mechanic}
              </span>
            )}
            {details?.level && (
              <span className="bg-white px-2 py-0.5 rounded-lg border border-[#161514] flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] capitalize">
                <span className="text-gray-500">Level:</span> {details.level}
              </span>
            )}
          </div>
        </div>

        {/* Visual Demonstration Player */}
        {loading && resolvedImages.length === 0 ? (
          <div className="bg-[#161514] rounded-2xl border-2 border-[#161514] shadow-[4px_4px_0px_0px_rgba(22,21,20,1)] p-6 text-center space-y-3">
            <div className="h-44 bg-[#242220] rounded-xl flex flex-col items-center justify-center gap-3 border border-white/10">
              <Loader2 className="h-8 w-8 text-[#CEF431] animate-spin" />
              <p className="text-xs font-black text-white uppercase tracking-wider">
                Loading Exercise Form & Posture Animation...
              </p>
            </div>
          </div>
        ) : resolvedImages.length > 0 ? (
          <div className="bg-[#161514] rounded-2xl border-2 border-[#161514] shadow-[4px_4px_0px_0px_rgba(22,21,20,1)] p-3 overflow-hidden text-center">
            <div className="relative aspect-[4/3] max-h-56 mx-auto bg-[#242220] rounded-xl overflow-hidden border border-[#363432] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolvedImages[activeImageIndex] || resolvedImages[0]}
                alt={title}
                className="w-full h-full object-contain p-2 transition-all duration-300"
              />

              {/* Looping Status Badge */}
              <div className="absolute top-2 left-2 bg-[#161514]/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 text-[10px] font-black text-white flex items-center gap-1.5 shadow">
                <span className="h-2 w-2 rounded-full bg-[#CEF431] animate-pulse" />
                <span>
                  {resolvedImages.length === 1
                    ? "Posture Demonstration"
                    : activeImageIndex === 0
                    ? "1. Starting Posture"
                    : "2. Peak Contraction"}
                </span>
              </div>

              {resolvedImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="absolute bottom-2 right-2 bg-white text-[#161514] px-2 py-1 rounded-lg border border-[#161514] text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] cursor-pointer hover:bg-amber-100 transition-all flex items-center gap-1"
                >
                  {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  <span>{isPlaying ? "Pause Loop" : "Play Loop"}</span>
                </button>
              )}
            </div>

            {/* Frame Indicator Dots */}
            {resolvedImages.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                {resolvedImages.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(idx);
                      setIsPlaying(false);
                    }}
                    className={cn(
                      "h-2 rounded-full transition-all cursor-pointer",
                      activeImageIndex === idx ? "w-6 bg-[#CEF431]" : "w-2 bg-gray-600"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#FAF8F5] p-4 rounded-2xl border-2 border-[#161514] text-center space-y-1.5 shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]">
            <Dumbbell className="h-7 w-7 text-amber-600 mx-auto stroke-[2.5]" />
            <p className="text-xs font-black text-[#161514] uppercase">
              Custom Exercise Movement
            </p>
            <p className="text-[11px] font-bold text-gray-600">
              Focus on strict tempo: 2-3s eccentric lowering, explosive contraction.
            </p>
          </div>
        )}

        {/* Target & Secondary Muscles Breakdown */}
        <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-[#161514]">
            <Target className="h-4 w-4 text-rose-600 stroke-[2.5]" />
            <span>Muscle Activation Map</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]">
              <span className="text-[10px] font-black uppercase text-gray-500 block mb-0.5">
                Primary Target
              </span>
              <span className="font-black text-rose-600 capitalize">
                🔥 {targetMuscle}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]">
              <span className="text-[10px] font-black uppercase text-gray-500 block mb-0.5">
                Secondary Assists
              </span>
              <span className="font-bold text-[#161514] capitalize">
                {secondaryMuscles.length > 0 ? secondaryMuscles.join(", ") : "Core Stabilizers"}
              </span>
            </div>
          </div>
        </div>

        {/* Step-by-Step Execution Instructions */}
        <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-[#161514]">
            <Sparkles className="h-4 w-4 text-amber-600 stroke-[2.5]" />
            <span>How to Perform (Step-by-Step)</span>
          </div>

          <div className="space-y-2 pt-1">
            {instructions.map((step: string, idx: number) => (
              <div
                key={idx}
                className="bg-white p-2.5 rounded-xl border border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] flex items-start gap-2.5 text-xs text-[#161514]"
              >
                <div className="h-5 w-5 rounded-full bg-[#161514] text-[#CEF431] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="font-semibold leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pro Tips Box */}
        <div className="bg-emerald-100 p-3.5 rounded-2xl border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] space-y-1.5 text-xs text-emerald-950 font-bold">
          <div className="flex items-center gap-1.5 font-black uppercase text-emerald-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 stroke-[2.5]" />
            <span>Invictus Execution Pro-Tip</span>
          </div>
          <p className="text-[11px] font-semibold text-emerald-900 leading-snug">
            Control the eccentric (lowering) phase for 2-3 full seconds. Never sacrifice range of motion for heavier weight to protect your joints and maximize mechanical tension.
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="w-full bg-[#CEF431] hover:bg-[#bce41e] text-[#161514] font-black text-xs uppercase tracking-wider rounded-2xl py-3 border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center gap-2 mt-2"
        >
          <span>Got It, Ready to Lift! 🚀</span>
        </button>
      </div>
    </ResponsiveFormContainer>
  );
}
