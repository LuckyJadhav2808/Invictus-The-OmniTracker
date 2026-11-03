"use client";

import React, { useState, useEffect } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { type Category } from "@/types";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import { Trash2 } from "lucide-react";
import { CategoryIcon } from "@/components/money/MoneyQuickActionsAndCards";

interface CategoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Category | null;
  currencySymbol: string;
  onSave: (payload: {
    id?: string;
    name: string;
    type: "expense" | "income";
    color: string;
    icon: string;
    monthlyBudget: number;
  }) => Promise<any>;
  onDelete?: (id: string) => Promise<any>;
}

const PRESET_ICONS = [
  "Wallet",
  "Briefcase",
  "Coffee",
  "Home",
  "Compass",
  "DollarSign",
  "Smile",
  "ShoppingBag",
  "Utensils",
  "Zap",
  "BookOpen",
  "HeartPulse",
  "Tag",
  "PiggyBank",
  "Smartphone",
  "CreditCard",
  "Dumbbell",
  "Gamepad",
  "Laptop",
  "Sparkles",
  "GraduationCap",
  "Music",
  "Shield",
  "Car",
];

const PRESET_COLORS = [
  { label: "Lime", value: "lime", bg: "bg-[#CEF431]" },
  { label: "Emerald", value: "emerald", bg: "bg-[#03D26F]" },
  { label: "Amber", value: "amber", bg: "bg-amber-400" },
  { label: "Coral", value: "coral", bg: "bg-rose-400" },
  { label: "Sky", value: "sky", bg: "bg-sky-400" },
  { label: "Indigo", value: "indigo", bg: "bg-indigo-400" },
  { label: "Pink", value: "pink", bg: "bg-pink-400" },
  { label: "Slate", value: "slate", bg: "bg-stone-300" },
];

export function CategoryFormModal({
  open,
  onOpenChange,
  initialData,
  currencySymbol,
  onSave,
  onDelete,
}: CategoryFormModalProps) {
  const isEditing = Boolean(initialData?.id);

  const [name, setName] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [icon, setIcon] = useState("Wallet");
  const [color, setColor] = useState("lime");
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name || "");
        setType(initialData.type || "expense");
        setIcon(initialData.icon || "Wallet");
        setColor(initialData.color || "lime");
        setMonthlyBudget(String(initialData.monthlyBudget || ""));
      } else {
        setName("");
        setType("expense");
        setIcon("Tag");
        setColor("lime");
        setMonthlyBudget("");
      }
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        id: initialData?.id,
        name: name.trim(),
        type,
        icon,
        color,
        monthlyBudget: parseFloat(monthlyBudget) || 0,
      });
      soundFX.playPop();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(initialData.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Category" : "New Category"}
      description={isEditing ? "Update category envelope and monthly cap" : "Create a customized budget envelope"}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Category Type */}
        <div className="flex gap-2">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                soundFX.playPop();
                setType(t);
              }}
              className={cn(
                "flex-1 py-2 rounded-xl border text-xs font-black transition-all uppercase tracking-wider cursor-pointer shadow-xs active:translate-y-0.5",
                type === t
                  ? "bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514] border-[#161514] dark:border-[#FAF8F5]"
                  : "bg-white dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#2A2724] hover:bg-[#FAF8F5] dark:hover:bg-[#252321]"
              )}
            >
              {t === "expense" ? "Expense Envelope" : "Income Source"}
            </button>
          ))}
        </div>

        {/* Category Name */}
        <div className="space-y-1">
          <label htmlFor="cat-name" className="text-[10px] font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]">
            Category Name *
          </label>
          <input
            id="cat-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Groceries, Entertainment, Rent..."
            required
            className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3.5 py-2.5 text-base font-bold text-[#161514] dark:text-[#FAF8F5] shadow-xs focus:outline-none focus:border-[#161514] dark:focus:border-white"
          />
        </div>

        {/* Monthly Budget Cap */}
        {type === "expense" && (
          <div className="space-y-1">
            <label htmlFor="cat-budget" className="text-[10px] font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]">
              Monthly Allocation Cap ({currencySymbol})
            </label>
            <input
              id="cat-budget"
              type="number"
              step="any"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              placeholder="0 (no limit)"
              className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3.5 py-2.5 text-base font-bold text-[#161514] dark:text-[#FAF8F5] shadow-xs focus:outline-none focus:border-[#161514] dark:focus:border-white"
            />
          </div>
        )}

        {/* Icon Picker Grid */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]">
            Select Icon
          </label>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 bg-[#FAF8F5] dark:bg-[#1C1A18] p-2.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs">
            {PRESET_ICONS.map((presetIcon) => (
              <button
                key={presetIcon}
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setIcon(presetIcon);
                }}
                className={cn(
                  "p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer border",
                  icon === presetIcon
                    ? "bg-[#CEF431] border-[#161514] dark:border-[#CEF431] scale-105 shadow-xs"
                    : "bg-white dark:bg-[#252321] border-transparent hover:border-[#E8E5DF] dark:hover:border-[#2A2724]"
                )}
                title={presetIcon}
              >
                <CategoryIcon name={presetIcon} className="size-4 text-[#161514] dark:text-[#FAF8F5]" />
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette Picker */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]">
            Theme Color
          </label>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setColor(c.value);
                }}
                className={cn(
                  "w-7 h-7 rounded-full border border-[#161514] dark:border-white/20 shrink-0 transition-all cursor-pointer shadow-xs",
                  c.bg,
                  color === c.value && "scale-110 ring-2 ring-[#161514] dark:ring-white"
                )}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {isEditing && onDelete && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/40 hover:bg-rose-200 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/50 shadow-xs active:translate-y-0.5 transition-all cursor-pointer"
              title="Delete Category"
            >
              <Trash2 className="size-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-[#CEF431] hover:bg-[#bde422] text-[#161514] font-black text-xs uppercase tracking-wider rounded-xl py-3 border border-[#161514] shadow-xs active:translate-y-0.5 cursor-pointer transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : isEditing ? "Save Envelope" : "Create Envelope"}
          </button>
        </div>
      </form>
    </ResponsiveFormContainer>
  );
}
