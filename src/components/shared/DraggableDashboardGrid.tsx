"use client";

import { useState, useEffect, ReactNode, DragEvent } from "react";
import { GripVertical, ArrowUp, ArrowDown, RotateCcw, Sparkles, Edit3, Check, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface DashboardWidget {
  id: string;
  title: string;
  category?: "today" | "goals" | "study" | "money";
  component: ReactNode;
}

interface DraggableDashboardGridProps {
  storageKey: string;
  widgets: DashboardWidget[];
  availableWidgets?: DashboardWidget[];
  className?: string;
}

export function DraggableDashboardGrid({
  storageKey,
  widgets,
  availableWidgets = [],
  className,
}: DraggableDashboardGridProps) {
  const allKnownWidgets = [...widgets, ...availableWidgets.filter((aw) => !widgets.some((w) => w.id === aw.id))];
  const widgetMap = new Map(allKnownWidgets.map((w) => [w.id, w]));

  const [orderedIds, setOrderedIds] = useState<string[]>(() => widgets.map((w) => w.id));
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Load saved order from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`invictus_layout_${storageKey}`);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        const validSaved = parsed.filter((id) => widgetMap.has(id));
        setOrderedIds(validSaved);
      } else {
        setOrderedIds(widgets.map((w) => w.id));
      }
    } catch {
      setOrderedIds(widgets.map((w) => w.id));
    }
  }, [storageKey]);

  const saveOrder = (newOrder: string[]) => {
    setOrderedIds(newOrder);
    try {
      localStorage.setItem(`invictus_layout_${storageKey}`, JSON.stringify(newOrder));
    } catch {}
  };

  const moveWidget = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= orderedIds.length) return;
    const updated = [...orderedIds];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    saveOrder(updated);
    toast.success("Dashboard Layout Updated & Saved! 📐✨");
  };

  const addWidget = (widgetId: string) => {
    if (orderedIds.includes(widgetId)) return;
    const updated = [...orderedIds, widgetId];
    saveOrder(updated);
    toast.success(`Pinned ${widgetMap.get(widgetId)?.title || "Widget"} to Dashboard! 📌✨`);
  };

  const removeWidget = (widgetId: string) => {
    const updated = orderedIds.filter((id) => id !== widgetId);
    saveOrder(updated);
    toast.info("Widget unpinned from Dashboard");
  };

  const resetLayout = () => {
    const defaultOrder = widgets.map((w) => w.id);
    saveOrder(defaultOrder);
    toast.info("Layout reset to default 🔄");
  };

  // Drag and Drop handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    if (!isEditMode) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, dropIndex: number) => {
    if (!isEditMode) return;
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    moveWidget(draggedIndex, dropIndex);
    setDraggedIndex(null);
  };

  return (
    <div className={cn("space-y-4 my-4", className)}>
      {/* Customize Layout Edit Mode Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between px-1 py-1 gap-2">
        <div>
          {isEditMode ? (
            <span className="bg-[#CEF431] text-[#161514] px-3 py-1 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1 border border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]">
              <Sparkles className="h-3.5 w-3.5" /> Reordering & Customize Active
            </span>
          ) : (
            <span className="text-[11px] font-black uppercase tracking-wider text-[#161514]/60">
              Dashboard Sections
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isEditMode && availableWidgets.length > 0 && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs font-black text-[#161514] bg-[#CEF431] hover:bg-[#03D26F] px-3.5 py-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] cursor-pointer transition-all flex items-center gap-1 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" /> Add Widgets from Spaces
            </button>
          )}

          {isEditMode && (
            <button
              type="button"
              onClick={resetLayout}
              className="text-xs font-black text-[#161514] bg-white hover:bg-amber-100 px-3 py-1 rounded-xl border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] cursor-pointer transition-all flex items-center gap-1"
              title="Reset default component order"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              const next = !isEditMode;
              setIsEditMode(next);
              if (!next) toast.success("Dashboard Layout Saved! 📐✨");
            }}
            className={cn(
              "text-xs font-black px-3.5 py-1.5 rounded-xl border-2 border-[#161514] transition-all cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5",
              isEditMode
                ? "bg-[#161514] text-[#CEF431] hover:bg-[#014651]"
                : "bg-white hover:bg-[#CEF431] text-[#161514]"
            )}
          >
            {isEditMode ? (
              <>
                <Check className="h-3.5 w-3.5 stroke-[3]" />
                <span>Done Customizing</span>
              </>
            ) : (
              <>
                <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Customize Layout</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal / Drawer for Pinned Widgets Selection */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#161514]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 border-2.5 border-[#161514] shadow-[6px_6px_0px_0px_rgba(22,21,20,1)] max-w-lg w-full space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-[#161514]/15 pb-3">
              <div>
                <h3 className="text-base font-black text-[#161514] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" /> Pin Widgets to Today's Dashboard
                </h3>
                <p className="text-xs text-[#161514]/70 font-bold mt-0.5">
                  Select components from Goals, Study, and Money spaces to pin to Today
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl hover:bg-[#EAF4F4] text-[#161514] transition-colors"
              >
                <X className="h-5 w-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="space-y-3">
              {allKnownWidgets.map((w) => {
                const isPinned = orderedIds.includes(w.id);
                return (
                  <div
                    key={w.id}
                    className="p-3.5 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] flex items-center justify-between gap-3 bg-white hover:bg-[#EAF4F4]/50 transition-all"
                  >
                    <div>
                      <span className="text-xs font-black uppercase text-[#161514] block">
                        {w.title}
                      </span>
                      {w.category && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-[#CEF431] text-[#161514] border border-[#161514] inline-block mt-1">
                          {w.category} Space
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (isPinned) {
                          removeWidget(w.id);
                        } else {
                          addWidget(w.id);
                        }
                      }}
                      className={cn(
                        "text-xs font-black px-3 py-1.5 rounded-xl border-2 border-[#161514] transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] flex items-center gap-1",
                        isPinned
                          ? "bg-emerald-300 hover:bg-rose-300 text-[#161514]"
                          : "bg-[#CEF431] hover:bg-[#03D26F] text-[#161514]"
                      )}
                    >
                      {isPinned ? (
                        <>
                          <Check className="h-3.5 w-3.5 stroke-[3]" /> Pinned
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5 stroke-[3]" /> Pin to Today
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#161514] text-white font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ordered Widgets */}
      {orderedIds.map((id, index) => {
        const item = widgetMap.get(id);
        if (!item) return null;

        const isFirst = index === 0;
        const isLast = index === orderedIds.length - 1;

        return (
          <div
            key={id}
            id={id}
            draggable={isEditMode}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={cn(
              "group relative transition-all duration-300",
              draggedIndex === index && "opacity-40 scale-[0.98]"
            )}
          >
            {/* Edit Mode Controls (Only visible when isEditMode is TRUE) */}
            {isEditMode && (
              <div className="flex flex-wrap items-center justify-between bg-[#161514] text-white px-4 py-2.5 rounded-t-3xl border-2 border-b-0 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] select-none gap-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1 bg-[#CEF431] text-[#161514] px-2 py-0.5 rounded-lg cursor-grab active:cursor-grabbing font-black text-[10px] border border-[#161514] shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]">
                    <GripVertical className="h-3.5 w-3.5 text-[#161514] stroke-[3]" />
                    <span>DRAG</span>
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => moveWidget(index, index - 1)}
                    disabled={isFirst}
                    className="bg-white hover:bg-[#03D26F] disabled:opacity-40 text-[#161514] font-black text-[10px] px-2 py-0.5 rounded-lg border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] cursor-pointer flex items-center gap-1"
                  >
                    <ArrowUp className="h-3 w-3 stroke-[3]" /> UP
                  </button>
                  <button
                    type="button"
                    onClick={() => moveWidget(index, index + 1)}
                    disabled={isLast}
                    className="bg-white hover:bg-[#03D26F] disabled:opacity-40 text-[#161514] font-black text-[10px] px-2 py-0.5 rounded-lg border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] cursor-pointer flex items-center gap-1"
                  >
                    <ArrowDown className="h-3 w-3 stroke-[3]" /> DOWN
                  </button>
                  <button
                    type="button"
                    onClick={() => removeWidget(id)}
                    className="bg-rose-100 hover:bg-rose-300 text-rose-800 font-black text-[10px] p-1 rounded-lg border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] cursor-pointer"
                    title="Unpin widget from dashboard"
                  >
                    <Trash2 className="h-3 w-3 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )}

            {/* Widget Component Content */}
            <div className={cn("transition-all", isEditMode && "rounded-b-2xl border-2 border-t-0 border-[#161514]")}>
              {item.component}
            </div>
          </div>
        );
      })}
    </div>
  );
}
