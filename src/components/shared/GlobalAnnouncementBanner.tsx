"use client";

import { useState, useEffect } from "react";
import { Megaphone, X } from "lucide-react";
import { getGlobalAnnouncement, type GlobalAnnouncement } from "@/lib/custom-auth";

export function GlobalAnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await fetch("/api/admin/announcement");
        if (res.ok) {
          const data = await res.json();
          if (data && data.message) {
            setAnnouncement(data);
            return;
          }
        }
        setAnnouncement(getGlobalAnnouncement());
      } catch {
        setAnnouncement(getGlobalAnnouncement());
      }
    };
    fetchAnnouncement();
  }, []);

  if (!announcement || !announcement.message || dismissed) {
    return null;
  }

  return (
    <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] px-4 py-2 text-xs font-medium border-b border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-between transition-colors z-30 select-none safe-top-pad">
      <div className="flex items-center gap-2 max-w-4xl mx-auto flex-1 min-w-0">
        <Megaphone className="size-4 shrink-0 stroke-[1.75] text-[#8C8882] dark:text-[#A8A29E]" />
        <span className="truncate">{announcement.message}</span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1 hover:bg-[#E8E5DF] dark:hover:bg-[#252321] rounded-md transition-colors text-[#161514] dark:text-[#FAF8F5] cursor-pointer"
        aria-label="Dismiss announcement"
      >
        <X className="size-3.5 stroke-[1.75]" />
      </button>
    </div>
  );
}
