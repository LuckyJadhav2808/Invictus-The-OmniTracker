"use client";

import React, { useState, useDeferredValue, useEffect } from "react";
import {
  Search,
  Plus,
  Sparkles,
  X,
  ChevronDown,
  ArrowLeft,
  CheckSquare,
  Flame,
  Layers,
  Check,
  Target,
  Zap,
  BookOpen,
  Droplet,
  Dumbbell,
  Moon,
  Clock,
  Heart,
  ShieldCheck,
  Sun,
  Smile,
  Compass,
  DollarSign,
  Coffee,
  Code,
  Apple,
  Activity,
  Edit3,
} from "lucide-react";
import { AdaptiveDrawerDialog } from "@/components/shared/AdaptiveDrawerDialog";
import { HABIT_TEMPLATE_PACKS } from "@/lib/templates-data";
import { TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface AtomicHabitPreset {
  id: string;
  title: string;
  category: "Health" | "Focus" | "Mindset" | "Recovery" | "Discipline" | "Wealth";
  icon: string;
  color: "emerald" | "amber" | "sky" | "purple" | "rose";
  frequencyType: "daily" | "weekly";
  reminderTime?: string;
  desc: string;
  goalTarget?: number;
  goalUnit?: string;
}

export const ATOMIC_HABITS_VAULT: AtomicHabitPreset[] = [
  // Health & Body
  {
    id: "ah-water-morning",
    title: "500ml Water Upon Waking",
    category: "Health",
    icon: "Droplet",
    color: "sky",
    frequencyType: "daily",
    reminderTime: "07:00 AM",
    desc: "Rehydrate nervous system immediately after sleep",
    goalTarget: 500,
    goalUnit: "ml",
  },
  {
    id: "ah-steps-10k",
    title: "10,000 Daily Steps",
    category: "Health",
    icon: "Flame",
    color: "emerald",
    frequencyType: "daily",
    reminderTime: "06:00 PM",
    desc: "Active NEAT caloric expenditure & circulation",
    goalTarget: 10000,
    goalUnit: "steps",
  },
  {
    id: "ah-sunlight-morning",
    title: "Morning Sunlight 10m",
    category: "Health",
    icon: "Sun",
    color: "amber",
    frequencyType: "daily",
    reminderTime: "07:30 AM",
    desc: "Anchor circadian rhythm & trigger natural dopamine",
  },
  {
    id: "ah-gym-hypertrophy",
    title: "Gym / Resistance Workout",
    category: "Health",
    icon: "Dumbbell",
    color: "rose",
    frequencyType: "daily",
    reminderTime: "05:00 PM",
    desc: "Progressive overload weight training session",
  },
  {
    id: "ah-protein-140g",
    title: "Hit 140g Protein Target",
    category: "Health",
    icon: "Apple",
    color: "emerald",
    frequencyType: "daily",
    reminderTime: "08:00 PM",
    desc: "Optimal amino acid pool for muscular recovery",
    goalTarget: 140,
    goalUnit: "g",
  },
  {
    id: "ah-posture-reset",
    title: "Desk Posture & Spine Reset",
    category: "Health",
    icon: "Activity",
    color: "amber",
    frequencyType: "daily",
    reminderTime: "02:00 PM",
    desc: "Thoracic extension and neck stretches between work sessions",
  },
  {
    id: "ah-zero-sugar",
    title: "Zero Refined Sugar After 7 PM",
    category: "Health",
    icon: "ShieldCheck",
    color: "rose",
    frequencyType: "daily",
    reminderTime: "07:00 PM",
    desc: "Prevent insulin spikes & nocturnal sleep disruption",
  },
  {
    id: "ah-mobility-foamroll",
    title: "15-Min Mobility & Stretching",
    category: "Health",
    icon: "Heart",
    color: "purple",
    frequencyType: "daily",
    reminderTime: "09:00 PM",
    desc: "Hip flexor opening & hamstring release",
  },

  // Focus & Productivity
  {
    id: "ah-deepwork-90",
    title: "90-Min Deep Work Sprint",
    category: "Focus",
    icon: "Target",
    color: "purple",
    frequencyType: "daily",
    reminderTime: "09:30 AM",
    desc: "Single-task focus, phone in another room",
    goalTarget: 90,
    goalUnit: "mins",
  },
  {
    id: "ah-read-pages",
    title: "Read 15 Pages of Book",
    category: "Focus",
    icon: "BookOpen",
    color: "amber",
    frequencyType: "daily",
    reminderTime: "08:30 PM",
    desc: "Consistent mental expansion across 25 books/year",
    goalTarget: 15,
    goalUnit: "pages",
  },
  {
    id: "ah-ship-code",
    title: "Ship 1 Meaningful Code Push",
    category: "Focus",
    icon: "Code",
    color: "emerald",
    frequencyType: "daily",
    reminderTime: "06:30 PM",
    desc: "Daily tangible engineering velocity & git green square",
  },
  {
    id: "ah-write-500w",
    title: "Write 500 Words / Journal",
    category: "Focus",
    icon: "Edit3",
    color: "sky",
    frequencyType: "daily",
    reminderTime: "08:00 AM",
    desc: "Clarity of thought and architectural documentation",
    goalTarget: 500,
    goalUnit: "words",
  },
  {
    id: "ah-plan-tomorrow",
    title: "Plan Tomorrow's 3 MITs",
    category: "Focus",
    icon: "CheckSquare",
    color: "purple",
    frequencyType: "daily",
    reminderTime: "09:30 PM",
    desc: "Eliminate morning decision fatigue before sleep",
  },
  {
    id: "ah-clean-workspace",
    title: "Clean Desk & Workspace Reset",
    category: "Focus",
    icon: "Sparkles",
    color: "amber",
    frequencyType: "daily",
    reminderTime: "06:00 PM",
    desc: "Physical environment mirrors psychological clarity",
  },

  // Mindset & Resilience
  {
    id: "ah-meditation-10m",
    title: "10-Min Mindfulness Breathing",
    category: "Mindset",
    icon: "Smile",
    color: "purple",
    frequencyType: "daily",
    reminderTime: "07:15 AM",
    desc: "Vagus nerve regulation & attentional control",
    goalTarget: 10,
    goalUnit: "mins",
  },
  {
    id: "ah-gratitude-3",
    title: "3 Gratitude Bullet Points",
    category: "Mindset",
    icon: "Heart",
    color: "rose",
    frequencyType: "daily",
    reminderTime: "08:15 AM",
    desc: "Rewire negative bias toward proactive appreciation",
  },
  {
    id: "ah-box-breathing",
    title: "5-Min Box Breathing Reset",
    category: "Mindset",
    icon: "Compass",
    color: "sky",
    frequencyType: "daily",
    reminderTime: "01:30 PM",
    desc: "Inhale 4s, hold 4s, exhale 4s, hold 4s",
  },
  {
    id: "ah-nature-walk",
    title: "20-Min Unplugged Outdoor Walk",
    category: "Mindset",
    icon: "Sun",
    color: "emerald",
    frequencyType: "daily",
    reminderTime: "05:30 PM",
    desc: "Zero earphones, observe sensory environment",
  },

  // Sleep & Recovery
  {
    id: "ah-sleep-11pm",
    title: "Sleep by 10:45 PM",
    category: "Recovery",
    icon: "Moon",
    color: "purple",
    frequencyType: "daily",
    reminderTime: "10:30 PM",
    desc: "Hit deep delta wave sleep before midnight",
  },
  {
    id: "ah-screens-off",
    title: "Screens Off 60m Before Bed",
    category: "Recovery",
    icon: "Moon",
    color: "amber",
    frequencyType: "daily",
    reminderTime: "09:45 PM",
    desc: "Eliminate blue photon melatonin suppression",
  },
  {
    id: "ah-magnesium-tea",
    title: "Magnesium / Chamomile Night Cap",
    category: "Recovery",
    icon: "Coffee",
    color: "sky",
    frequencyType: "daily",
    reminderTime: "10:00 PM",
    desc: "GABA neurotransmitter calming for REM cycle",
  },
  {
    id: "ah-wake-early",
    title: "Consistent 6:30 AM Wake Up",
    category: "Recovery",
    icon: "Clock",
    color: "amber",
    frequencyType: "daily",
    reminderTime: "06:30 AM",
    desc: "Lock circadian pacemaker every single day",
  },

  // Discipline & Wealth
  {
    id: "ah-cold-shower",
    title: "2-Min Cold Shower Finish",
    category: "Discipline",
    icon: "Zap",
    color: "sky",
    frequencyType: "daily",
    reminderTime: "07:15 AM",
    desc: "Voluntary hardship & 250% sustained noradrenaline spike",
  },
  {
    id: "ah-no-social-morning",
    title: "No Social Media Before 10 AM",
    category: "Discipline",
    icon: "ShieldCheck",
    color: "rose",
    frequencyType: "daily",
    reminderTime: "08:00 AM",
    desc: "Protect morning attentional sovereignty",
  },
  {
    id: "ah-review-budget",
    title: "Review Daily Expenses & Budget",
    category: "Wealth",
    icon: "DollarSign",
    color: "emerald",
    frequencyType: "daily",
    reminderTime: "09:00 PM",
    desc: "100% financial accountability & zero money leaks",
  },
  {
    id: "ah-daily-invest",
    title: "Execute Daily Micro-Investment",
    category: "Wealth",
    icon: "DollarSign",
    color: "emerald",
    frequencyType: "daily",
    reminderTime: "11:00 AM",
    desc: "DCA into index fund / high-conviction savings",
  },
];

const HABIT_ICONS_MAP: Record<string, any> = {
  Target,
  Flame,
  Droplet,
  Dumbbell,
  BookOpen,
  Moon,
  Sun,
  Smile,
  Compass,
  DollarSign,
  Coffee,
  Code,
  Apple,
  Activity,
  Heart,
  ShieldCheck,
  CheckSquare,
  Zap,
  Clock,
  Sparkles,
  Edit3,
};

const COLOR_OPTIONS = [
  { name: "amber", bg: "bg-amber-400", border: "border-amber-500", text: "text-amber-900" },
  { name: "emerald", bg: "bg-emerald-400", border: "border-emerald-500", text: "text-emerald-900" },
  { name: "sky", bg: "bg-sky-400", border: "border-sky-500", text: "text-sky-900" },
  { name: "purple", bg: "bg-purple-400", border: "border-purple-500", text: "text-purple-900" },
  { name: "rose", bg: "bg-rose-400", border: "border-rose-500", text: "text-rose-900" },
];

const CATEGORY_FILTERS = ["All", "Health", "Focus", "Mindset", "Recovery", "Discipline", "Wealth"] as const;

interface HabitChoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPreset: (preset: AtomicHabitPreset) => void;
  onAddCustomHabit: (customHabit: {
    title: string;
    icon: string;
    color: string;
    frequency: { type: "daily" | "weekly" | "customDays"; targetPerDay?: number; daysOfWeek?: number[] };
    reminderTime?: string;
    allowGraceSkip: boolean;
    goalTarget?: number;
    goalUnit?: string;
  }) => void;
  onApplyPresetPack: (pack: TemplatePack) => void;
  isPending?: boolean;
}

