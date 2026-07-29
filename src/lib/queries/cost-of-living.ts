import { useQuery } from "@tanstack/react-query";
import { CostOfLivingCountryItem } from "@/app/api/money/cost-of-living/route";

interface CostOfLivingResponse {
  success: boolean;
  totalCount: number;
  countries: CostOfLivingCountryItem[];
}

export function useCostOfLivingIndex() {
  return useQuery<CostOfLivingResponse>({
    queryKey: ["cost-of-living-countries"],
    queryFn: async () => {
      const res = await fetch("/api/money/cost-of-living");
      if (!res.ok) {
        throw new Error("Failed to fetch cost of living index");
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}
