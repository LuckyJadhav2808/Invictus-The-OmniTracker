"use client";

import { useState, useMemo } from "react";
import { Tag, Plus, Layers, Wallet, Trash2, Edit3, Sparkles } from "lucide-react";
import { SubpageHeader } from "@/components/shared/SubpageHeader";
import { useCategories, useTransactions, useDeleteCategory, useAddCategory } from "@/lib/queries/money";
import { BUDGET_CATEGORY_TEMPLATE_PACKS } from "@/lib/templates-data";
import { soundFX } from "@/components/shared/SoundFX";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function CategoryEnvelopesPage() {
  const [activeTab, setActiveTab] = useState<"envelopes" | "packs">("envelopes");
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions();
  const deleteCatMutation = useDeleteCategory();
  const addCatMutation = useAddCategory();

  const currentMonthStr = format(new Date(), "yyyy-MM");

  // Compute spend per category for current month
  const categorySpendMap = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((tx) => {
      if (tx.type === "expense" && tx.date?.startsWith(currentMonthStr)) {
        const curr = map.get(tx.categoryId) || 0;
        map.set(tx.categoryId, curr + Number(tx.amount || 0));
      }
    });
    return map;
  }, [transactions, currentMonthStr]);

  const handleApplyPack = async (pack: any) => {
    soundFX.playPop();
    soundFX.vibrate(20);
    try {
      for (const item of pack.items) {
        await addCatMutation.mutateAsync({
          name: item.title,
          type: "expense",
          color: "mint",
          icon: "Wallet",
          monthlyBudget: 3000,
          templatePackId: pack.id,
        } as any);
      }
      toast.success(`Applied ${pack.name} envelopes!`);
    } catch {
      toast.error("Failed to apply category pack");
    }
  };

  return (
    <div className="w-full max-w-xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-3.5 select-none animate-in fade-in duration-200 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      {/* 1. Subpage Header with Back Navigation */}
      <SubpageHeader
        backHref="/money"
        backLabel="Money"
        title="Category Envelopes"
        badge="Zero-Based Envelopes"
        badgeColorClass="bg-amber-400/20 text-amber-700 dark:text-amber-300 border-amber-500/30"
        subtitle="Manage spending limits, monthly envelopes & curated template packs"
        icon={Tag}
        rightAction={
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              soundFX.vibrate(15);
              toast.info("Create a new category from the Preset tab or main cockpit!");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#161514] bg-[#CEF431] text-[#161514] font-heading font-black text-xs shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <Plus className="size-3.5 stroke-[3]" />
            <span>Add Envelope</span>
          </button>
        }
      />

      {/* 2. Strict 2-Tab Navigation */}
      <div className="grid grid-cols-2 p-1 bg-muted/60 dark:bg-card border-2 border-[#161514] dark:border-white/20 rounded-xl shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] gap-1">
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            soundFX.vibrate(10);
            setActiveTab("envelopes");
          }}
          className={cn(
            "py-2 text-xs font-heading font-black rounded-lg transition-all text-center cursor-pointer",
            activeTab === "envelopes"
              ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          🏷️ Active Envelopes ({categories.length})
        </button>
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            soundFX.vibrate(10);
            setActiveTab("packs");
          }}
          className={cn(
            "py-2 text-xs font-heading font-black rounded-lg transition-all text-center cursor-pointer",
            activeTab === "packs"
              ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          📦 Envelope Packs ({BUDGET_CATEGORY_TEMPLATE_PACKS.length})
        </button>
      </div>

      {/* TAB 1: Active Envelopes */}
      {activeTab === "envelopes" && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-foreground">
                Monthly Spending Envelopes
              </h3>
              <span className="text-[11px] font-mono text-muted-foreground">
                {format(new Date(), "MMMM yyyy")}
              </span>
            </div>

            {categories.length === 0 ? (
              <div className="p-5 rounded-xl border border-dashed border-border text-center space-y-2">
                <Tag className="size-6 text-muted-foreground mx-auto" />
                <p className="text-xs font-heading font-bold text-foreground">No category envelopes created</p>
                <p className="text-[11px] text-muted-foreground">
                  Switch to the Preset Packs tab to install instant envelopes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((cat) => {
                  const spent = categorySpendMap.get(cat.id) || 0;
                  const budget = cat.monthlyBudget || 3000;
                  const pct = Math.min(100, Math.round((spent / budget) * 100));
                  const isOver = spent > budget;

                  return (
                    <div
                      key={cat.id}
                      className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2 hover:border-foreground/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-lg bg-card border border-border flex items-center justify-center text-foreground font-black text-xs">
                            {cat.name.slice(0, 1)}
                          </div>
                          <div>
                            <h4 className="font-heading font-bold text-xs text-foreground">{cat.name}</h4>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">
                              {cat.type}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            deleteCatMutation.mutate(cat.id);
                            toast.success("Category deleted");
                          }}
                          className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                          title="Delete envelope"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      {/* Spend Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1">
                          <span className={cn(isOver ? "text-rose-500" : "text-foreground")}>
                            ₹{Math.round(spent)} spent
                          </span>
                          <span className="text-muted-foreground">
                            / ₹{Math.round(budget)} cap
                          </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              isOver ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-[#03D26F]"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Preset Envelope Packs */}
      {activeTab === "packs" && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-amber-500" />
              <h3 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-foreground">
                Curated Budget Envelope Packs
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BUDGET_CATEGORY_TEMPLATE_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className="p-4 rounded-xl border border-border bg-muted/20 space-y-2 hover:border-foreground/30 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <h4 className="font-heading font-black text-xs sm:text-sm text-foreground">
                      {pack.name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">{pack.tagline}</p>
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {pack.items.map((item) => (
                        <span
                          key={item.id}
                          className="px-1.5 py-0.5 rounded bg-muted text-foreground text-[10px] font-mono font-bold"
                        >
                          {item.title}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyPack(pack)}
                    className="mt-2 w-full py-1.5 rounded-lg border-2 border-[#161514] bg-[#CEF431] text-[#161514] font-heading font-black text-xs shadow-[1.5px_1.5px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
                  >
                    Install Envelope Pack
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
