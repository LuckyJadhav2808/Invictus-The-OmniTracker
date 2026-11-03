"use client";

import { useState } from "react";
import { AdaptiveDrawerDialog } from "@/components/shared/AdaptiveDrawerDialog";
import { soundFX } from "@/components/shared/SoundFX";
import { Plus, BookOpen, ChevronRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { CategoryIcon } from "@/components/money/MoneyQuickActionsAndCards";

export interface TemplateItem {
  id: string;
  title: string;
  category?: string;
  desc?: string;
  color?: string;
  icon?: string;
  amount?: number;
  target?: number;
  type?: string;
  [key: string]: any;
}

export interface TemplatePack {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  icon: string;
  items: TemplateItem[];
}

interface TemplateSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  blankLabel: string;
  blankDesc: string;
  templatesLabel: string;
  templatesDesc: string;
  templatePacks: TemplatePack[];
  appliedPackIds?: string[];
  onSelectBlank: () => void;
  onApplyTemplatePack: (pack: TemplatePack) => void;
  onUnapplyTemplatePack?: (pack: TemplatePack) => void;
}

export function TemplateSelectionModal({
  open,
  onOpenChange,
  title,
  subtitle = "Start from scratch or apply a ready-made routine pack.",
  blankLabel,
  blankDesc,
  templatesLabel,
  templatesDesc,
  templatePacks,
  appliedPackIds = [],
  onSelectBlank,
  onApplyTemplatePack,
  onUnapplyTemplatePack,
}: TemplateSelectionModalProps) {
  const [view, setView] = useState<"choice" | "browse">("choice");

  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setTimeout(() => {
        setView("choice");
      }, 200);
    }
  };

  const handleApply = (pack: TemplatePack) => {
    soundFX.playCompleteChime();
    onApplyTemplatePack(pack);
    handleClose(false);
  };

  const handleUnapply = (pack: TemplatePack) => {
    soundFX.playPop();
    if (onUnapplyTemplatePack) {
      onUnapplyTemplatePack(pack);
      handleClose(false);
    }
  };

  return (
    <AdaptiveDrawerDialog
      open={open}
      onOpenChange={handleClose}
      title={view === "choice" ? title : "Template Packs"}
      description={view === "choice" ? subtitle : "Select a curated pack to add all items in one click"}
    >
      {view === "choice" ? (
        <div className="space-y-3.5 py-1">
          {/* Option 1: Blank Item */}
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              handleClose(false);
              onSelectBlank();
            }}
            className="w-full bg-white dark:bg-[#1C1A18] rounded-xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center justify-between gap-4 text-left hover:bg-[#FAF8F5] dark:hover:bg-[#252321] transition-all cursor-pointer group select-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-lg bg-amber-400/20 dark:bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Plus className="size-6 stroke-[3] text-amber-900 dark:text-amber-200" />
              </div>
              <div>
                <span className="text-sm font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block" style={{ fontFamily: "var(--font-heading)" }}>
                  {blankLabel}
                </span>
                <span className="text-[10px] font-bold text-[#161514]/60 dark:text-[#FAF8F5]/60 uppercase tracking-wide block mt-0.5">
                  {blankDesc}
                </span>
              </div>
            </div>
            <ChevronRight className="size-5 stroke-[2.5] text-[#161514]/60 dark:text-[#FAF8F5]/60 shrink-0 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Option 2: Template Packs */}
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setView("browse");
            }}
            className="w-full bg-white dark:bg-[#1C1A18] rounded-xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center justify-between gap-4 text-left hover:bg-[#FAF8F5] dark:hover:bg-[#252321] transition-all cursor-pointer group select-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-lg bg-amber-300/20 dark:bg-amber-300/10 border border-amber-400/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen className="size-6 stroke-[2.5] text-amber-900 dark:text-amber-200" />
              </div>
              <div>
                <span className="text-sm font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block" style={{ fontFamily: "var(--font-heading)" }}>
                  {templatesLabel}
                </span>
                <span className="text-[10px] font-bold text-[#161514]/60 dark:text-[#FAF8F5]/60 uppercase tracking-wide block mt-0.5">
                  {templatesDesc}
                </span>
              </div>
            </div>
            <ChevronRight className="size-5 stroke-[2.5] text-[#161514]/60 dark:text-[#FAF8F5]/60 shrink-0 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      ) : (
        /* Template Packs Browser */
        <div className="space-y-4 py-1">
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setView("choice");
            }}
            className="flex items-center gap-1.5 text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] hover:underline cursor-pointer"
          >
            <ArrowLeft className="size-4 stroke-[2.5]" />
            <span>Back to options</span>
          </button>

          <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            {templatePacks.map((pack) => {
              const isApplied = appliedPackIds.includes(pack.id);
              return (
                <div
                  key={pack.id}
                  className="bg-white dark:bg-[#1C1A18] rounded-xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="size-9 rounded-lg bg-[#FAF8F5] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-center shrink-0">
                        {/\p{Extended_Pictographic}/u.test(pack.icon) && pack.icon.length <= 4 ? (
                          <span className="text-base leading-none">{pack.icon}</span>
                        ) : (
                          <CategoryIcon name={pack.icon} className="size-4 text-[#161514] dark:text-[#FAF8F5]" />
                        )}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-heading font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight">{pack.name}</h4>
                          {pack.badge && (
                            <span className="bg-amber-300/30 dark:bg-amber-400/20 text-amber-900 dark:text-amber-200 text-[9px] font-heading font-black uppercase px-2 py-0.5 rounded-md border border-amber-400/40 whitespace-nowrap shrink-0">
                              {pack.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-medium text-[#161514]/70 dark:text-[#FAF8F5]/70">{pack.tagline}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      {isApplied && onUnapplyTemplatePack && (
                        <button
                          type="button"
                          onClick={() => handleUnapply(pack)}
                          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-900 px-2.5 py-1.5 rounded-lg text-xs font-heading font-bold shadow-xs active:translate-y-0.5 cursor-pointer transition-all flex items-center gap-1 whitespace-nowrap shrink-0"
                        >
                          <span>Unapply</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleApply(pack)}
                        className="bg-[#CEF431] hover:bg-[#bde325] text-[#161514] border border-[#CEF431] px-3 py-1.5 rounded-lg text-xs font-heading font-black shadow-xs active:translate-y-0.5 cursor-pointer transition-all flex items-center gap-1 whitespace-nowrap shrink-0"
                      >
                        <Sparkles className="size-3.5 stroke-[2.5]" />
                        <span>{isApplied ? "Re-Apply" : "Apply Pack"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Items included pill list */}
                  <div className="pt-2 border-t border-[#E8E5DF] dark:border-[#2A2724] flex flex-wrap gap-1.5">
                    {pack.items.map((item, idx) => (
                      <span
                        key={idx}
                        className="bg-[#FAF8F5] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#2A2724] px-2 py-0.5 rounded-md text-[9px] font-medium flex items-center gap-1 shadow-xs"
                      >
                        <Check className="size-2.5 text-emerald-600 dark:text-[#03D26F] stroke-[3]" />
                        <span>{item.title}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdaptiveDrawerDialog>
  );
}
