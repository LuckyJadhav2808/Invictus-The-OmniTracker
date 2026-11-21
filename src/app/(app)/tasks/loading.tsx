import { TasksCockpitSkeleton } from "@/components/shared/NeobrutalistSkeleton";

/**
 * Tasks Route Loading Boundary (Zero Cumulative Layout Shift)
 * Renders the Studio Cockpit & Rapid Task Dock wireframe immediately during navigation.
 */
export default function TasksRouteLoading() {
  return <TasksCockpitSkeleton />;
}
