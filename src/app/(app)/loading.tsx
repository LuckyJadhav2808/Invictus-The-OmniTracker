import { SpaceCockpitSkeleton } from "@/components/shared/NeobrutalistSkeleton";

/**
 * App Route Loading Boundary
 * The user is navigating between known Spaces (Today, Money, Habits, Study, Tasks, Settings).
 * Renders the structural SpaceCockpitSkeleton with dual-theme Neobrutalist wireframes,
 * guaranteeing zero Cumulative Layout Shift (CLS = 0).
 */
export default function AppRouteLoading() {
  return <SpaceCockpitSkeleton />;
}
