"use client";

import { Kanban, Flame, FolderKanban, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

export interface TasksDoorTileRowProps {
  totalCount?: number;
  completedCount?: number;
  p1UrgentCount?: number;
  projectsCount?: number;
  onOpenKanban: () => void;
  onOpenMatrix: () => void;
  onOpenProjects: () => void;
  onOpenArchive: () => void;
  className?: string;
}

export function TasksDoorTileRow({
  totalCount = 0,
  completedCount = 0,
  p1UrgentCount = 0,
  projectsCount = 3,
  onOpenKanban,
  onOpenMatrix,
  onOpenProjects,
  onOpenArchive,
  className,
}: TasksDoorTileRowProps) {
  const tiles = [
    {
      id: "kanban",
      label: "Kanban",
      value: "Board",
      icon: Kanban,
      iconColor: "text-amber-500 dark:text-amber-400",
      bgClass: "hover:border-amber-500/50",
      onClick: onOpenKanban,
      title: "Open Kanban Workflow Board",
    },
    {
      id: "matrix",
      label: "Matrix",
      value: p1UrgentCount > 0 ? `${p1UrgentCount} P1` : "Urgent",
      icon: Flame,
      iconColor: "text-rose-500 dark:text-rose-400",
      bgClass: "hover:border-rose-500/50",
      onClick: onOpenMatrix,
      title: "Open Eisenhower Priority Matrix",
    },
    {
      id: "projects",
      label: "Projects",
      value: `${projectsCount} Tags`,
      icon: FolderKanban,
      iconColor: "text-sky-500 dark:text-sky-400",
      bgClass: "hover:border-sky-500/50",
      onClick: onOpenProjects,
      title: "Open Project Tags & Deliverables Hub",
    },
    {
      id: "archive",
      label: "Archive",
      value: `${completedCount} Done`,
      icon: CheckSquare,
      iconColor: "text-emerald-500 dark:text-emerald-400",
      bgClass: "hover:border-emerald-500/50",
      onClick: onOpenArchive,
      title: "Open Completed Task History",
    },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-4 gap-1.5 sm:gap-2.5 lg:gap-3 w-full select-none",
        className
      )}
    >
      {tiles.map((t) => {
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              soundFX.playPop();
              soundFX.vibrate(15);
              t.onClick();
            }}
            className={cn(
              "py-2 sm:py-3 px-1 sm:px-2.5 rounded-xl sm:rounded-2xl bg-card border border-border flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-95 shadow-2xs group min-h-[58px] sm:min-h-[66px]",
              t.bgClass
            )}
            title={t.title}
            aria-label={`${t.label}: ${t.value}`}
          >
            <div className="flex items-center gap-1 mb-0.5 sm:mb-1">
              <Icon
                className={cn(
                  "size-3.5 sm:size-4 transition-transform group-hover:scale-110 shrink-0",
                  t.iconColor
                )}
              />
              <span className="font-heading font-black text-[11px] sm:text-xs text-foreground tracking-tight">
                {t.label}
              </span>
            </div>
            <span className="font-mono text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-tight truncate max-w-full leading-tight text-center block w-full mt-0.5">
              {t.value}
            </span>
          </button>
        );
      })}
    </div>
  );
}
