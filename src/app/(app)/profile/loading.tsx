import { ProfileSkeleton } from "@/components/shared/NeobrutalistSkeleton";

/**
 * Profile Route Loading Boundary (Zero Cumulative Layout Shift)
 * Renders the studio profile canvas wireframe immediately during navigation.
 */
export default function ProfileRouteLoading() {
  return <ProfileSkeleton />;
}
