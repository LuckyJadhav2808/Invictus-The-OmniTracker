"use client";

import { useMemo } from "react";
import { ChevronUp, ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface NeobrutalistTimeInputProps {
  value: string; // "HH:MM" 24h format e.g. "20:00" or "08:30"
  onChange: (val: string) => void;
  label?: string;
}

export function NeobrutalistTimeInput({ value, onChange, label }: NeobrutalistTimeInputProps) {
  // Parse "HH:MM" into 12h format (hour12, minute, period AM/PM)
  const { hour12, minute, period } = useMemo(() => {
    if (!value || !value.includes(":")) {
      return { hour12: "08", minute: "00", period: "PM" };
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
    };
  }, [value]);

  const updateTime = (newH12: string, newMin: string, newPeriod: string) => {
    let h = parseInt(newH12, 10);
    if (isNaN(h)) h = 12;
    if (newPeriod === "PM" && h < 12) h += 12;
    if (newPeriod === "AM" && h === 12) h = 0;
    const final24 = `${String(h).padStart(2, "0")}:${newMin}`;
    onChange(final24);
  };

  const hoursOptions = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutesOptions = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

  return (
    <div className="space-y-1">
      {label && (
        <span className="text-[10px] font-black uppercase text-[#161514] block tracking-wider">
          {label}
        </span>
      )}

      <div className="flex items-center gap-1.5 bg-[#FAF8F5] p-1.5 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)]">
        <Clock className="h-4 w-4 stroke-[2.5] text-[#161514] ml-1 shrink-0" />

        {/* Hours Selector */}
        <select
          value={hour12}
          onChange={(e) => updateTime(e.target.value, minute, period)}
          className="bg-white rounded-xl border-2 border-[#161514] px-2 py-1 text-xs font-black text-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] cursor-pointer"
        >
          {hoursOptions.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>

        <span className="font-black text-xs text-[#161514]">:</span>

        {/* Minutes Selector */}
        <select
          value={minute}
          onChange={(e) => updateTime(hour12, e.target.value, period)}
          className="bg-white rounded-xl border-2 border-[#161514] px-2 py-1 text-xs font-black text-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] cursor-pointer"
        >
          {minutesOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* AM / PM Toggle Pills */}
        <div className="flex items-center gap-0.5 ml-auto">
          {(["AM", "PM"] as const).map((p) => {
            const isActive = period === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => updateTime(hour12, minute, p)}
                className={cn(
                  "px-2 py-0.5 rounded-lg text-[10px] font-black transition-all border border-[#161514] cursor-pointer",
                  isActive
                    ? "bg-[#CEF431] text-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] scale-105"
                    : "bg-white text-gray-500 hover:bg-amber-100"
                )}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
