"use client";

import { useTheme, ThemeMode } from "@/lib/hooks/useTheme";
import { Sun, Moon, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import { triggerHaptic } from "@/lib/native/haptics";

interface ThemeToggleProps {
  variant?: "button" | "segmented";
  className?: string;
  size?: "sm" | "md";
}

export function ThemeToggle({
  variant = "button",
  className,
  size = "md",
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme, isDark, mounted } = useTheme();

  const handleToggleClick = () => {
    soundFX.playPop();
    triggerHaptic("light");
    toggleTheme();
  };

  const handleSelectMode = (mode: ThemeMode) => {
    soundFX.playPop();
    triggerHaptic("light");
    setTheme(mode);
  };

  // Static skeleton during SSR hydration to avoid layout shifts
  if (!mounted) {
    if (variant === "segmented") {
      return (
        <div
          className={cn(
            "flex items-center p-1 rounded-xl bg-[#F1EFEA] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#2A2724] h-10 w-64",
            className
          )}
        />
      );
    }
    return (
      <div
        className={cn(
          "rounded-lg bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] shrink-0",
          size === "sm" ? "size-7" : "size-8",
          className
        )}
      />
    );
  }

  // Segmented 3-Way Switcher (Light / Dark / System) for Settings Page
  if (variant === "segmented") {
    const options: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
      { mode: "light", label: "Light", icon: Sun },
      { mode: "dark", label: "Dark", icon: Moon },
      { mode: "system", label: "System", icon: Laptop },
    ];

    return (
      <div
        className={cn(
          "inline-flex items-center p-1 rounded-xl bg-[#F1EFEA] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#2A2724] select-none shadow-xs transition-colors",
          className
        )}
        role="radiogroup"
        aria-label="Theme mode selector"
      >
        {options.map((opt) => {
          const isSelected = theme === opt.mode;
          const Icon = opt.icon;
          return (
            <button
              key={opt.mode}
              type="button"
              onClick={() => handleSelectMode(opt.mode)}
              role="radio"
              aria-checked={isSelected}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer",
                isSelected
                  ? "bg-white dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] shadow-xs border border-[#E8E5DF] dark:border-[#383531]"
                  : "text-[#8C8882] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5] border border-transparent"
              )}
            >
              <Icon className="size-3.5 stroke-[2]" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact Neobrutalist Button (For SpaceHeader & Sidebar)
  return (
    <button
      type="button"
      onClick={handleToggleClick}
      aria-label={isDark ? "Switch to Day Mode (⌘D)" : "Switch to Night Mode (⌘D)"}
      title={isDark ? "Switch to Day Mode (⌘D)" : "Switch to Night Mode (⌘D)"}
      className={cn(
        "relative rounded-lg bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] hover:bg-[#F1EFEA] dark:hover:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] flex items-center justify-center transition-colors shadow-xs cursor-pointer select-none shrink-0 group overflow-hidden",
        size === "sm" ? "size-7" : "size-8",
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        {isDark ? (
          <Moon
            className={cn(
              "stroke-[1.75] text-[#FAF8F5] transition-all duration-200 transform scale-100 rotate-0 group-hover:-rotate-12",
              size === "sm" ? "size-3.5" : "size-4"
            )}
          />
        ) : (
          <Sun
            className={cn(
              "stroke-[1.75] text-[#161514] transition-all duration-200 transform scale-100 rotate-0 group-hover:rotate-45",
              size === "sm" ? "size-3.5" : "size-4"
            )}
          />
        )}
      </div>
    </button>
  );
}
