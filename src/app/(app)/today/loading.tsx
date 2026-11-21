import { TodayCockpitSkeleton } from "@/components/shared/NeobrutalistSkeleton";

/**
 * Today Route Loading Boundary (Zero Cumulative Layout Shift)
 * Renders the 5-slot Cockpit wireframe immediately during navigation.
 */
export default function TodayRouteLoading() {
  return <TodayCockpitSkeleton />;
}
