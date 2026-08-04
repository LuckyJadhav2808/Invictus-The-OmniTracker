"use client";

import { useState, useEffect } from "react";
import { Clipboard, Copy, Trash2, Sparkles, Check, Tag, StickyNote, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TAGS = [
  { id: "reminder", label: "📌 Reminder", color: "bg-amber-300 text-[#161514]" },
  { id: "priority", label: "⚡ Priority", color: "bg-rose-300 text-[#161514]" },
  { id: "idea", label: "💡 Idea", color: "bg-[#CEF431] text-[#161514]" },
  { id: "draft", label: "📝 Quick Draft", color: "bg-sky-300 text-[#161514]" },
];

export function QuickThoughtsWidget() {
  const [note, setNote] = useState("");
  const [activeTag, setActiveTag] = useState("reminder");
  const [isCopied, setIsCopied] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedNote = localStorage.getItem("invictus_quick_thoughts");
      const savedTag = localStorage.getItem("invictus_quick_thoughts_tag");
      if (savedNote !== null) setNote(savedNote);
      if (savedTag !== null) setActiveTag(savedTag);
    } catch {}
  }, []);

  const handleNoteChange = (val: string) => {
    setNote(val);
    try {
      localStorage.setItem("invictus_quick_thoughts", val);
      setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch {}
  };

  const handleTagChange = (tagId: string) => {
    setActiveTag(tagId);
    try {
      localStorage.setItem("invictus_quick_thoughts_tag", tagId);
    } catch {}
  };

  const handleCopyToClipboard = async () => {
    if (!note.trim()) {
      toast.error("Scratchpad is empty! Type something first.");
      return;
    }
    try {
      await navigator.clipboard.writeText(note);
      setIsCopied(true);
      toast.success("Thoughts copied to clipboard! 📋✨");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Failed to copy note.");
    }
  };

  const handleClear = () => {
    setNote("");
    try {
      localStorage.removeItem("invictus_quick_thoughts");
    } catch {}
    toast.info("Scratchpad cleared.");
  };

  const currentTagObj = TAGS.find((t) => t.id === activeTag) || TAGS[0];

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border-2.5 border-[#161514] shadow-[4px_4px_0px_0px_rgba(22,21,20,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all my-4 space-y-3.5">
      
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#161514]/15 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-amber-400 border-2 border-[#161514] flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]">
            <StickyNote className="h-5 w-5 stroke-[2.5] text-[#161514]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-[#161514] uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
              QUICK THOUGHTS & SCRATCHPAD
            </h3>
            <p className="text-[10px] font-bold text-[#161514]/70">
              Jot down quick reminders, drafts, or ideas — auto-saved locally!
            </p>
          </div>
        </div>

        {/* Tag Pill Badges */}
        <div className="flex items-center gap-1 flex-wrap">
          {TAGS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTagChange(t.id)}
              className={cn(
                "px-2 py-0.5 rounded-lg text-[9px] font-black border border-[#161514] transition-all cursor-pointer",
                activeTag === t.id
                  ? `${t.color} shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]`
                  : "bg-cream-bg/60 text-[#161514]/60 hover:bg-cream-bg"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Text Area */}
      <div className="relative">
        <textarea
          value={note}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder="Type your thoughts, quick copy text, meeting notes, or daily reminder here..."
          rows={4}
          className="w-full bg-[#FAF8F5] rounded-2xl p-3.5 border-2 border-[#161514] text-xs sm:text-sm font-bold text-[#161514] placeholder-[#161514]/40 outline-none focus:ring-2 focus:ring-[#CEF431] shadow-[inner_0px_2px_4px_rgba(0,0,0,0.05)] resize-y min-h-[110px]"
        />

        {/* Auto-saved indicator */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded-md border border-[#161514] text-[9px] font-black text-[#161514]/80 shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] pointer-events-none">
          <Sparkles className="h-2.5 w-2.5 text-amber-500" />
          <span>{lastSaved ? `Saved ${lastSaved}` : "Auto-saved locally"}</span>
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <span className={cn("text-[9px] font-black px-2.5 py-1 rounded-xl border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]", currentTagObj.color)}>
          Tag: {currentTagObj.label}
        </span>

        <div className="flex items-center gap-2">
          {note.trim().length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="bg-rose-100 hover:bg-rose-200 text-rose-900 border-2 border-[#161514] px-2.5 py-1.5 rounded-xl text-xs font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all flex items-center gap-1"
              title="Clear scratchpad"
            >
              <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyToClipboard}
            className="bg-[#CEF431] hover:bg-[#bce028] text-[#161514] border-2 border-[#161514] px-3.5 py-1.5 rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all flex items-center gap-1.5"
          >
            {isCopied ? <Check className="h-4 w-4 stroke-[3] text-emerald-700" /> : <Copy className="h-4 w-4 stroke-[2.5]" />}
            <span>{isCopied ? "Copied!" : "Copy to Clipboard"}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
