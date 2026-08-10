"use client";

import { useState, useEffect } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { TaskItem, Subtask } from "@/types";
import { Plus, Trash2, CheckCircle2, Clock, Tag, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskToEdit?: TaskItem | null;
  onSubmit: (data: Omit<TaskItem, "id" | "createdAt" | "updatedAt">) => void;
}

const PROJECT_TAGS = ["Dev", "Work", "Personal", "Study", "Health", "Life"];

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

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, title: newSubtaskTitle.trim(), completed: false },
    ]);
    setNewSubtaskTitle("");
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

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
    { id: "p1", label: "P1 - Urgent 🔥", color: "bg-rose-500 text-white border-[#161514]" },
    { id: "p2", label: "P2 - High 🟠", color: "bg-amber-400 text-[#161514] border-[#161514]" },
    { id: "p3", label: "P3 - Medium 🟡", color: "bg-yellow-300 text-[#161514] border-[#161514]" },
    { id: "p4", label: "P4 - Low 🔵", color: "bg-sky-300 text-[#161514] border-[#161514]" },
  ];

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title={taskToEdit ? "Edit Task & Checklist" : "Create New Production Task"}
      description="Set priority matrix, due dates, project tag, and subtasks."
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        {/* Task Title */}
        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-wider text-[#161514]">
            Task Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Ship GATE Maths PYQ Revision Notes"
            className="w-full bg-[#FAF8F5] rounded-2xl p-3 border-2 border-[#161514] text-xs sm:text-sm font-bold text-[#161514] outline-none focus:ring-2 focus:ring-[#CEF431]"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-wider text-[#161514]">
            Description / Context
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add key objectives, links, or notes..."
            rows={2}
            className="w-full bg-[#FAF8F5] rounded-2xl p-3 border-2 border-[#161514] text-xs font-bold text-[#161514] outline-none focus:ring-2 focus:ring-[#CEF431] resize-none"
          />
        </div>

        {/* Priority Matrix Selector */}
        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-wider text-[#161514]">
            Priority Level
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {priorityOptions.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPriority(p.id as TaskItem["priority"])}
                className={cn(
                  "p-2 rounded-xl text-[10px] sm:text-xs font-black border-2 transition-all cursor-pointer text-center",
                  priority === p.id
                    ? `${p.color} shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] scale-[1.02]`
                    : "bg-white text-[#161514]/70 border-[#161514]/20 hover:border-[#161514]"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status & Project Tag */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-[#161514]">
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
            <label className="text-xs font-black uppercase tracking-wider text-[#161514]">
              Project Label
            </label>
            <div className="flex flex-wrap gap-1 mt-1">
              {PROJECT_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setProjectTag(tag)}
                  className={cn(
                    "px-2.5 py-1 rounded-xl text-[10px] font-black border-1.5 border-[#161514] transition-all cursor-pointer",
                    projectTag === tag
                      ? "bg-[#CEF431] text-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]"
                      : "bg-white text-[#161514]/70 hover:bg-[#FAF8F5]"
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
            <label className="text-[10px] font-black uppercase text-[#161514] block">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-white rounded-xl p-2 border-2 border-[#161514] text-[11px] font-bold text-[#161514]"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-[#161514] block">Due Time</label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full bg-white rounded-xl p-2 border-2 border-[#161514] text-[11px] font-bold text-[#161514]"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-[#161514] block">Est Mins</label>
            <input
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              placeholder="60"
              className="w-full bg-white rounded-xl p-2 border-2 border-[#161514] text-[11px] font-bold text-[#161514]"
            />
          </div>
        </div>

        {/* Subtasks Checklist Builder */}
        <div className="space-y-2 pt-2 border-t border-[#161514]/15">
          <label className="text-xs font-black uppercase tracking-wider text-[#161514] flex items-center justify-between">
            <span>Subtasks / Checklist ({subtasks.length})</span>
            <span className="text-[10px] font-bold text-[#161514]/60">Break down your task</span>
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
              className="flex-1 bg-white rounded-xl p-2 border-2 border-[#161514] text-xs font-bold text-[#161514] outline-none"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              className="bg-amber-400 hover:bg-amber-500 text-[#161514] border-2 border-[#161514] p-2 rounded-xl font-black shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
            </button>
          </div>

          {subtasks.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 pt-1">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between gap-2 p-2 bg-[#FAF8F5] rounded-xl border border-[#161514] text-xs font-bold text-[#161514]"
                >
                  <span className="truncate">▪ {st.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(st.id)}
                    className="text-rose-600 hover:text-rose-800 p-0.5 cursor-pointer shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form CTA Buttons */}
        <div className="pt-3 border-t-2 border-[#161514]/15 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl bg-white text-[#161514] font-black text-xs border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] cursor-pointer hover:bg-cream-bg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#d98206] text-white font-black text-xs uppercase tracking-wider border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>{taskToEdit ? "Save Changes" : "Create Task"}</span>
          </button>
        </div>
      </form>
    </ResponsiveFormContainer>
  );
}
