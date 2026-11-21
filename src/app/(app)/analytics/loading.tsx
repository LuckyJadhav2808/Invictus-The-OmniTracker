import { AnalyticsSkeleton } from "@/components/shared/NeobrutalistSkeleton";

/**
 * Analytics Route Loading Boundary (Zero Cumulative Layout Shift)
 * Renders the studio analytics canvas wireframe immediately during navigation.
 */
export default function AnalyticsRouteLoading() {
  return <AnalyticsSkeleton />;
}
