"use client";

import { useMemo } from "react";
import { ChevronUp, ChevronDown, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface NeobrutalistTimeInputProps {
  value: string; // "HH:MM" 24h format e.g. "20:00" or "08:30"
  onChange: (val: string) => void;
  label?: string;
}

export function NeobrutalistTimeInput({ value, onChange, label }: NeobrutalistTimeInputProps) {
  // Parse "HH:MM" into 12h format (hour12, minute, period AM/PM)
  const { hour12, minute, period, rawHour24 } = useMemo(() => {
    if (!value || !value.includes(":")) {
      return { hour12: "08", minute: "00", period: "PM", rawHour24: 20 };
    }
    const [hStr, mStr] = value.split(":");
    let h = parseInt(hStr, 10);
    if (isNaN(h)) h = 20;
    const p = h >= 12 ? "PM" : "AM";
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return {
      hour12: String(h12).padStart(2, "0"),
      minute: mStr || "00",
      period: p,
      rawHour24: h,
    };
  }, [value]);

  const updateTime = (newH12Str: string, newMinStr: string, newPeriod: string) => {
    let h = parseInt(newH12Str, 10);
    if (isNaN(h)) h = 12;
    if (newPeriod === "PM" && h < 12) h += 12;
    if (newPeriod === "AM" && h === 12) h = 0;
    const final24 = `${String(h).padStart(2, "0")}:${newMinStr}`;
    onChange(final24);
  };

  const handleIncrementHour = () => {
    let h = parseInt(hour12, 10) + 1;
    if (h > 12) h = 1;
    updateTime(String(h).padStart(2, "0"), minute, period);
  };

  const handleDecrementHour = () => {
    let h = parseInt(hour12, 10) - 1;
    if (h < 1) h = 12;
    updateTime(String(h).padStart(2, "0"), minute, period);
  };

  const handleIncrementMin = () => {
    const mins = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
    const currIdx = mins.indexOf(minute);
    const nextIdx = (currIdx + 1) % mins.length;
    updateTime(hour12, mins[nextIdx], period);
  };

  const handleDecrementMin = () => {
    const mins = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
    const currIdx = mins.indexOf(minute);
    const prevIdx = (currIdx - 1 + mins.length) % mins.length;
    updateTime(hour12, mins[prevIdx], period);
  };

  const hoursOptions = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutesOptions = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

  const presets = [
    { label: "🌅 8 AM", time: "08:00" },
    { label: "☀️ 12 PM", time: "12:00" },
    { label: "🌆 6 PM", time: "18:00" },
    { label: "🌙 9 PM", time: "21:00" },
    { label: "💤 10 PM", time: "22:00" },
  ];

  return (
    <div className="space-y-2 select-none">
      {label && (
        <span className="text-[10px] font-black uppercase text-[#161514] block tracking-wider">
          {label}
        </span>
      )}

      {/* Main Neobrutalist Time Console */}
      <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]">
        
        {/* Left: Clock Icon + Segmented Display */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#FAF8F5] border-2 border-[#161514] flex items-center justify-center text-[#161514] shrink-0 shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]">
            <Clock className="h-4 w-4 stroke-[2.5]" />
          </div>

          {/* Hour Segment Card with Steppers */}
          <div className="flex items-center rounded-xl bg-[#FAF8F5] border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] px-1 py-0.5">
            <select
              value={hour12}
              onChange={(e) => updateTime(e.target.value, minute, period)}
              className="bg-transparent text-sm sm:text-base font-black text-[#161514] focus:outline-none cursor-pointer text-center px-1 font-mono appearance-none"
            >
              {hoursOptions.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            
            <div className="flex flex-col gap-0.5 ml-0.5">
              <button
                type="button"
                onClick={handleIncrementHour}
                className="h-3 w-4.5 bg-white hover:bg-[#CEF431] border border-[#161514] rounded flex items-center justify-center text-[#161514] cursor-pointer active:scale-95"
                title="Increase hour"
              >
                <ChevronUp className="h-2.5 w-2.5 stroke-[3]" />
              </button>
              <button
                type="button"
                onClick={handleDecrementHour}
                className="h-3 w-4.5 bg-white hover:bg-[#CEF431] border border-[#161514] rounded flex items-center justify-center text-[#161514] cursor-pointer active:scale-95"
                title="Decrease hour"
              >
                <ChevronDown className="h-2.5 w-2.5 stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Digital Blinking Separator */}
          <span className="font-black text-sm sm:text-base text-[#161514]">:</span>

          {/* Minute Segment Card with Steppers */}
          <div className="flex items-center rounded-xl bg-[#FAF8F5] border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] px-1 py-0.5">
            <select
              value={minute}
              onChange={(e) => updateTime(hour12, e.target.value, period)}
              className="bg-transparent text-sm sm:text-base font-black text-[#161514] focus:outline-none cursor-pointer text-center px-1 font-mono appearance-none"
            >
              {minutesOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <div className="flex flex-col gap-0.5 ml-0.5">
              <button
                type="button"
                onClick={handleIncrementMin}
                className="h-3 w-4.5 bg-white hover:bg-[#CEF431] border border-[#161514] rounded flex items-center justify-center text-[#161514] cursor-pointer active:scale-95"
                title="Increase minutes"
              >
                <ChevronUp className="h-2.5 w-2.5 stroke-[3]" />
              </button>
              <button
                type="button"
                onClick={handleDecrementMin}
                className="h-3 w-4.5 bg-white hover:bg-[#CEF431] border border-[#161514] rounded flex items-center justify-center text-[#161514] cursor-pointer active:scale-95"
                title="Decrease minutes"
              >
                <ChevronDown className="h-2.5 w-2.5 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Tactile Dual AM / PM Switcher Pills */}
        <div className="flex items-center p-1 rounded-xl bg-[#FAF8F5] border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] gap-1 shrink-0">
          {(["AM", "PM"] as const).map((p) => {
            const isActive = period === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => updateTime(hour12, minute, p)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-black transition-all border-2 cursor-pointer uppercase tracking-wider",
                  isActive
                    ? "bg-[#CEF431] text-[#161514] border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] scale-105"
                    : "bg-transparent text-[#161514]/60 border-transparent hover:text-[#161514] hover:bg-white"
                )}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick 1-Tap Preset Time Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[9px] font-black uppercase text-[#161514]/60 mr-0.5 shrink-0 flex items-center gap-0.5">
          <Sparkles className="h-2.5 w-2.5" /> Quick:
        </span>
        {presets.map((pr) => {
          const isPresetActive = value === pr.time;
          return (
            <button
              key={pr.time}
              type="button"
              onClick={() => onChange(pr.time)}
              className={cn(
                "px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black transition-all border border-[#161514] cursor-pointer whitespace-nowrap shrink-0",
                isPresetActive
                  ? "bg-[#03D26F] text-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] scale-105"
                  : "bg-white text-[#161514]/80 hover:bg-[#CEF431]/40"
              )}
            >
              {pr.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
