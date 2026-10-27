"use client";

import React, { useState, useMemo } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { type Category } from "@/types";
import { soundFX } from "@/components/shared/SoundFX";
import {
  useMerchantRules,
  useSaveMerchantRule,
  useDeleteMerchantRule,
} from "@/lib/queries/merchant-rules";
import { Search, Plus, Trash2, Sparkles, Tag, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface LearnedMerchantDictionaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
}

export function LearnedMerchantDictionaryModal({
  open,
  onOpenChange,
  categories,
}: LearnedMerchantDictionaryModalProps) {
  const { data: rules = [], isLoading } = useMerchantRules();
  const saveMutation = useSaveMerchantRule();
  const deleteMutation = useDeleteMerchantRule();

  const [search, setSearch] = useState("");
  const [newMerchant, setNewMerchant] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [editingMerchant, setEditingMerchant] = useState<string | null>(null);

  // Filter available expense categories
  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === "expense" && !c.archived);
  }, [categories]);

  // Set default category for new rule
  React.useEffect(() => {
    if (expenseCategories.length > 0 && !newCategoryId) {
      setNewCategoryId(expenseCategories[0].id);
    }
  }, [expenseCategories, newCategoryId]);

  // Filtered rules
  const filteredRules = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rules;
    return rules.filter(
      (r) =>
        r.displayName.toLowerCase().includes(q) ||
        r.merchantPattern.toLowerCase().includes(q) ||
        r.categoryName.toLowerCase().includes(q)
    );
  }, [rules, search]);

  const stats = useMemo(() => {
    const total = rules.length;
    const userLearned = rules.filter((r) => r.isUserDefined).length;
    const totalHits = rules.reduce((acc, r) => acc + (r.matchCount || 0), 0);
    return { total, userLearned, totalHits };
  }, [rules]);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMerchant.trim() || !newCategoryId) return;

    const matchedCat = expenseCategories.find((c) => c.id === newCategoryId);
    const catName = matchedCat?.name || "Expense";

    soundFX.playPop();
    soundFX.vibrate(20);

    await saveMutation.mutateAsync({
      merchant: newMerchant.trim(),
      categoryId: newCategoryId,
      categoryName: catName,
      displayName: newMerchant.trim(),
    });

    setNewMerchant("");
  };

  const handleCategoryChange = async (merchantPattern: string, catId: string) => {
    const matchedCat = expenseCategories.find((c) => c.id === catId);
    if (!matchedCat) return;

    soundFX.playPop();
    soundFX.vibrate(15);

    await saveMutation.mutateAsync({
      merchant: merchantPattern,
      categoryId: catId,
      categoryName: matchedCat.name,
    });
    setEditingMerchant(null);
  };

  const handleDeleteRule = async (pattern: string) => {
    soundFX.playPop();
    soundFX.vibrate(20);
    await deleteMutation.mutateAsync(pattern);
  };

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title="Learned Merchant Dictionary"
      description="Categorize-once rules. Daily transactions from these merchants are categorized automatically in 0ms."
    >
      <div className="flex flex-col h-[70vh] sm:h-[620px] max-h-[80vh] text-[#161514] overflow-hidden">
        {/* Top Summary Bar */}
        <div className="shrink-0 px-5 pt-3 pb-2 bg-[#FAF8F5] border-b-2 border-[#161514]/15">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-[#161514]/70 mb-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#CEF431]" fill="#CEF431" />
              <span>{stats.total} Active Rules</span>
            </span>
            <span className="bg-[#CEF431]/40 px-2 py-0.5 rounded-full border border-[#161514]/20 text-[#161514]">
              {stats.userLearned} Custom Learned
            </span>
            <span>{stats.totalHits} Total Hits</span>
          </div>

          {/* Quick Add Rule Form */}
          <form
            onSubmit={handleAddRule}
            className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-1 pb-1"
          >
            <input
              type="text"
              placeholder="Merchant (e.g. Ramesh Chai, D-Mart)"
              value={newMerchant}
              onChange={(e) => setNewMerchant(e.target.value)}
              className="flex-1 min-w-[160px] h-9 px-3 text-xs sm:text-sm font-bold bg-white border-2 border-[#161514] rounded-xl shadow-[2px_2px_0px_0px_#161514] focus:outline-none focus:ring-1 focus:ring-[#161514]"
            />
            <select
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
              className="h-9 px-2 text-xs font-bold bg-white border-2 border-[#161514] rounded-xl shadow-[2px_2px_0px_0px_#161514] focus:outline-none"
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!newMerchant.trim() || saveMutation.isPending}
              className="h-9 px-3 flex items-center justify-center gap-1 text-xs font-black bg-[#CEF431] text-[#161514] border-2 border-[#161514] rounded-xl shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Search Bar */}
        <div className="shrink-0 px-5 py-2.5 bg-white border-b-2 border-[#161514]/10">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#161514]/50" />
            <input
              type="text"
              placeholder="Search merchants, patterns, or categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm font-semibold bg-[#FAF8F5] border-2 border-[#161514]/30 rounded-xl focus:border-[#161514] focus:outline-none"
            />
          </div>
        </div>

        {/* Scrollable Rules List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 bg-[#FAF8F5]/50">
          {filteredRules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[#161514]/60">
              <Tag className="w-8 h-8 mb-2 stroke-[1.5]" />
              <p className="text-sm font-bold">No merchant rules found</p>
              <p className="text-xs font-mono mt-1">
                Add a rule above or categorize transactions to train the engine.
              </p>
            </div>
          ) : (
            filteredRules.map((rule) => {
              const isEditing = editingMerchant === rule.merchantPattern;

              return (
                <div
                  key={rule.merchantPattern}
                  className={cn(
                    "p-3 rounded-2xl border-2 border-[#161514] bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5",
                    rule.isUserDefined
                      ? "shadow-[3px_3px_0px_0px_#161514]"
                      : "shadow-[2px_2px_0px_0px_#161514]/50 opacity-90"
                  )}
                >
                  {/* Left: Merchant Info */}
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 shrink-0 rounded-xl bg-[#FAF8F5] border-2 border-[#161514] flex items-center justify-center text-sm font-bold">
                      {rule.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black truncate">{rule.displayName}</span>
                        {rule.isUserDefined ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-[#CEF431] border border-[#161514] rounded-md">
                            Learned
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold text-[#161514]/60 bg-stone-100 border border-[#161514]/20 rounded-md">
                            System
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-[#161514]/60 flex items-center gap-2 mt-0.5">
                        <span>Pattern: "{rule.merchantPattern}"</span>
                        {rule.matchCount > 0 && (
                          <span className="font-bold text-[#161514]">
                            • {rule.matchCount} {rule.matchCount === 1 ? "hit" : "hits"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Category Badge & Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <select
                          defaultValue={rule.categoryId}
                          onChange={(e) => handleCategoryChange(rule.merchantPattern, e.target.value)}
                          className="h-8 px-2 text-xs font-bold bg-white border-2 border-[#161514] rounded-lg focus:outline-none"
                        >
                          {expenseCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setEditingMerchant(null)}
                          className="h-8 px-2 text-xs font-bold border border-[#161514]/30 rounded-lg hover:bg-stone-100"
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingMerchant(rule.merchantPattern)}
                        className="px-2.5 py-1 text-xs font-black bg-[#FAF8F5] border-2 border-[#161514] rounded-xl hover:bg-stone-100 transition-colors flex items-center gap-1.5"
                        title="Click to reassign category"
                      >
                        <span>{rule.categoryName}</span>
                        <RefreshCw className="w-3 h-3 text-[#161514]/50" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteRule(rule.merchantPattern)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                      title={rule.isUserDefined ? "Delete rule" : "Reset rule to default"}
                    >
                      <Trash2 className="w-4 h-4 stroke-[2]" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </ResponsiveFormContainer>
  );
}
