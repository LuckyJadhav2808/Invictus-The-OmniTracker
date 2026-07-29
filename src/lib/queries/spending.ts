import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MonthlySpendingRecord } from "@/app/api/money/spending/route";

interface SpendingApiResponse {
  success: boolean;
  totalMonths: number;
  records: MonthlySpendingRecord[];
  typicalTemplate: any[];
}

export function useMonthlySpendingDataset() {
  return useQuery<SpendingApiResponse>({
    queryKey: ["monthly-spending-dataset"],
    queryFn: async () => {
      const res = await fetch("/api/money/spending");
      if (!res.ok) {
        throw new Error("Failed to fetch monthly spending dataset");
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}

export function useApplyMonthlyBudgetTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string = "guest") => {
      const res = await fetch("/api/money/spending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        throw new Error("Failed to apply monthly budget template");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
