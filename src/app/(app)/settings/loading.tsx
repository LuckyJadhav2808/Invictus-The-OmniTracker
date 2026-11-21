import { SettingsSkeleton } from "@/components/shared/NeobrutalistSkeleton";

/**
 * Settings Route Loading Boundary (Zero Cumulative Layout Shift)
 * Renders the studio settings canvas wireframe immediately during navigation.
 */
export default function SettingsRouteLoading() {
  return <SettingsSkeleton />;
}
