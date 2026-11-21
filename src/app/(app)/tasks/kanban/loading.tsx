import { TasksKanbanSkeleton } from "@/components/shared/NeobrutalistSkeleton";

/**
 * Kanban Route Loading Boundary (Zero Cumulative Layout Shift)
 * Renders the 3-column Kanban wireframe immediately during navigation.
 */
export default function KanbanRouteLoading() {
  return <TasksKanbanSkeleton />;
}
