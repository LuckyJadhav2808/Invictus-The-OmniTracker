"use client";

import React from "react";
import { useColorTheme, ColorThemeId } from "@/lib/hooks/useColorTheme";
import { cn } from "@/lib/utils";
import { Check, Palette, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ThemeColorSelectorProps {
  className?: string;
}

export function ThemeColorSelector({ className }: ThemeColorSelectorProps) {
  const { colorTheme, setColorTheme, themes, mounted } = useColorTheme();

  if (!mounted) {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3", className)}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-[#F1EFEA] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#2A2724] animate-pulse"
          />
        ))}
      </div>
    );
  }

  const handleSelect = (id: ColorThemeId, name: string) => {
    setColorTheme(id);
    const emojiMap: Record<ColorThemeId, string> = {
      classic: "⚡",
      terracotta: "🍊",
      amber: "🔥",
      cobalt: "👑",
    };
    toast.success(`Theme persona set to ${name.toUpperCase()} ${emojiMap[id] || "🎨"}`);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5 font-heading">
            <Palette className="h-3.5 w-3.5 text-amber-500 stroke-[2.5]" /> Color Theme &amp; Action Palette
          </span>
          <p className="text-[10px] text-[#8C8882] dark:text-[#A8A29E] font-medium mt-0.5">
            Two matching neutral foundations (Cream paper &amp; Obsidian ink) + high-visibility action punch for buttons
          </p>
        </div>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        role="radiogroup"
        aria-label="Color theme palette selector"
      >
        {themes.map((t) => {
          const isSelected = colorTheme === t.id;

          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelect(t.id, t.name)}
              className={cn(
                "relative group text-left p-3.5 rounded-2xl border-2 transition-all duration-150 cursor-pointer flex flex-col justify-between gap-3 select-none",
                isSelected
                  ? "bg-white dark:bg-[#1C1A18] border-[#161514] dark:border-[#FAF8F5] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] translate-x-[-1px] translate-y-[-1px]"
                  : "bg-[#FAF8F5] dark:bg-[#181615] border-[#E8E5DF] dark:border-[#2A2724] hover:border-[#161514]/40 dark:hover:border-[#FAF8F5]/40 hover:bg-white dark:hover:bg-[#1E1B19]"
              )}
            >
              {/* Top Row: Name, Tagline & Selection Checkmark */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading font-black text-xs text-[#161514] dark:text-[#FAF8F5]">
                      {t.name}
                    </span>
                    {t.id === "terracotta" && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-[#FF5C00]/15 text-[#FF5C00] dark:text-[#FF7324] font-mono text-[9px] font-black uppercase tracking-wider border border-[#FF5C00]/30">
                        <Sparkles className="size-2.5" /> Orange
                      </span>
                    )}
                    {t.id === "classic" && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-[#CEF431]/20 text-[#161514] dark:text-[#CEF431] font-mono text-[9px] font-black uppercase tracking-wider border border-[#161514]/20 dark:border-[#CEF431]/30">
                        Original
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#8C8882] dark:text-[#A8A29E] font-medium truncate mt-0.5">
                    {t.tagline}
                  </p>
                </div>

                {/* Radio Check Indicator */}
                <div
                  className={cn(
                    "size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                    isSelected
                      ? "bg-[#161514] dark:bg-[#FAF8F5] border-[#161514] dark:border-[#FAF8F5] text-white dark:text-[#161514]"
                      : "border-[#D1CDC7] dark:border-[#383531] bg-transparent text-transparent"
                  )}
                >
                  <Check className="size-3 stroke-[3]" />
                </div>
              </div>

              {/* Bottom Row: Swatches & Mini Sample Button */}
              <div className="flex items-center justify-between pt-1 border-t border-[#E8E5DF]/60 dark:border-[#2A2724]/60">
                {/* 3-Color Swatch Pill */}
                <div className="flex items-center gap-1.5 bg-[#F1EFEA] dark:bg-[#252321] px-2 py-1 rounded-lg border border-[#E8E5DF] dark:border-[#2E2B28]">
                  <span
                    className="size-3 rounded-full border border-[#161514]/30 shadow-xs shrink-0"
                    style={{ backgroundColor: t.swatches.canvas }}
                    title="Background: Cream Paper"
                  />
                  <span
                    className="size-3 rounded-full border border-[#161514]/30 shadow-xs shrink-0"
                    style={{ backgroundColor: t.swatches.ink }}
                    title="Structure: Obsidian Ink"
                  />
                  <span
                    className="size-3 rounded-full border border-[#161514]/30 shadow-xs shrink-0"
                    style={{ backgroundColor: t.swatches.accent }}
                    title={`Action Accent: ${t.name}`}
                  />
                </div>

                {/* Live Sample Action Button */}
                <div
                  className="px-2.5 py-1 rounded-lg text-[10px] font-heading font-black tracking-wide border-2 shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] shrink-0"
                  style={{
                    backgroundColor: t.buttonPreview.bg,
                    color: t.buttonPreview.fg,
                    borderColor: isSelected ? "#161514" : "#161514",
                  }}
                >
                  {t.buttonPreview.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