type ModalView = "menu" | "presets" | "custom" | "packs";

export function HabitChoiceModal({
  open,
  onOpenChange,
  onSelectPreset,
  onAddCustomHabit,
  onApplyPresetPack,
  isPending = false,
}: HabitChoiceModalProps) {
  const [view, setView] = useState<ModalView>("menu");

  // Reset to menu when opened
  useEffect(() => {
    if (open) {
      setView("menu");
    }
  }, [open]);

  // Presets Library state
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORY_FILTERS[number]>("All");
  const [addedPresetIds, setAddedPresetIds] = useState<Record<string, boolean>>({});

  // Custom Habit form state
  const [customTitle, setCustomTitle] = useState("");
  const [customCategory, setCustomCategory] = useState("Health");
  const [customIcon, setCustomIcon] = useState("Target");
  const [customColor, setCustomColor] = useState("amber");
  const [customFrequencyType, setCustomFrequencyType] = useState<"daily" | "weekly" | "customDays">("daily");
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [customReminderTime, setCustomReminderTime] = useState("");
  const [customGraceSkip, setCustomGraceSkip] = useState(false);
  const [customGoalTarget, setCustomGoalTarget] = useState("");
  const [customGoalUnit, setCustomGoalUnit] = useState("");

  const filteredPresets = ATOMIC_HABITS_VAULT.filter((preset) => {
    const matchesCategory = selectedCategory === "All" || preset.category === selectedCategory;
    const q = deferredQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      preset.title.toLowerCase().includes(q) ||
      preset.desc.toLowerCase().includes(q) ||
      preset.category.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  const handleAddPresetClick = (preset: AtomicHabitPreset) => {
    soundFX.playCompleteChime();
    soundFX.vibrate(20);
    setAddedPresetIds((prev) => ({ ...prev, [preset.id]: true }));
    onSelectPreset(preset);
  };

  const handleCustomFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) {
      toast.error("Please enter a habit title");
      return;
    }

    onAddCustomHabit({
      title: customTitle.trim(),
      icon: customIcon,
      color: customColor,
      frequency: {
        type: customFrequencyType,
        targetPerDay: 1,
        ...(customFrequencyType === "customDays" ? { daysOfWeek: customDays } : {}),
      },
      reminderTime: customReminderTime.trim() || undefined,
      allowGraceSkip: customGraceSkip,
      goalTarget: customGoalTarget ? Number(customGoalTarget) : undefined,
      goalUnit: customGoalUnit.trim() || undefined,
    });

    soundFX.playPop();
    soundFX.vibrate(20);

    // Reset form
    setCustomTitle("");
    setCustomReminderTime("");
    setCustomGoalTarget("");
    setCustomGoalUnit("");
    onOpenChange(false);
  };

  const toggleDay = (dayIndex: number) => {
    soundFX.playPop();
    setCustomDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const DAYS = [
    { label: "M", value: 1 },
    { label: "T", value: 2 },
    { label: "W", value: 3 },
    { label: "T", value: 4 },
    { label: "F", value: 5 },
    { label: "S", value: 6 },
    { label: "S", value: 0 },
  ];

  return (
    <AdaptiveDrawerDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        view === "menu"
          ? "ADD HABIT & ROUTINE"
          : view === "presets"
          ? "ATOMIC HABITS VAULT"
          : view === "custom"
          ? "CUSTOM HABIT ARCHITECT"
          : "CURATED PROTOCOL SPLITS"
      }
      description={
        view === "menu"
          ? "Choose from proven atomic habits, curated split packs, or craft your bespoke routine."
          : view === "presets"
          ? "Tap any battle-tested atomic habit to lock it directly into your daily routine."
          : view === "custom"
          ? "Design a custom routine with tailored scheduling, icons, and reminder telemetry."
          : "Apply comprehensive lifestyle stacks engineered for peak performance."
      }
    >
      <div className="space-y-4 pt-2 pb-1">
        {/* Navigation Back Button if in sub-view */}
        {view !== "menu" && (
          <div className="flex items-center justify-between pb-2 border-b-2 border-[#161514]/10">
            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                setView("menu");
              }}
              className="text-xs font-heading font-black text-[#161514] bg-white hover:bg-[#FAF8F5] px-3 py-1.5 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_#161514] flex items-center gap-1.5 cursor-pointer active:translate-y-0.5"
            >
              <ArrowLeft className="size-3.5 stroke-[2.5]" />
              <span>Back to Options</span>
            </button>
            <span className="text-[10px] font-mono font-bold uppercase text-[#161514]/60">
              {view === "presets" ? `${filteredPresets.length} Atomic Presets` : "Custom Builder"}
            </span>
          </div>
        )}

        {/* ─── 1. ROOT MENU VIEW (3 PROMINENT NEOBRUTALIST CARDS) ─── */}
        {view === "menu" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: Atomic Habits Vault */}
            <div
              onClick={() => {
                soundFX.playPop();
                soundFX.vibrate(15);
                setView("presets");
              }}
              className="bg-[#ECFDF5] hover:bg-[#D1FAE5] rounded-2xl p-4 sm:p-5 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-xl bg-[#03D26F] border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]">
                    <Sparkles className="size-5 stroke-[2.5]" />
                  </div>
                  <span className="bg-[#161514] text-[#CEF431] text-[9.5px] font-mono font-black px-2 py-0.5 rounded-full border border-[#161514]">
                    50+ PRESETS
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-heading font-black text-[#161514] group-hover:text-emerald-950">
                    Atomic Habits Vault
                  </h4>
                  <p className="text-[11px] font-bold text-[#161514]/75 mt-1 leading-snug">
                    Battle-tested micro-habits for sleep, hydration, deep work, 10k steps, and discipline.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#161514]/20 flex items-center justify-between text-xs font-heading font-black text-[#161514]">
                <span>Browse Presets</span>
                <span className="text-sm">→</span>
              </div>
            </div>

            {/* Card 2: Custom Habit Architect */}
            <div
              onClick={() => {
                soundFX.playPop();
                soundFX.vibrate(15);
                setView("custom");
              }}
              className="bg-[#FFF9EA] hover:bg-[#FEF08A] rounded-2xl p-4 sm:p-5 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-xl bg-amber-400 border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]">
                    <Plus className="size-5 stroke-[3]" />
                  </div>
                  <span className="bg-white text-[#161514] text-[9.5px] font-mono font-black px-2 py-0.5 rounded-full border border-[#161514]">
                    BESPOKE
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-heading font-black text-[#161514] group-hover:text-amber-950">
                    Custom Habit
                  </h4>
                  <p className="text-[11px] font-bold text-[#161514]/75 mt-1 leading-snug">
                    Craft your own bespoke routine with custom days, reminder times, colors, and goals.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#161514]/20 flex items-center justify-between text-xs font-heading font-black text-[#161514]">
                <span>Build From Scratch</span>
                <span className="text-sm">→</span>
              </div>
            </div>

            {/* Card 3: Curated Protocol Splits */}
            <div
              onClick={() => {
                soundFX.playPop();
                soundFX.vibrate(15);
                setView("packs");
              }}
              className="bg-[#FAF5FF] hover:bg-[#F3E8FF] rounded-2xl p-4 sm:p-5 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-xl bg-[#C084FC] border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]">
                    <Layers className="size-5 stroke-[2.5]" />
                  </div>
                  <span className="bg-[#161514] text-white text-[9.5px] font-mono font-black px-2 py-0.5 rounded-full">
                    CURATED
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-heading font-black text-[#161514] group-hover:text-purple-950">
                    Protocol Packs
                  </h4>
                  <p className="text-[11px] font-bold text-[#161514]/75 mt-1 leading-snug">
                    One-tap stack installs: Monk Mode, Reddit Essentials, Athletic Champ, and Morning Mastery.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#161514]/20 flex items-center justify-between text-xs font-heading font-black text-[#161514]">
                <span>Explore Packs</span>
                <span className="text-sm">→</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── 2. ATOMIC HABITS VAULT (SEARCHABLE 50+ PRESETS) ─── */}
        {view === "presets" && (
          <div className="space-y-3">
            {/* Search and Filters */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#161514]/50" />
              <input
                type="text"
                placeholder="Search habits (e.g. water, sunlight, steps, code, sleep)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FAF8F5] border-2 border-[#161514] rounded-xl pl-10 pr-9 py-2.5 text-xs font-heading font-bold text-[#161514] placeholder:text-[#161514]/40 shadow-[2px_2px_0px_#161514] outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#161514]/60 hover:text-[#161514]"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {CATEGORY_FILTERS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setSelectedCategory(cat);
                  }}
                  className={cn(
                    "text-[10px] font-heading font-black px-2.5 py-1 rounded-lg border-2 whitespace-nowrap transition-all cursor-pointer",
                    selectedCategory === cat
                      ? "bg-[#161514] text-[#CEF431] border-[#161514] shadow-[1.5px_1.5px_0px_#161514]"
                      : "bg-white text-[#161514]/70 border-[#161514]/40 hover:bg-[#FAF8F5]"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Presets List */}
            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {filteredPresets.length === 0 ? (
                <div className="bg-[#FAF8F5] rounded-xl p-6 border-2 border-dashed border-[#161514] text-center space-y-1">
                  <p className="text-xs font-heading font-black text-[#161514]">No presets match your search</p>
                  <p className="text-[10px] text-[#161514]/60">Try searching for a different keyword or create a custom habit.</p>
                </div>
              ) : (
                filteredPresets.map((preset) => {
                  const IconComponent = HABIT_ICONS_MAP[preset.icon] || Target;
                  const isAdded = addedPresetIds[preset.id];

                  return (
                    <div
                      key={preset.id}
                      className={cn(
                        "bg-white rounded-xl p-3 border-2 border-[#161514] shadow-[2px_2px_0px_#161514] flex items-center justify-between gap-3 transition-all",
                        isAdded && "bg-[#F0FDF4] border-emerald-600"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={cn(
                            "size-9 rounded-xl border-2 border-[#161514] flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#161514]",
                            preset.color === "emerald"
                              ? "bg-emerald-300"
                              : preset.color === "sky"
                              ? "bg-sky-300"
                              : preset.color === "amber"
                              ? "bg-amber-300"
                              : preset.color === "purple"
                              ? "bg-purple-300"
                              : "bg-rose-300"
                          )}
                        >
                          <IconComponent className="size-4 stroke-[2.5] text-[#161514]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="font-heading font-black text-xs text-[#161514] truncate">
                              {preset.title}
                            </h5>
                            <span className="neo-badge bg-[#FAF8F5] text-[#161514] text-[8.5px]">
                              {preset.category}
                            </span>
                            {preset.reminderTime && (
                              <span className="text-[9px] font-mono text-[#161514]/60 flex items-center gap-0.5">
                                <Clock className="size-2.5" />
                                {preset.reminderTime}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#161514]/70 font-medium truncate mt-0.5">
                            {preset.desc}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddPresetClick(preset)}
                        disabled={isPending}
                        className={cn(
                          "px-3 py-1.5 rounded-xl font-heading font-black text-xs border-2 border-[#161514] shadow-[1.5px_1.5px_0px_#161514] cursor-pointer active:translate-y-0.5 transition-all shrink-0 flex items-center gap-1",
                          isAdded
                            ? "bg-[#03D26F] text-[#161514]"
                            : "bg-[#CEF431] hover:bg-[#D8F74E] text-[#161514]"
                        )}
                      >
                        {isAdded ? (
                          <>
                            <Check className="size-3.5 stroke-[3]" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="size-3.5 stroke-[3]" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ─── 3. CUSTOM HABIT ARCHITECT ─── */}
        {view === "custom" && (
          <form onSubmit={handleCustomFormSubmit} className="space-y-3.5">
            {/* Title & Category */}
            <div className="space-y-1">
              <label className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514]">
                Habit Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Read 20 Pages, Cold Shower, Ship Daily"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-[#FAF8F5] rounded-xl border-2 border-[#161514] px-3.5 py-2 text-xs font-heading font-bold text-[#161514] shadow-[2px_2px_0px_#161514] outline-none"
                required
              />
            </div>

            {/* Icon Picker (Compact Grid) */}
            <div className="space-y-1">
              <label className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514]">
                Icon Archetype
              </label>
              <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5">
                {Object.keys(HABIT_ICONS_MAP).map((iconName) => {
                  const IconComponent = HABIT_ICONS_MAP[iconName];
                  const isSelected = customIcon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => {
                        soundFX.playPop();
                        setCustomIcon(iconName);
                      }}
                      className={cn(
                        "size-8 rounded-lg border-2 border-[#161514] flex items-center justify-center cursor-pointer transition-all",
                        isSelected
                          ? "bg-[#CEF431] shadow-[1.5px_1.5px_0px_#161514] scale-105"
                          : "bg-white hover:bg-[#FAF8F5]"
                      )}
                      title={iconName}
                    >
                      <IconComponent className="size-4 stroke-[2.2] text-[#161514]" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Accent Picker */}
            <div className="space-y-1">
              <label className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514]">
                Color Accent
              </label>
              <div className="flex items-center gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setCustomColor(c.name);
                    }}
                    className={cn(
                      "size-7 rounded-full border-2 border-[#161514] cursor-pointer transition-all",
                      c.bg,
                      customColor === c.name && "ring-2 ring-[#161514] ring-offset-2 scale-110"
                    )}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Frequency Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514]">
                Frequency & Schedule
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["daily", "weekly", "customDays"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setCustomFrequencyType(mode);
                    }}
                    className={cn(
                      "py-1.5 rounded-xl border-2 border-[#161514] text-[10px] font-heading font-black uppercase transition-all cursor-pointer",
                      customFrequencyType === mode
                        ? "bg-[#03D26F] text-[#161514] shadow-[1.5px_1.5px_0px_#161514]"
                        : "bg-white text-[#161514]/70 hover:bg-[#FAF8F5]"
                    )}
                  >
                    {mode === "daily" ? "Daily" : mode === "weekly" ? "Weekly" : "Custom Days"}
                  </button>
                ))}
              </div>

              {customFrequencyType === "customDays" && (
                <div className="pt-1.5">
                  <div className="grid grid-cols-7 gap-1">
                    {DAYS.map((d) => {
                      const isSelected = customDays.includes(d.value);
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleDay(d.value)}
                          className={cn(
                            "py-1.5 rounded-lg border-2 border-[#161514] text-xs font-heading font-black transition-all cursor-pointer",
                            isSelected
                              ? "bg-[#CEF431] text-[#161514] shadow-[1px_1px_0px_#161514]"
                              : "bg-[#FAF8F5] text-[#161514]/40"
                          )}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Reminder & Optional Numeric Goals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[9px] font-heading font-black uppercase text-[#161514]/80">
                  Daily Reminder Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 08:00 AM"
                  value={customReminderTime}
                  onChange={(e) => setCustomReminderTime(e.target.value)}
                  className="w-full bg-[#FAF8F5] rounded-xl border-2 border-[#161514] px-3 py-1.5 text-xs font-mono font-bold text-[#161514] outline-none shadow-[1.5px_1.5px_0px_#161514]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-heading font-black uppercase text-[#161514]/80">
                  Target Metric (Optional)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    placeholder="e.g. 15"
                    value={customGoalTarget}
                    onChange={(e) => setCustomGoalTarget(e.target.value)}
                    className="w-1/2 bg-[#FAF8F5] rounded-xl border-2 border-[#161514] px-3 py-1.5 text-xs font-mono font-bold text-[#161514] outline-none shadow-[1.5px_1.5px_0px_#161514]"
                  />
                  <input
                    type="text"
                    placeholder="pages / ml / mins"
                    value={customGoalUnit}
                    onChange={(e) => setCustomGoalUnit(e.target.value)}
                    className="w-1/2 bg-[#FAF8F5] rounded-xl border-2 border-[#161514] px-3 py-1.5 text-xs font-mono font-bold text-[#161514] outline-none shadow-[1.5px_1.5px_0px_#161514]"
                  />
                </div>
              </div>
            </div>

            {/* Grace Skip Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] border-2 border-[#161514]">
              <div>
                <span className="text-xs font-heading font-black text-[#161514] block">
                  Autonomous Grace Skip Shield
                </span>
                <span className="text-[10px] text-[#161514]/65 font-medium">
                  Preserve streak if missed during an emergency rest day
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setCustomGraceSkip(!customGraceSkip);
                }}
                className={cn(
                  "size-6 rounded-md border-2 border-[#161514] flex items-center justify-center font-black text-xs cursor-pointer",
                  customGraceSkip ? "bg-[#03D26F] text-[#161514]" : "bg-white"
                )}
              >
                {customGraceSkip ? "✓" : ""}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending || !customTitle.trim()}
              className="w-full bg-[#03D26F] hover:bg-[#02b861] text-[#161514] font-heading font-black rounded-xl py-2.5 px-4 text-xs border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Plus className="size-4 stroke-[3]" />
              <span>Create & Lock In Habit</span>
            </button>
          </form>
        )}

        {/* ─── 4. CURATED PROTOCOL PACKS ─── */}
        {view === "packs" && (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 no-scrollbar">
            {HABIT_TEMPLATE_PACKS.map((pack) => (
              <div
                key={pack.id}
                className="bg-white rounded-2xl p-4 border-[2.5px] border-[#161514] shadow-[3px_3px_0px_0px_#161514] space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{pack.icon}</span>
                      <h4 className="font-heading font-black text-sm text-[#161514]">
                        {pack.name}
                      </h4>
                    </div>
                    <p className="text-[11px] font-medium text-[#161514]/75 mt-0.5">
                      {pack.tagline}
                    </p>
                  </div>
                  {pack.badge && (
                    <span className="bg-[#CEF431] text-[#161514] text-[9px] font-mono font-black px-2 py-0.5 rounded-full border border-[#161514] shrink-0">
                      {pack.badge}
                    </span>
                  )}
                </div>

                {/* Items in Pack */}
                <div className="bg-[#FAF8F5] rounded-xl p-2.5 border-2 border-[#161514] space-y-1.5">
                  <div className="text-[9.5px] font-heading font-black uppercase text-[#161514]/60 tracking-wider">
                    Included Habits ({pack.items.length}):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {pack.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-[#161514] truncate"
                      >
                        <span className="text-[#03D26F] font-black">✓</span>
                        <span className="truncate">{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    soundFX.vibrate(25);
                    onApplyPresetPack(pack);
                  }}
                  disabled={isPending}
                  className="w-full bg-[#CEF431] hover:bg-[#D8F74E] text-[#161514] font-heading font-black rounded-xl py-2 px-3 text-xs border-2 border-[#161514] shadow-[2px_2px_0px_#161514] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles className="size-3.5" />
                  <span>Apply Entire &apos;{pack.name}&apos; Stack ({pack.items.length} Habits)</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdaptiveDrawerDialog>
  );
}
