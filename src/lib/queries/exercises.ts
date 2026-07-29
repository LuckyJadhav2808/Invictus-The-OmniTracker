import { useQuery } from "@tanstack/react-query";
import { GymExerciseItem } from "@/app/api/gym/exercises/route";

interface ExerciseSearchParams {
  query?: string;
  bodyPart?: string;
  equipment?: string;
  level?: string;
  limit?: number;
}

interface ExerciseApiResponse {
  success: boolean;
  totalCount: number;
  exercises: GymExerciseItem[];
  availableBodyParts: string[];
  availableEquipment: string[];
}

export function useExerciseLibrary(params: ExerciseSearchParams = {}) {
  const { query = "", bodyPart = "", equipment = "", level = "", limit = 40 } = params;

  return useQuery<ExerciseApiResponse>({
    queryKey: ["gym-exercise-library", query, bodyPart, equipment, level, limit],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (query) searchParams.set("q", query);
      if (bodyPart && bodyPart !== "all") searchParams.set("bodyPart", bodyPart);
      if (equipment && equipment !== "all") searchParams.set("equipment", equipment);
      if (level && level !== "all") searchParams.set("level", level);
      if (limit) searchParams.set("limit", String(limit));

      const res = await fetch(`/api/gym/exercises?${searchParams.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch exercise library");
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 15, // Cache exercise data for 15 minutes
  });
}
