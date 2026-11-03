"use client";

import { useState, useEffect } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { TaskItem, Subtask } from "@/types";
import { Plus, Trash2, CheckCircle2, Clock, Tag, AlertCircle, Sparkles, Flame, AlertTriangle, CircleDot, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

interface NewTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskToEdit?: TaskItem | null;
  onSubmit: (data: Omit<TaskItem, "id" | "createdAt" | "updatedAt">) => void;
}

const PROJECT_TAGS = ["Dev", "Work", "Personal", "Study", "Health", "Life"];

const TASK_STARTER_PRESETS = [
  {
    label: "Ship API Endpoint",
    title: "Ship Auth & Data Sync API Endpoints",
    desc: "Draft clean routes, input validation, and unit tests",
    tag: "Dev",
    priority: "p2" as const,
    estMinutes: 60,
    subtasks: [
      { id: "st_1", title: "Define Zod request schema", completed: false },
      { id: "st_2", title: "Implement route handler & DB query", completed: false },
      { id: "st_3", title: "Write Vitest integration test", completed: false },
    ],
  },
  {
    label: "Exam Prep",
    title: "Computer Networks & OS Revision",
    desc: "Deep study session with past year questions",
    tag: "Study",
    priority: "p1" as const,
    estMinutes: 90,
    subtasks: [
      { id: "st_1", title: "Review lecture slides & notes", completed: false },
      { id: "st_2", title: "Solve 5 PYQ problems", completed: false },
      { id: "st_3", title: "Build formula summary sheet", completed: false },
    ],
  },
  {
    label: "Resume Polish",
    title: "Polish Tech Resume & Portfolio",
    desc: "Add metrics, recent production projects, and clean links",
    tag: "Work",
    priority: "p2" as const,
    estMinutes: 45,
    subtasks: [
      { id: "st_1", title: "Quantify impact bullets on top project", completed: false },
      { id: "st_2", title: "Export clean PDF & review links", completed: false },
    ],
  },
  {
    label: "Desk Reset",
    title: "Weekly Room & Desk Clean Reset",
    desc: "Clear physical clutter to maintain mental focus",
    tag: "Life",
    priority: "p3" as const,
    estMinutes: 30,
    subtasks: [
      { id: "st_1", title: "Clear desk surface & cable clutter", completed: false },
      { id: "st_2", title: "Wash water bottle & wipe laptop screen", completed: false },
    ],
  },
];

