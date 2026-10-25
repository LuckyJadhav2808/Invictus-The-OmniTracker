"use client";

import React, { useState } from "react";
import { type Transaction, type Category } from "@/types";
import { format, parseISO } from "date-fns";
import {
  Share2,
  Copy,
  Edit2,
  Trash2,
  Check,
  Users,
  MessageCircle,
  Plus,
  Minus,
} from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { renderCategoryEmoji } from "@/components/money/MoneyQuickActionsAndCards";

interface ThermalReceiptSlipProps {
  transaction: Transaction;
  category?: Category | null;
  currencySymbol: string;
  onEdit: (tx: Transaction) => void;
  onDuplicate: (tx: Transaction) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose?: () => void;
}

/**
 * Formats a clean, high-utility WhatsApp / SMS message for splitting expenses with roommates/friends.
 */
export function formatReceiptShareText(
  transaction: Transaction,
  categoryName: string,
  categoryIcon: string,
  currencySymbol: string,
  splitCount: number = 1
): string {
  let formattedDate = transaction.date;
  try {
    const d = parseISO(transaction.date);
    formattedDate = format(d, "dd-MMM-yyyy").toUpperCase();
  } catch {}

  const totalAmount = Number(transaction.amount);
  const perPerson = splitCount > 1 ? Math.ceil(totalAmount / splitCount) : totalAmount;

  let text = `🧾 *INVICTUS ${splitCount > 1 ? "SPLIT BILL" : "EXPENSE"} RECEIPT*
━━━━━━━━━━━━━━━━━━━━
📍 *Category:* ${categoryName} ${categoryIcon}
📅 *Date:* ${formattedDate}
💳 *Paid Via:* ${transaction.paymentMethod === "cash" ? "Cash" : transaction.paymentMethod?.toUpperCase() || "UPI"}
💰 *Total Amount:* ${currencySymbol}${totalAmount.toLocaleString()}`;

  if (splitCount > 1) {
    text += `\n👥 *Split:* ${splitCount} ways (${currencySymbol}${perPerson.toLocaleString()} / person)`;
  }

  if (transaction.note) {
    text += `\n📝 *Note:* "${transaction.note}"`;
  }

  text += `\n━━━━━━━━━━━━━━━━━━━━`;

  if (splitCount > 1) {
    text += `\n💸 *Please send your share (${currencySymbol}${perPerson.toLocaleString()}):*\n👉 Pay via UPI / Cash to settle up ✨`;
  }

  text += `\n✨ _Shared via Invictus Life OS_`;
  return text;
}

