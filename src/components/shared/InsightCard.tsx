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
    <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-[0_8px_24px_rgba(31,36,48,0.08)] space-y-4">
      <div className="flex items-center justify-between">
        <h3
          className="text-xs font-bold uppercase tracking-wider text-navy-600"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Insights
        </h3>
        {newCount > 0 && (
          <span className="bg-amber-500 text-navy-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {newCount} New
          </span>
        )}
      </div>

      {insights.length === 0 ? (
        <p className="text-center text-xs text-navy-600 py-4">
          No insights yet. Log more entries to generate insights!
        </p>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => {
            let leftBorderColor = "border-amber-500";
            if (insight.module === "study") leftBorderColor = "border-orange-500";
            if (insight.module === "money") leftBorderColor = "border-mint-600";

            return (
              <div
                key={insight.id}
                className={`flex items-start justify-between border-l-4 ${leftBorderColor} pl-3 py-1.5 bg-cream-bg/10 rounded-r-[var(--radius-sm)]`}
              >
                <p className="text-xs text-navy-900 leading-relaxed flex-1">
                  {insight.text}
                </p>
                {onDismiss && (
                  <button
                    type="button"
                    onClick={() => onDismiss(insight.id)}
                    className="text-navy-600 hover:text-navy-900 text-[10px] font-bold uppercase ml-3 select-none"
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
