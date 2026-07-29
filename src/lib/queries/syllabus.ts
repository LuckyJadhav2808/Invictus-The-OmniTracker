import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExamPreset } from "@/app/api/study/syllabus/route";

interface SyllabusPresetsResponse {
  success: boolean;
  totalPresets: number;
  presets: ExamPreset[];
}

export function useExamSyllabusPresets() {
  return useQuery<SyllabusPresetsResponse>({
    queryKey: ["exam-syllabus-presets"],
    queryFn: async () => {
      const res = await fetch("/api/study/syllabus");
      if (!res.ok) {
        throw new Error("Failed to fetch exam syllabus presets");
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 60, // Cache 1 hour
  });
}

export function useGenerateExamSyllabus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId = "guest", examId }: { userId?: string; examId: string }) => {
      const res = await fetch("/api/study/syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, examId }),
      });
      if (!res.ok) {
        throw new Error("Failed to generate exam syllabus");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["allTopics"] });
    },
  });
}