export function ThermalReceiptSlip({
  transaction,
  category,
  currencySymbol,
  onEdit,
  onDuplicate,
  onDelete,
  onClose,
}: ThermalReceiptSlipProps) {
  const [splitCount, setSplitCount] = useState<number>(1);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isIncome = transaction.type === "income";

  let formattedDate = transaction.date;
  let formattedTime = "12:00 PM";
  try {
    const d = parseISO(transaction.date);
    formattedDate = format(d, "dd-MMM-yyyy").toUpperCase();
    formattedTime = format(new Date(), "hh:mm a").toUpperCase();
  } catch {}

  const totalAmount = Number(transaction.amount);
  const perPersonShare = splitCount > 1 ? Math.ceil(totalAmount / splitCount) : totalAmount;

  const categoryName = category?.name || "General Expense";
  const categoryIcon = renderCategoryEmoji(category?.icon);

  const billBreakdown = formatReceiptShareText(
    transaction,
    categoryName,
    categoryIcon,
    currencySymbol,
    splitCount
  );

  // 1. Native Web Share API with Clipboard Fallback
  const handleNativeShare = async () => {
    soundFX.playCashRegister();
    soundFX.vibrate([20, 40, 60]);

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Invictus Receipt: ${categoryName}`,
          text: billBreakdown,
        });
        toast.success("Receipt shared! 🧾");
        return;
      } catch (err: any) {
        // User cancelled share sheet or share failed - fall through to clipboard
        if (err?.name === "AbortError") return;
      }
    }

    // Fallback to Clipboard
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(billBreakdown);
        setCopiedShare(true);
        toast.success("Receipt Copied to Clipboard! 🧾", {
          description: splitCount > 1
            ? `Split ${splitCount} ways (₹${perPersonShare}/each) ready to paste in WhatsApp.`
            : "Ready to paste in WhatsApp / Split with roommates.",
        });
        setTimeout(() => setCopiedShare(false), 3000);
      }
    } catch {
      toast.error("Could not copy receipt breakdown");
    }
  };

  // 2. Direct 1-Tap WhatsApp Share Deep Link
  const handleWhatsAppDirect = () => {
    soundFX.playCashRegister();
    soundFX.vibrate(25);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(billBreakdown)}`;
    if (typeof window !== "undefined") {
      window.open(url, "_blank");
    }
  };

  // 3. Duplicate Transaction
  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      soundFX.playPop();
      soundFX.vibrate(25);
      await onDuplicate(transaction);
      if (onClose) onClose();
    } finally {
      setIsDuplicating(false);
    }
  };

  // 4. Delete Transaction
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      soundFX.playPop();
      await onDelete(transaction.id);
      if (onClose) onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  // Deterministic barcode bars
  const barcodeBars = [
    3, 1, 2, 4, 1, 2, 1, 3, 2, 4, 1, 3, 1, 2, 4, 2, 1, 3, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 3, 2, 1, 3, 2,
  ];

  return (
    <div className="space-y-4 animate-in slide-in-from-top-8 duration-300 ease-out">
      {/* Printer Slot Simulation */}
      <div className="w-48 h-2 bg-[#161514] rounded-full mx-auto shadow-[0_2px_0_0_rgba(255,255,255,0.4)]" />

      {/* The Physical Paper Slip */}
      <div className="relative mx-auto max-w-sm bg-[#FFFDF8] border-x-2 border-[#161514] shadow-[4px_6px_0px_0px_#161514] font-mono text-[#161514] select-text">
        {/* Top Perforated Sawtooth Edge */}
        <div className="w-full overflow-hidden leading-none -mt-2">
          <svg
            className="w-full h-2.5 text-[#FFFDF8] fill-current drop-shadow-[0_-2px_0_#161514]"
            viewBox="0 0 300 10"
            preserveAspectRatio="none"
          >
            <path d="M0,10 L5,0 L10,10 L15,0 L20,10 L25,0 L30,10 L35,0 L40,10 L45,0 L50,10 L55,0 L60,10 L65,0 L70,10 L75,0 L80,10 L85,0 L90,10 L95,0 L100,10 L105,0 L110,10 L115,0 L120,10 L125,0 L130,10 L135,0 L140,10 L145,0 L150,10 L155,0 L160,10 L165,0 L170,10 L175,0 L180,10 L185,0 L190,10 L195,0 L200,10 L205,0 L210,10 L215,0 L220,10 L225,0 L230,10 L235,0 L240,10 L245,0 L250,10 L255,0 L260,10 L265,0 L270,10 L275,0 L280,10 L285,0 L290,10 L295,0 L300,10 Z" />
          </svg>
        </div>

        {/* Paper Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Receipt Store Header */}
          <div className="text-center space-y-1 border-b-2 border-dashed border-[#161514]/30 pb-3">
            <div className="inline-flex items-center gap-1.5 font-black text-xs uppercase tracking-widest bg-[#161514] text-white px-2.5 py-0.5 rounded">
              <span>★ INVICTUS GLADIATOR LEDGER ★</span>
            </div>
            <p className="text-[10px] text-[#161514]/70 tracking-wider">
              TERMINAL ID: #INV-{transaction.id.slice(0, 6).toUpperCase()}
            </p>
            <p className="text-[9px] text-[#161514]/50">
              OFFICIAL EXPENSE TELEMETRY RECEIPT
            </p>
          </div>

          {/* Date & Mode Timestamps */}
          <div className="flex justify-between items-center text-[10px] font-bold border-b border-[#161514]/15 pb-2">
            <div>
              <span className="text-[#161514]/60">DATE: </span>
              <span>{formattedDate}</span>
            </div>
            <div>
              <span className="text-[#161514]/60">TIME: </span>
              <span>{formattedTime}</span>
            </div>
          </div>

          {/* Category Stamp & Payment Badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#161514] px-2 py-1 rounded text-xs font-black">
              <span>{categoryIcon}</span>
              <span className="truncate max-w-[120px]">{categoryName}</span>
            </div>

            {/* Inked Stamp Style Badge */}
            <div
              className={cn(
                "px-2.5 py-0.5 border-2 border-dashed rounded font-black text-[10px] uppercase tracking-wider -rotate-2 select-none",
                transaction.paymentMethod === "cash"
                  ? "border-emerald-700 text-emerald-800 bg-emerald-50"
                  : "border-indigo-700 text-indigo-800 bg-indigo-50"
              )}
            >
              {transaction.paymentMethod === "cash"
                ? "💵 CASH IN HAND"
                : "⚡ " + (transaction.paymentMethod?.toUpperCase() || "UPI")}
            </div>
          </div>

          {/* Note Quote (if present) */}
          {transaction.note && (
            <div className="bg-[#FAF8F5] p-2.5 rounded border border-[#161514]/20 text-xs italic text-[#161514]/90">
              &ldquo;{transaction.note}&rdquo;
            </div>
          )}

          {/* Itemized Total Amount Box */}
          <div className="border-y-2 border-dashed border-[#161514]/30 py-3 my-2 text-center space-y-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-[#161514]/60">
              {isIncome ? "AMOUNT RECEIVED" : "TOTAL AMOUNT PAID"}
            </div>
            <div
              className={cn(
                "text-3xl sm:text-4xl font-black font-mono tracking-tight",
                isIncome ? "text-emerald-700" : "text-[#161514]"
              )}
            >
              {isIncome ? "+" : "-"}{currencySymbol}{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[9px] font-black uppercase text-[#161514]/50 block">
              STATUS: AUDITED &amp; CONFIRMED
            </span>
          </div>

          {/* 👥 Roommate Split Bill Calculation Perforated Card */}
          {!isIncome && (
            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#161514]/30 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#161514]">
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  <span>Split with Friends:</span>
                </span>
                <span className="font-mono text-xs">
                  {splitCount === 1 ? "Solo Bill" : `${splitCount} People`}
                </span>
              </div>

              {/* Stepper & Preset Chips */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-[#161514]">
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setSplitCount((prev) => Math.max(1, prev - 1));
                    }}
                    disabled={splitCount <= 1}
                    className="size-5 rounded flex items-center justify-center hover:bg-[#161514]/10 disabled:opacity-30 cursor-pointer"
                    aria-label="Decrease split count"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="font-mono font-black text-xs px-2 min-w-6 text-center">
                    {splitCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setSplitCount((prev) => Math.min(10, prev + 1));
                    }}
                    disabled={splitCount >= 10}
                    className="size-5 rounded flex items-center justify-center hover:bg-[#161514]/10 disabled:opacity-30 cursor-pointer"
                    aria-label="Increase split count"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1">
                  {[2, 3, 4, 5].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        soundFX.playPop();
                        setSplitCount(count);
                      }}
                      className={cn(
                        "size-6 rounded-md text-[10px] font-black font-mono border transition-all cursor-pointer",
                        splitCount === count
                          ? "bg-[#161514] text-white border-[#161514]"
                          : "bg-white text-[#161514] border-[#161514]/30 hover:border-[#161514]"
                      )}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Per-Person Result Display */}
              {splitCount > 1 && (
                <div className="pt-2 border-t border-dashed border-[#161514]/20 flex items-center justify-between font-mono">
                  <span className="text-[10px] text-[#161514]/70 font-bold uppercase">
                    Per Person Share:
                  </span>
                  <span className="text-sm font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-800/30">
                    {currencySymbol}{perPersonShare.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Procedural Vector Barcode */}
          <div className="flex flex-col items-center justify-center pt-1 pb-2">
            <div className="flex items-center justify-center h-10 gap-[2px]">
              {barcodeBars.map((w, idx) => (
                <div
                  key={idx}
                  className="h-full bg-[#161514]"
                  style={{ width: `${w}px` }}
                />
              ))}
            </div>
            <span className="text-[9px] font-mono tracking-[0.2em] text-[#161514]/70 mt-1">
              *INV-TXN-{transaction.id.slice(-8).toUpperCase()}*
            </span>
          </div>

          {/* Attached Receipt Image (if present) */}
          {transaction.attachmentUrl && (
            <div className="border border-[#161514] p-2 rounded bg-white space-y-1">
              <span className="text-[9px] font-black uppercase block text-[#161514]/60">
                Attached Merchant Photo:
              </span>
              <img
                src={transaction.attachmentUrl}
                alt="Receipt Proof"
                className="w-full max-h-36 object-contain rounded border border-[#161514]/30"
              />
            </div>
          )}

          {/* Retro Register Footer */}
          <div className="text-center text-[9px] text-[#161514]/60 space-y-0.5 border-t border-[#161514]/20 pt-3">
            <p className="font-black text-[#161514]">
              ★★★ THANK YOU FOR STAYING DISCIPLINED ★★★
            </p>
            <p>NO REFUNDS ON POOR DECISIONS • TRACK EVERY RUPEE</p>
            <p className="font-mono text-[8px] text-[#161514]/40">
              INVICTUS CLIENT AUTH: {transaction.id}
            </p>
          </div>
        </div>

        {/* Bottom Perforated Sawtooth Edge */}
        <div className="w-full overflow-hidden leading-none -mb-2">
          <svg
            className="w-full h-2.5 text-[#FFFDF8] fill-current drop-shadow-[0_2px_0_#161514]"
            viewBox="0 0 300 10"
            preserveAspectRatio="none"
          >
            <path d="M0,0 L5,10 L10,0 L15,10 L20,0 L25,10 L30,0 L35,10 L40,0 L45,10 L50,0 L55,10 L60,0 L65,10 L70,0 L75,10 L80,0 L85,10 L90,0 L95,10 L100,0 L105,10 L110,0 L115,10 L120,0 L125,10 L130,0 L135,10 L140,0 L145,10 L150,0 L155,10 L160,0 L165,10 L170,0 L175,10 L180,0 L185,10 L190,0 L195,10 L200,0 L205,10 L210,0 L215,10 L220,0 L225,10 L230,0 L235,10 L240,0 L245,10 L250,0 L255,10 L260,0 L265,10 L270,0 L275,10 L280,0 L285,10 L290,0 L295,10 L300,0 Z" />
          </svg>
        </div>
      </div>

      {/* ================= ACTION DOCK ================= */}
      <div className="max-w-sm mx-auto space-y-2 pt-2">
        {/* Dual Primary Sharing Actions */}
        <div className="grid grid-cols-2 gap-2">
          {/* Button 1: Native Share Sheet / Clipboard */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="bg-[#CEF431] hover:bg-[#bde422] text-[#161514] font-black text-xs uppercase tracking-wider py-3 px-3 rounded-xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#161514] transition-all flex items-center justify-center gap-1.5 cursor-pointer font-heading"
          >
            {copiedShare ? (
              <>
                <Check className="size-4 stroke-[3] text-emerald-800" />
                <span className="truncate">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="size-4 stroke-[2.5]" />
                <span className="truncate">
                  {splitCount > 1 ? `Share Split (${splitCount})` : "Share Slip"}
                </span>
              </>
            )}
          </button>

          {/* Button 2: Direct WhatsApp Action */}
          <button
            type="button"
            onClick={handleWhatsAppDirect}
            className="bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs uppercase tracking-wider py-3 px-3 rounded-xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#161514] transition-all flex items-center justify-center gap-1.5 cursor-pointer font-heading"
            title="Open WhatsApp directly with receipt text"
          >
            <MessageCircle className="size-4 stroke-[2.5]" />
            <span className="truncate">WhatsApp</span>
          </button>
        </div>

        {/* Secondary Actions Row: Duplicate, Edit, Delete */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={isDuplicating}
            onClick={handleDuplicate}
            className="bg-white hover:bg-[#FAF8F5] text-[#161514] font-black text-[11px] uppercase tracking-wider py-2.5 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center gap-1 cursor-pointer active:translate-y-0.5 disabled:opacity-50"
            title="Duplicate with today's date"
          >
            <Copy className="size-3.5" />
            <span>{isDuplicating ? "…" : "Copy"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
              onEdit(transaction);
            }}
            className="bg-white hover:bg-[#FAF8F5] text-[#161514] font-black text-[11px] uppercase tracking-wider py-2.5 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center gap-1 cursor-pointer active:translate-y-0.5"
          >
            <Edit2 className="size-3.5" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-black text-[11px] uppercase tracking-wider py-2.5 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center gap-1 cursor-pointer active:translate-y-0.5 disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
            <span>{isDeleting ? "…" : "Delete"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
