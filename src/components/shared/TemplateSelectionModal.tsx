"use client";

import { useState } from "react";
import { AdaptiveDrawerDialog } from "@/components/shared/AdaptiveDrawerDialog";
import { soundFX } from "@/components/shared/SoundFX";
import { Plus, BookOpen, ChevronRight, ArrowLeft, Check, Sparkles } from "lucide-react";

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
  subtitle = "START FROM SCRATCH OR APPLY A READY-MADE ROUTINE PACK.",
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
      title={view === "choice" ? title : "TEMPLATE PACKS"}
      description={view === "choice" ? subtitle : "SELECT A CURATED PACK TO ADD ALL ITEMS IN ONE CLICK"}
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
            className="w-full bg-white rounded-2xl p-4 border-2 border-[#161514] shadow-[3.5px_3.5px_0px_0px_#161514] flex items-center justify-between gap-4 text-left hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-amber-50/60 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer group select-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-xl bg-amber-400 border-2 border-[#161514] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#161514] group-hover:scale-105 transition-transform">
                <Plus className="size-6 stroke-[3] text-[#161514]" />
              </div>
              <div>
                <span className="text-sm font-heading font-black uppercase tracking-wider text-[#161514] block" style={{ fontFamily: "var(--font-heading)" }}>
                  {blankLabel}
                </span>
                <span className="text-[10px] font-bold text-[#161514]/70 uppercase tracking-wide block mt-0.5">
                  {blankDesc}
                </span>
              </div>
            </div>
            <ChevronRight className="size-5 stroke-[2.5] text-[#161514] shrink-0 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Option 2: Template Packs */}
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setView("browse");
            }}
            className="w-full bg-white rounded-2xl p-4 border-2 border-[#161514] shadow-[3.5px_3.5px_0px_0px_#161514] flex items-center justify-between gap-4 text-left hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-amber-50/60 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer group select-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-xl bg-amber-300 border-2 border-[#161514] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#161514] group-hover:scale-105 transition-transform">
                <BookOpen className="size-6 stroke-[2.5] text-[#161514]" />
              </div>
              <div>
                <span className="text-sm font-heading font-black uppercase tracking-wider text-[#161514] block" style={{ fontFamily: "var(--font-heading)" }}>
                  {templatesLabel}
                </span>
                <span className="text-[10px] font-bold text-[#161514]/70 uppercase tracking-wide block mt-0.5">
                  {templatesDesc}
                </span>
              </div>
            </div>
            <ChevronRight className="size-5 stroke-[2.5] text-[#161514] shrink-0 group-hover:translate-x-1 transition-transform" />
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
            className="flex items-center gap-1.5 text-xs font-heading font-black text-[#161514] hover:underline cursor-pointer"
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
                  className="bg-white rounded-2xl p-4 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl shrink-0">{pack.icon}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-heading font-black text-[#161514] tracking-tight">{pack.name}</h4>
                          {pack.badge && (
                            <span className="bg-amber-300 text-[#161514] text-[9px] font-heading font-black uppercase px-2 py-0.5 rounded-lg border border-[#161514] shadow-[1px_1px_0px_0px_#161514] whitespace-nowrap shrink-0">
                              {pack.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-[#161514]/70">{pack.tagline}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      {isApplied && onUnapplyTemplatePack && (
                        <button
                          type="button"
                          onClick={() => handleUnapply(pack)}
                          className="bg-rose-400 hover:bg-rose-500 text-[#161514] border-2 border-[#161514] px-2.5 py-1.5 rounded-xl text-xs font-heading font-black shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer transition-all flex items-center gap-1 whitespace-nowrap shrink-0"
                        >
                          <span>Unapply</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleApply(pack)}
                        className="bg-[#CEF431] hover:bg-[#bde325] text-[#161514] border-2 border-[#161514] px-3 py-1.5 rounded-xl text-xs font-heading font-black shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer transition-all flex items-center gap-1 whitespace-nowrap shrink-0"
                      >
                        <Sparkles className="size-3.5 stroke-[2.5]" />
                        <span>{isApplied ? "Re-Apply" : "Apply Pack"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Items included pill list */}
                  <div className="pt-2 border-t border-[#161514]/10 flex flex-wrap gap-1.5">
                    {pack.items.map((item, idx) => (
                      <span
                        key={idx}
                        className="bg-[#FAF8F5] text-[#161514] border border-[#161514] px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1 shadow-[1px_1px_0px_0px_#161514]"
                      >
                        <Check className="size-2.5 text-emerald-600 stroke-[3]" />
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
