"use client";

import { useState } from "react";
import { Clock, Star, Plus, CheckCircle, Sparkles, Smile, Frown, Meh, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";

interface StudySessionLoggerProps {
  topics: any[];
  onLogSession: (data: {
    durationMinutes: number;
    topicId?: string;
    satisfactionRate: number;
    questionsSolved: number;
    notes: string;
  }) => void;
}

export function StudySessionLogger({ topics = [], onLogSession }: StudySessionLoggerProps) {
  const [hours, setHours] = useState("1");
  const [minutes, setMinutes] = useState("30");
  const [selectedTopicId, setSelectedTopicId] = useState(topics[0]?.id || "");
  const [satisfactionRate, setSatisfactionRate] = useState(5);
  const [questionsSolved, setQuestionsSolved] = useState("15");
  const [sessionNotes, setSessionNotes] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalMins = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
    if (totalMins <= 0) {
      toast.error("Please enter valid study time");
      return;
    }

    onLogSession({
      durationMinutes: totalMins,
      topicId: selectedTopicId || undefined,
      satisfactionRate,
      questionsSolved: Number(questionsSolved) || 0,
      notes: sessionNotes,
    });

    toast.success("Study Session Logged! 📚⭐");
    setIsOpen(false);
  };

  const satisfactionLabels = [
    { score: 5, label: "Peak Focus 🔥", icon: "🤩", bg: "bg-emerald-400 text-navy-950" },
    { score: 4, label: "Good Flow 👍", icon: "😃", bg: "bg-amber-300 text-navy-950" },
    { score: 3, label: "Moderate 😐", icon: "😐", bg: "bg-yellow-300 text-navy-950" },
    { score: 2, label: "Distracted 🥱", icon: "😟", bg: "bg-orange-300 text-navy-950" },
    { score: 1, label: "Struggled 😫", icon: "😫", bg: "bg-rose-400 text-navy-950" },
  ];

  return (
    <div className="my-4">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full bg-amber-400 hover:bg-amber-500 text-navy-950 font-black text-xs uppercase py-3 rounded-2xl border-2 border-navy-950 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center gap-2"
        >
          <Clock className="h-4 w-4 stroke-[2.5]" /> Log Study Session & Satisfaction Rate
        </button>
      ) : (
        <div className="bg-white rounded-3xl p-5 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-navy-950 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 stroke-[2.5]" /> Log Study Session & Quality Rating
            </h4>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="bg-rose-100 hover:bg-rose-300 text-[#161514] p-1 rounded-xl border-2 border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              title="Close form"
            >
              <X className="h-4 w-4 stroke-[3]" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[9px] font-black uppercase text-navy-700 block">Duration (Hours / Mins)</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="1"
                    className="w-full bg-cream-bg rounded-xl border-2 border-navy-950 px-2.5 py-1 text-xs font-black text-navy-950 outline-none"
                  />
                  <span className="text-xs font-black">h</span>
                  <input
                    type="number"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    placeholder="30"
                    className="w-full bg-cream-bg rounded-xl border-2 border-navy-950 px-2.5 py-1 text-xs font-black text-navy-950 outline-none"
                  />
                  <span className="text-xs font-black">m</span>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-navy-700 block mb-1">Topic / Chapter Studied</label>
                <NeobrutalistSelect
                  value={selectedTopicId}
                  onChange={setSelectedTopicId}
                  options={
                    topics.length > 0
                      ? topics.map((t) => ({
                          value: t.id,
                          label: t.title,
                          icon: "📚",
                        }))
                      : [{ value: "", label: "General Study", icon: "📖" }]
                  }
                  placeholder="Select Topic"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-navy-700 block">PYQs / Questions Solved</label>
                <input
                  type="number"
                  value={questionsSolved}
                  onChange={(e) => setQuestionsSolved(e.target.value)}
                  placeholder="15"
                  className="w-full bg-cream-bg rounded-xl border-2 border-navy-950 px-3 py-1.5 text-xs font-black text-navy-950 outline-none mt-1"
                />
              </div>
            </div>

            {/* Satisfaction Rate Selector */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-navy-700 block">Session Satisfaction Rate</label>
              <div className="grid grid-cols-5 gap-2">
                {satisfactionLabels.map((s) => {
                  const isSelected = satisfactionRate === s.score;
                  return (
                    <button
                      key={s.score}
                      type="button"
                      onClick={() => setSatisfactionRate(s.score)}
                      className={cn(
                        "p-2 rounded-xl text-center border-2 border-navy-950 cursor-pointer transition-all flex flex-col items-center gap-0.5 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]",
                        isSelected
                          ? s.bg
                          : "bg-white text-navy-950 hover:bg-cream-bg"
                      )}
                    >
                      <span className="text-base">{s.icon}</span>
                      <span className="text-[9px] font-black truncate w-full">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Session Notes */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-navy-700 block">Session Key Notes (optional)</label>
              <input
                type="text"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="e.g. Revised TCP/IP 3-way handshake and solved 15 PYQs"
                className="w-full bg-cream-bg rounded-xl border-2 border-navy-950 px-3 py-1.5 text-xs font-black text-navy-950 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-400 hover:bg-emerald-500 text-navy-950 font-black text-xs uppercase py-2.5 rounded-2xl border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] cursor-pointer"
            >
              Save Session Log 📚✨
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
