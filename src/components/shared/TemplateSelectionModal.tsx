"use client";

import { useState } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { Plus, BookOpen, ChevronRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
  onSelectBlank: () => void;
  onApplyTemplatePack: (pack: TemplatePack) => void;
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
  onSelectBlank,
  onApplyTemplatePack,
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
    onApplyTemplatePack(pack);
    handleClose(false);
  };

  return (
    <ResponsiveFormContainer
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
              handleClose(false);
              onSelectBlank();
            }}
            className="w-full bg-white rounded-2xl p-4 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] flex items-center justify-between gap-4 text-left hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-amber-50/60 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(31,36,48,1)] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-400 border-2 border-navy-950 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] group-hover:scale-105 transition-transform">
                <Plus className="h-6 w-6 stroke-[3] text-navy-950" />
              </div>
              <div>
                <span className="text-sm font-black uppercase tracking-wider text-navy-950 block">
                  {blankLabel}
                </span>
                <span className="text-[10px] font-bold text-navy-700 uppercase tracking-wide block mt-0.5">
                  {blankDesc}
                </span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 stroke-[2.5] text-navy-950 shrink-0 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Option 2: Template Packs */}
          <button
            type="button"
            onClick={() => setView("browse")}
            className="w-full bg-white rounded-2xl p-4 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] flex items-center justify-between gap-4 text-left hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-amber-50/60 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(31,36,48,1)] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-400 border-2 border-navy-950 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] group-hover:scale-105 transition-transform">
                <BookOpen className="h-5 w-5 stroke-[2.5] text-navy-950" />
              </div>
              <div>
                <span className="text-sm font-black uppercase tracking-wider text-navy-950 block">
                  {templatesLabel}
                </span>
                <span className="text-[10px] font-bold text-navy-700 uppercase tracking-wide block mt-0.5">
                  {templatesDesc}
                </span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 stroke-[2.5] text-navy-950 shrink-0 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      ) : (
        /* Template Packs Browser */
        <div className="space-y-4 py-1">
          <button
            type="button"
            onClick={() => setView("choice")}
            className="flex items-center gap-1.5 text-xs font-black text-navy-950 hover:underline cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
            <span>Back to options</span>
          </button>

          <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            {templatePacks.map((pack) => (
              <div
                key={pack.id}
                className="bg-white rounded-2xl p-4 border-2 border-navy-950 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)] space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{pack.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-navy-950 tracking-tight">{pack.name}</h4>
                        {pack.badge && (
                          <span className="bg-amber-300 text-navy-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            {pack.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-navy-700">{pack.tagline}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApply(pack)}
                    className="bg-amber-400 hover:bg-amber-500 text-navy-950 border-2 border-navy-950 px-3 py-1.5 rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shrink-0 transition-all flex items-center gap-1"
                  >
                    <Sparkles className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Apply Pack</span>
                  </button>
                </div>

                {/* Items included pill list */}
                <div className="pt-2 border-t border-navy-950/10 flex flex-wrap gap-1.5">
                  {pack.items.map((item, idx) => (
                    <span
                      key={idx}
                      className="bg-cream-bg text-navy-950 border border-navy-950 px-2 py-0.5 rounded-lg text-[9px] font-black flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]"
                    >
                      <Check className="h-2.5 w-2.5 text-emerald-600 stroke-[3]" />
                      <span>{item.title}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ResponsiveFormContainer>
  );
}
