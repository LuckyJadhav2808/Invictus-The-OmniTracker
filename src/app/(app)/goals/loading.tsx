import { HabitsCockpitSkeleton } from "@/components/shared/NeobrutalistSkeleton";

/**
 * Goals/Habits Route Loading Boundary (Zero Cumulative Layout Shift)
 * Renders the 5-slot Habits Cockpit wireframe immediately during navigation.
 */
export default function GoalsRouteLoading() {
  return <HabitsCockpitSkeleton />;
}
