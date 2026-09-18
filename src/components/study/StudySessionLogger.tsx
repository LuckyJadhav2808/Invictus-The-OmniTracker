"use client";

import { useState } from "react";
import { Clock, X } from "lucide-react";
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
    { score: 5, label: "Peak Focus 🔥", icon: "🤩", bg: "bg-[#03D26F] text-[#161514]" },
    { score: 4, label: "Good Flow 👍", icon: "😃", bg: "bg-[#CEF431] text-[#161514]" },
    { score: 3, label: "Moderate 😐", icon: "😐", bg: "bg-[#FACC15] text-[#161514]" },
    { score: 2, label: "Distracted 🥱", icon: "😟", bg: "bg-[#FB923C] text-[#161514]" },
    { score: 1, label: "Struggled 😫", icon: "😫", bg: "bg-[#F87171] text-[#161514]" },
  ];

  return (
    <div className="my-4">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full bg-[#C084FC] hover:bg-[#A855F7] text-[#161514] font-black text-xs uppercase py-3.5 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all flex items-center justify-center gap-2 tracking-wider"
        >
          <Clock className="h-4 w-4 stroke-[2.5]" /> Log Study Session
        </button>
      ) : (
        <div className="bg-white rounded-3xl p-5 md:p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs md:text-sm font-black text-[#161514] uppercase tracking-wider flex items-center gap-2 font-heading">
              <Clock className="h-4 w-4 stroke-[2.5]" /> Log Study Session
            </h4>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="bg-[#FED7AA] hover:bg-[#FDBA74] text-[#161514] p-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              title="Close form"
            >
              <X className="h-4 w-4 stroke-[3]" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-[#161514] tracking-wider block">Duration (Hours / Mins)</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="1"
                    className="w-full bg-[#FFFDF8] rounded-xl border-2 border-[#161514] px-2.5 py-1.5 text-xs font-black text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] transition-all"
                  />
                  <span className="text-xs font-black text-[#161514]">h</span>
                  <input
                    type="number"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    placeholder="30"
                    className="w-full bg-[#FFFDF8] rounded-xl border-2 border-[#161514] px-2.5 py-1.5 text-xs font-black text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] transition-all"
                  />
                  <span className="text-xs font-black text-[#161514]">m</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[#161514] tracking-wider block mb-1">Topic / Chapter Studied</label>
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
                <label className="text-[10px] font-black uppercase text-[#161514] tracking-wider block">PYQs / Questions Solved</label>
                <input
                  type="number"
                  value={questionsSolved}
                  onChange={(e) => setQuestionsSolved(e.target.value)}
                  placeholder="15"
                  className="w-full bg-[#FFFDF8] rounded-xl border-2 border-[#161514] px-3 py-1.5 text-xs font-black text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] transition-all mt-1"
                />
              </div>
            </div>

            {/* Satisfaction Rate Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[#161514] tracking-wider block">Focus Rating</label>
              <div className="grid grid-cols-5 gap-2">
                {satisfactionLabels.map((s) => {
                  const isSelected = satisfactionRate === s.score;
                  return (
                    <button
                      key={s.score}
                      type="button"
                      onClick={() => setSatisfactionRate(s.score)}
                      className={cn(
                        "p-2 rounded-xl text-center border-2 border-[#161514] cursor-pointer transition-all flex flex-col items-center gap-1 shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
                        isSelected
                          ? cn(s.bg, "ring-2 ring-[#161514]")
                          : "bg-[#FFFDF8] text-[#161514] hover:bg-[#FFF9EA]"
                      )}
                    >
                      <span className="text-lg">{s.icon}</span>
                      <span className="text-[9px] font-black truncate w-full tracking-tight">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Session Notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-[#161514] tracking-wider block">Session Key Notes (optional)</label>
              <input
                type="text"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="e.g. Revised TCP/IP 3-way handshake and solved 15 PYQs"
                className="w-full bg-[#FFFDF8] rounded-xl border-2 border-[#161514] px-3 py-2 text-xs font-black text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#03D26F] hover:bg-[#02B75F] text-[#161514] font-black text-xs uppercase py-3 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer tracking-wider"
            >
              Save Session Log 📚✨
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

