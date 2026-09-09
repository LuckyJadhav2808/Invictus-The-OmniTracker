"use client";

interface Insight {
  id: string;
  module: "goals" | "study" | "money";
  text: string;
}

interface InsightCardProps {
  insights: Insight[];
  onDismiss?: (id: string) => void;
}

export function InsightCard({ insights, onDismiss }: InsightCardProps) {
  const newCount = insights.length;

  return (
    <div className="bg-[#FFF9EA] rounded-2xl p-5 sm:p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4">
      <div className="flex items-center justify-between">
        <h3
          className="text-xs font-heading font-black uppercase tracking-wider text-[#161514]"
        >
          💡 Proactive Insights
        </h3>
        {newCount > 0 && (
          <span className="bg-[#CEF431] text-[#161514] text-[10px] font-heading font-black px-2.5 py-0.5 rounded-full border border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] uppercase tracking-wider">
            {newCount} New
          </span>
        )}
      </div>

      {insights.length === 0 ? (
        <p className="text-center text-xs text-[#161514]/70 py-4 font-bold">
          No insights yet. Log more entries to generate insights!
        </p>
      ) : (
        <div className="space-y-2.5">
          {insights.map((insight) => {
            const badgeColor =
              insight.module === "study"
                ? "bg-[#C084FC]"
                : insight.module === "money"
                ? "bg-[#FBCFE8]"
                : "bg-[#03D26F]";

            return (
              <div
                key={insight.id}
                className="flex items-start justify-between border-2 border-[#161514] rounded-xl p-3 bg-white shadow-[2px_2px_0px_0px_#161514] gap-2"
              >
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <span className={`h-2.5 w-2.5 rounded-full border border-[#161514] mt-1 shrink-0 ${badgeColor}`} />
                  <p className="text-xs text-[#161514] font-medium leading-relaxed flex-1">
                    {insight.text}
                  </p>
                </div>
                {onDismiss && (
                  <button
                    type="button"
                    onClick={() => onDismiss(insight.id)}
                    className="px-2 py-0.5 rounded-lg border border-[#161514] bg-white hover:bg-[#161514] hover:text-white text-[#161514] text-[10px] font-heading font-black uppercase transition-all ml-2 cursor-pointer select-none shadow-[1px_1px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shrink-0"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
