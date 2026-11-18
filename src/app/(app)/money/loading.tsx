import { MoneyCockpitSkeleton } from "@/components/shared/NeobrutalistSkeleton";

/**
 * Money Route Loading Boundary (Zero Cumulative Layout Shift)
 * Renders the Belanje-style financial cockpit and ledger skeleton immediately
 * during Next.js App Router route transitions and initial hydration.
 */
export default function MoneyRouteLoading() {
  return <MoneyCockpitSkeleton />;
}