export function NewTaskModal({ open, onOpenChange, taskToEdit, onSubmit }: NewTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskItem["status"]>("todo");
  const [priority, setPriority] = useState<TaskItem["priority"]>("p2");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueTime, setDueTime] = useState("18:00");
  const [projectTag, setProjectTag] = useState("Dev");
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || "");
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority);
      setDueDate(taskToEdit.dueDate || new Date().toISOString().split("T")[0]);
      setDueTime(taskToEdit.dueTime || "18:00");
      setProjectTag(taskToEdit.projectTag || "Dev");
      setEstimatedMinutes(taskToEdit.estimatedMinutes || 60);
      setSubtasks(taskToEdit.subtasks || []);
    } else {
      setTitle("");
      setDescription("");
      setStatus("todo");
      setPriority("p2");
      setDueDate(new Date().toISOString().split("T")[0]);
      setDueTime("18:00");
      setProjectTag("Dev");
      setEstimatedMinutes(60);
      setSubtasks([]);
    }
  }, [taskToEdit, open]);

  const handleApplyPreset = (preset: typeof TASK_STARTER_PRESETS[number]) => {
    soundFX.playPop();
    soundFX.vibrate(15);
    setTitle(preset.title);
    setDescription(preset.desc);
    setProjectTag(preset.tag);
    setPriority(preset.priority);
    setEstimatedMinutes(preset.estMinutes);
    setSubtasks(
      preset.subtasks.map((st) => ({
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: st.title,
        completed: false,
      }))
    );
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    soundFX.playPop();
    setSubtasks((prev) => [
      ...prev,
      { id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, title: newSubtaskTitle.trim(), completed: false },
    ]);
    setNewSubtaskTitle("");
  };

  const handleRemoveSubtask = (id: string) => {
    soundFX.playPop();
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    soundFX.playCompleteChime();
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate,
      dueTime,
      projectTag,
      estimatedMinutes: Number(estimatedMinutes) || 30,
      loggedMinutes: taskToEdit?.loggedMinutes || 0,
      subtasks,
    });

    onOpenChange(false);
  };

  const priorityOptions = [
    { id: "p1", label: "P1 Urgent", icon: Flame, color: "bg-rose-500 text-white border-rose-600" },
    { id: "p2", label: "P2 High", icon: AlertTriangle, color: "bg-amber-400 text-[#161514] border-amber-500" },
    { id: "p3", label: "P3 Medium", icon: CircleDot, color: "bg-yellow-300 text-[#161514] border-yellow-400" },
    { id: "p4", label: "P4 Low", icon: ArrowDown, color: "bg-sky-300 text-[#161514] border-sky-400" },
  ];

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title={taskToEdit ? "Edit Task & Checklist" : "Create New Production Task"}
      description="Set priority matrix, due dates, project tag, and subtasks."
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        {/* 1-Tap Quick Starter Presets Banner (Only on create mode when blank) */}
        {!taskToEdit && !title && (
          <div className="space-y-1.5 pb-1">
            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#161514]/60 dark:text-[#FAF8F5]/60 flex items-center gap-1">
              <span>Quick Starters (1-Tap Fill)</span>
              <Sparkles className="size-3 text-amber-500" />
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TASK_STARTER_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1C1A18] hover:bg-[#CEF431] dark:hover:bg-[#CEF431] hover:text-[#161514] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#2A2724] text-[11px] font-bold shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer font-heading flex items-center gap-1"
                >
                  <span>{preset.label}</span>
                  <span className="text-[9px] opacity-70 font-mono">({preset.estMinutes}m)</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Task Title */}
        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]/80">
            Task Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Ship GATE Maths PYQ Revision Notes"
            className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] text-base sm:text-sm font-medium text-[#161514] dark:text-[#FAF8F5] placeholder:text-[#161514]/40 dark:placeholder:text-[#FAF8F5]/30 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]/80">
            Description / Context
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add key objectives, links, or notes..."
            rows={2}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] text-base sm:text-sm font-medium text-[#161514] dark:text-[#FAF8F5] placeholder:text-[#161514]/40 dark:placeholder:text-[#FAF8F5]/30 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all resize-none min-h-[70px]"
          />
        </div>

        {/* Priority Matrix Selector */}
        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]/80">
            Priority Level
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {priorityOptions.map((p) => {
              const Icon = p.icon;
              const isSelected = priority === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setPriority(p.id as TaskItem["priority"]);
                  }}
                  className={cn(
                    "p-2.5 rounded-xl text-[10px] sm:text-xs font-bold border transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-xs hover:-translate-y-0.5 active:translate-y-0",
                    isSelected
                      ? `${p.color} -translate-y-0.5 font-black`
                      : "bg-white dark:bg-[#1C1A18] text-[#161514]/70 dark:text-[#FAF8F5]/70 border-[#E8E5DF] dark:border-[#2A2724] hover:bg-[#FAF8F5] dark:hover:bg-[#252321]"
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status & Project Tag */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]/80">
              Kanban Status
            </label>
            <NeobrutalistSelect
              value={status}
              onChange={(val) => setStatus(val as TaskItem["status"])}
              options={[
                { value: "backlog", label: "Backlog", icon: "📥" },
                { value: "todo", label: "To Do", icon: "⏳" },
                { value: "in_progress", label: "In Progress", icon: "⚡" },
                { value: "review", label: "Under Review", icon: "👀" },
                { value: "completed", label: "Completed", icon: "✅" },
              ]}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]/80">
              Project Label
            </label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {PROJECT_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setProjectTag(tag);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-xs",
                    projectTag === tag
                      ? "bg-[#CEF431] text-[#161514] border-[#CEF431] font-black -translate-y-0.5"
                      : "bg-white dark:bg-[#1C1A18] text-[#161514]/70 dark:text-[#FAF8F5]/70 hover:bg-[#FAF8F5] dark:hover:bg-[#252321] border-[#E8E5DF] dark:border-[#2A2724]"
                  )}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Due Date, Time & Estimated Minutes */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] font-black uppercase text-[#161514] dark:text-[#FAF8F5]/80 block">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1C1A18] rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] text-xs font-mono font-bold text-[#161514] dark:text-[#FAF8F5] shadow-xs focus:outline-none focus:ring-1 focus:ring-[#CEF431]"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-[#161514] dark:text-[#FAF8F5]/80 block">Due Time</label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1C1A18] rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] text-xs font-mono font-bold text-[#161514] dark:text-[#FAF8F5] shadow-xs focus:outline-none focus:ring-1 focus:ring-[#CEF431]"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-[#161514] dark:text-[#FAF8F5]/80 block">Est Mins</label>
            <input
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              placeholder="60"
              className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1C1A18] rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] text-xs font-mono font-bold text-[#161514] dark:text-[#FAF8F5] shadow-xs focus:outline-none focus:ring-1 focus:ring-[#CEF431]"
            />
          </div>
        </div>

        {/* Subtasks Checklist Builder */}
        <div className="space-y-2 pt-2 border-t border-[#E8E5DF] dark:border-[#2A2724]">
          <label className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center justify-between">
            <span>Subtasks / Checklist ({subtasks.length})</span>
            <span className="text-[10px] font-bold text-[#161514]/60 dark:text-[#FAF8F5]/60">Break down your task</span>
          </label>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              placeholder="Add checklist step..."
              className="flex-1 px-3 py-1.5 bg-white dark:bg-[#1C1A18] rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] text-xs font-medium text-[#161514] dark:text-[#FAF8F5] placeholder:text-[#161514]/40 dark:placeholder:text-[#FAF8F5]/30 shadow-xs outline-none focus:ring-1 focus:ring-[#CEF431]"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              className="bg-[#CEF431] hover:bg-[#bce028] text-[#161514] border border-[#CEF431] p-2 rounded-lg font-black shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
            </button>
          </div>

          {subtasks.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 pt-1">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between gap-2 p-2 bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] text-xs font-medium text-[#161514] dark:text-[#FAF8F5] shadow-xs"
                >
                  <span className="truncate">▪ {st.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(st.id)}
                    className="text-rose-600 dark:text-rose-400 hover:text-rose-800 p-0.5 cursor-pointer shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form CTA Buttons */}
        <div className="pt-3 border-t border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] font-black text-xs uppercase tracking-wider border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs cursor-pointer hover:bg-[#FAF8F5] dark:hover:bg-[#252321] active:translate-y-0.5 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#03D26F] hover:bg-[#02b35d] text-[#161514] font-black text-xs uppercase tracking-wider border border-[#03D26F] shadow-xs active:translate-y-0.5 cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>{taskToEdit ? "Save Changes" : "Create Task"}</span>
          </button>
        </div>
      </form>
    </ResponsiveFormContainer>
  );
}
