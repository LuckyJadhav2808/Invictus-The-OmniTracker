"use client";

import React, { useState, useEffect } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { type Category } from "@/types";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import { Trash2 } from "lucide-react";

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
  "🍔", "☕", "🚕", "🛒", "🛍️", "🍿", "💊", "📚",
  "⚡", "🏠", "✈️", "🏋️", "💻", "🎮", "🐾", "🎁",
  "💰", "💼", "📈", "💵", "🏦", "🎯", "✨", "💳"
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
  const [icon, setIcon] = useState("💳");
  const [color, setColor] = useState("lime");
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name || "");
        setType(initialData.type || "expense");
        setIcon(initialData.icon || "💳");
        setColor(initialData.color || "lime");
        setMonthlyBudget(String(initialData.monthlyBudget || ""));
      } else {
        setName("");
        setType("expense");
        setIcon("🍔");
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
                "flex-1 py-2 rounded-xl border-2 border-[#161514] text-xs font-black transition-all uppercase tracking-wider cursor-pointer shadow-[2px_2px_0px_0px_#161514]",
                type === t
                  ? "bg-[#161514] text-white"
                  : "bg-white text-[#161514]/70 hover:bg-[#FAF8F5]"
              )}
            >
              {t === "expense" ? "Expense Envelope" : "Income Source"}
            </button>
          ))}
        </div>

        {/* Category Name */}
        <div className="space-y-1">
          <label htmlFor="cat-name" className="text-[10px] font-black uppercase tracking-wider text-[#161514]">
            Category Name *
          </label>
          <input
            id="cat-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Groceries, Entertainment, Rent..."
            required
            className="w-full neo-input text-xs sm:text-sm font-bold"
          />
        </div>

        {/* Monthly Budget Cap */}
        {type === "expense" && (
          <div className="space-y-1">
            <label htmlFor="cat-budget" className="text-[10px] font-black uppercase tracking-wider text-[#161514]">
              Monthly Allocation Cap ({currencySymbol})
            </label>
            <input
              id="cat-budget"
              type="number"
              step="any"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              placeholder="0 (no limit)"
              className="w-full neo-input text-xs sm:text-sm font-bold"
            />
          </div>
        )}

        {/* Icon Picker Grid */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#161514]">
            Select Icon
          </label>
          <div className="grid grid-cols-8 gap-1 bg-[#FAF8F5] p-2 rounded-xl border-2 border-[#161514]">
            {PRESET_ICONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setIcon(emoji);
                }}
                className={cn(
                  "p-1.5 rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer",
                  icon === emoji
                    ? "bg-[#CEF431] border border-[#161514] scale-110 shadow-[1px_1px_0px_0px_#161514]"
                    : "hover:bg-white/80"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette Picker */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#161514]">
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
                  "w-7 h-7 rounded-full border-2 border-[#161514] shrink-0 transition-all cursor-pointer shadow-[1px_1px_0px_0px_#161514]",
                  c.bg,
                  color === c.value && "scale-110 ring-2 ring-[#161514]"
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
              className="p-3 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              title="Delete Category"
            >
              <Trash2 className="size-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-[#CEF431] hover:bg-[#bde422] text-[#161514] font-black text-xs uppercase tracking-wider rounded-xl py-3 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : isEditing ? "Save Envelope" : "Create Envelope ✨"}
          </button>
        </div>
      </form>
    </ResponsiveFormContainer>
  );
}
