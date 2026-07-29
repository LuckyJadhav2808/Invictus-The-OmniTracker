import { useQuery } from "@tanstack/react-query";
import { NutritionDishItem } from "@/app/api/nutrition/dishes/route";

interface NutritionSearchParams {
  query?: string;
  limit?: number;
}

interface NutritionApiResponse {
  success: boolean;
  totalCount: number;
  dishes: NutritionDishItem[];
}

export function useNutritionLibrary(params: NutritionSearchParams = {}) {
  const { query = "", limit = 30 } = params;

  return useQuery<NutritionApiResponse>({
    queryKey: ["nutrition-dishes-library", query, limit],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (query) searchParams.set("q", query);
      if (limit) searchParams.set("limit", String(limit));

      const res = await fetch(`/api/nutrition/dishes?${searchParams.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch nutrition dishes library");
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 15, // Cache nutrition data for 15 minutes
  });
}
