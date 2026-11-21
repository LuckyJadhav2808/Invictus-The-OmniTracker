"use client";

import { useRouter } from "next/navigation";
import { Kanban, Flame, FolderKanban, CheckSquare } from "lucide-react";
import { DoorTileGrid, type DoorTileItem } from "@/components/shared/DoorTileGrid";

export interface TasksDoorTileRowProps {
  totalCount?: number;
  completedCount?: number;
  p1UrgentCount?: number;
  projectsCount?: number;
  onOpenKanban?: () => void;
  onOpenMatrix?: () => void;
  onOpenProjects?: () => void;
  onOpenArchive?: () => void;
  className?: string;
}

export function TasksDoorTileRow({
  completedCount = 0,
  p1UrgentCount = 0,
  projectsCount = 3,
  onOpenKanban,
  onOpenMatrix,
  onOpenProjects,
  onOpenArchive,
  className,
}: TasksDoorTileRowProps) {
  const router = useRouter();

  const tiles: DoorTileItem[] = [
    {
      id: "kanban",
      label: "Kanban",
      value: "Board",
      icon: Kanban,
      iconColorClass: "text-amber-500 dark:text-amber-400",
      bgClass: "hover:border-amber-500/50",
      onClick: onOpenKanban || (() => router.push("/tasks/kanban")),
      title: "Open Kanban Workflow Board (Dedicated Page)",
    },
    {
      id: "matrix",
      label: "Matrix",
      value: p1UrgentCount > 0 ? `${p1UrgentCount} P1` : "Urgent",
      icon: Flame,
      iconColorClass: "text-rose-500 dark:text-rose-400",
      bgClass: "hover:border-rose-500/50",
      onClick: onOpenMatrix || (() => router.push("/tasks/matrix")),
      title: "Open Eisenhower Priority Matrix (Dedicated Page)",
    },
    {
      id: "projects",
      label: "Projects",
      value: `${projectsCount} Tags`,
      icon: FolderKanban,
      iconColorClass: "text-sky-500 dark:text-sky-400",
      bgClass: "hover:border-sky-500/50",
      onClick: onOpenProjects || (() => router.push("/tasks/projects")),
      title: "Open Project Tags & Deliverables Hub (Dedicated Page)",
    },
    {
      id: "archive",
      label: "Archive",
      value: `${completedCount} Done`,
      icon: CheckSquare,
      iconColorClass: "text-emerald-500 dark:text-emerald-400",
      bgClass: "hover:border-emerald-500/50",
      onClick: onOpenArchive || (() => router.push("/tasks/archive")),
      title: "Open Completed Task History (Dedicated Page)",
    },
  ];

  return <DoorTileGrid tiles={tiles} className={className} />;
}
