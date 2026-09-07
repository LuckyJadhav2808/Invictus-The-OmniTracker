"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import {
  Camera,
  Zap,
  Upload,
  Check,
  Trash2,
  Plus,
  ArrowRight,
  Loader2,
  FileText,
  RefreshCw,
  Image as ImageIcon,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  parseRawOCRText,
  createEmptyTurboRows,
  TurboGridRow,
  ParsedExpenseItem,
} from "@/lib/utils/ocr-expense-parser";
import { useBulkAddTransactions } from "@/lib/queries/money";
import { type Category } from "@/types";
import { renderCategoryEmoji } from "@/components/money/MoneyQuickActionsAndCards";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// --- Custom Portaled Neo-Brutalist Category Picker ---
function NeoCategoryPicker({
  value,
  onChange,
  categories,
  className,
}: {
  value: string;
  onChange: (id: string) => void;
  categories: Array<{ id: string; name: string; icon?: string; color?: string; type?: string }>;
  className?: string;
}) {
  const currentCat = categories.find((c) => c.id === value) || categories[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full bg-amber-100/90 hover:bg-amber-200/90 active:translate-y-0.5 rounded-lg border border-navy-950 text-xs font-black text-navy-950 px-2.5 py-1 outline-none cursor-pointer flex items-center justify-between gap-1 transition-all shadow-[1px_1px_0px_0px_rgba(31,36,48,1)] text-left truncate",
            className
          )}
        >
          <span className="flex items-center gap-1.5 truncate">
            {currentCat?.icon && (
              <span className="shrink-0 text-xs">{renderCategoryEmoji(currentCat.icon)}</span>
            )}
            <span className="truncate">{currentCat?.name || "Select"}</span>
          </span>
          <ChevronDown className="h-3 w-3 stroke-[3] text-navy-950 shrink-0 opacity-70 ml-1" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="z-[999] bg-white rounded-2xl border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] p-1.5 min-w-[170px] max-h-56 overflow-y-auto space-y-1"
      >
        {categories.map((cat) => {
          const isSelected = cat.id === value;
          return (
            <DropdownMenuItem
              key={cat.id}
              onClick={() => onChange(cat.id)}
              className={cn(
                "px-2.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-between gap-2 cursor-pointer border outline-none",
                isSelected
                  ? "bg-[#CEF431] text-navy-950 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]"
                  : "bg-white text-navy-950 border-transparent hover:bg-amber-100 hover:border-navy-950/40"
              )}
            >
              <span className="flex items-center gap-1.5 truncate">
                {cat.icon && <span>{renderCategoryEmoji(cat.icon)}</span>}
                <span className="truncate">{cat.name}</span>
              </span>
              {isSelected && <Check className="h-3.5 w-3.5 stroke-[3] text-navy-950 shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// --- Custom Portaled Neo-Brutalist Payment Method Picker ---
function NeoPaymentMethodPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const methods = ["UPI", "Card", "Cash", "NetBanking"];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="bg-cream-100 hover:bg-cream-200 active:translate-y-0.5 rounded-lg border border-navy-950/60 text-[11px] font-black text-navy-900 px-2 py-1 outline-none cursor-pointer flex items-center gap-1 shrink-0 transition-all shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]"
        >
          <span>{value || "UPI"}</span>
          <ChevronDown className="h-2.5 w-2.5 stroke-[3] text-navy-600 shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="z-[999] bg-white rounded-xl border-2 border-navy-950 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)] p-1 min-w-[110px] space-y-0.5"
      >
        {methods.map((method) => {
          const isSelected = method === value;
          return (
            <DropdownMenuItem
              key={method}
              onClick={() => onChange(method)}
              className={cn(
                "px-2 py-1 rounded-lg text-[11px] font-black transition-all flex items-center justify-between cursor-pointer border outline-none",
                isSelected
                  ? "bg-[#CEF431] text-navy-950 border-navy-950"
                  : "bg-white text-navy-950 border-transparent hover:bg-cream-100"
              )}
            >
              <span>{method}</span>
              {isSelected && <Check className="h-3 w-3 stroke-[3] text-navy-950" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// --- Helper to format YYYY-MM-DD into a crisp badge like "Today" or "05 Sep" ---
function formatDateBadge(dateStr: string): string {
  if (!dateStr) return "Today";
  try {
    const today = new Date().toISOString().split("T")[0];
    if (dateStr === today) return "Today";

    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return dateStr;
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
  } catch {
    return dateStr;
  }
}

interface BulkExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  currencySymbol?: string;
}

export function BulkExpenseModal({
  open,
  onOpenChange,
  categories,
  currencySymbol = "₹",
}: BulkExpenseModalProps) {
  const [activeTab, setActiveTab] = useState<"ocr" | "grid">("ocr");

  // Category mapping
  const expenseCategories = useMemo(() => {
    const list = categories.filter((c) => c.type === "expense" && !c.archived);
    return list.length > 0
      ? list
      : [
          {
            id: "cat-food",
            name: "Food",
            type: "expense" as const,
            icon: "utensils",
            color: "#F59E0B",
            archived: false,
          },
        ];
  }, [categories]);

  const defaultCatId = expenseCategories[0]?.id || "cat-food";

  // --- OCR Scanner State ---
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrStatusText, setOcrStatusText] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [rawOcrText, setRawOcrText] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // --- SMS / Text Input State ---
  const [isSmsOpen, setIsSmsOpen] = useState(false);
  const [smsInputText, setSmsInputText] = useState("");

  // --- Turbo Grid State ---
  const [batchDate, setBatchDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [turboRows, setTurboRows] = useState<TurboGridRow[]>(() =>
    createEmptyTurboRows(4, defaultCatId)
  );

  // --- Shared Review State ---
  const [reviewItems, setReviewItems] = useState<ParsedExpenseItem[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);

  const bulkAddMutation = useBulkAddTransactions();

  // Reset state on close
  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setOcrImage(null);
      setIsOcrProcessing(false);
      setOcrStatusText("");
      setOcrProgress(0);
      setRawOcrText("");
      setIsReviewMode(false);
      setReviewItems([]);
      setSmsInputText("");
      setIsDragging(false);
      setTurboRows(createEmptyTurboRows(4, defaultCatId));
      setBatchDate(new Date().toISOString().split("T")[0]);
    }
    onOpenChange(nextOpen);
  };

  // --- Client-side Canvas Image Preprocessing for OCR ---
  // Inverts dark mode to white background, scales up for crisp kerning, and stretches contrast.
  const preprocessImageForOcr = async (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(dataUrl);

          // Scale up 1.5x (up to 1200px max) for distinct font character boundaries
          const scale = Math.min(2, Math.max(1.2, 1200 / Math.max(img.width, 1)));
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;

          // 1. Detect Dark Mode via average luminance
          let totalLuminance = 0;
          let sampleCount = 0;
          for (let i = 0; i < d.length; i += 64) {
            totalLuminance += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            sampleCount++;
          }
          const isDarkMode = (totalLuminance / (sampleCount || 1)) < 115;

          // 2. Grayscale, invert dark mode, and boost contrast
          const contrast = 1.35;
          const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));

          for (let i = 0; i < d.length; i += 4) {
            let r = d[i];
            let g = d[i + 1];
            let b = d[i + 2];

            if (isDarkMode) {
              r = 255 - r;
              g = 255 - g;
              b = 255 - b;
            }

            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const adjusted = Math.min(255, Math.max(0, factor * (gray - 128) + 128));

            d[i] = adjusted;
            d[i + 1] = adjusted;
            d[i + 2] = adjusted;
          }

          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // --- Local OCR Processing Engine ---
  const processImageFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please choose a valid image (PNG, JPG, WEBP)");
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        setOcrImage(dataUrl);
        setIsOcrProcessing(true);
        setOcrProgress(5);
        setOcrStatusText("Optimizing image contrast & layout...");

        try {
          // Preprocess: dark-mode inversion & contrast boost
          const preprocessedUrl = await preprocessImageForOcr(dataUrl);
          setOcrProgress(15);
          setOcrStatusText("Initializing local OCR engine...");

          const { createWorker } = await import("tesseract.js");

          const worker = await createWorker("eng", 1, {
            logger: (m) => {
              if (m.status === "recognizing text") {
                const pct = Math.round((m.progress || 0) * 100);
                setOcrProgress(pct);
                setOcrStatusText(`Scanning transactions (${pct}%)...`);
              } else if (m.status === "loading language traineddata") {
                setOcrStatusText("Loading language models...");
              }
            },
          });

          setOcrStatusText("Extracting items...");
          const result = await worker.recognize(preprocessedUrl);
          await worker.terminate();

          const extractedText = result.data.text || "";
          setRawOcrText(extractedText);
          setOcrProgress(100);

          const parsed = parseRawOCRText(extractedText, expenseCategories);

          if (parsed.length === 0) {
            toast.warning("No amounts detected. You can enter them manually.");
            setReviewItems([
              {
                id: `item_${Date.now()}`,
                amount: 0,
                note: "Screenshot Expense",
                categoryId: defaultCatId,
                categoryName: expenseCategories[0]?.name || "Food",
                date: new Date().toISOString().split("T")[0],
                paymentMethod: "UPI",
                type: "expense",
                selected: false,
                isIncomplete: true,
              },
            ]);
          } else {
            setReviewItems(parsed);
            const phantomFound = parsed.filter((p) => p.phantomRupeeDetected).length;
            if (phantomFound > 0) {
              toast.info(`Found ${parsed.length} items (${phantomFound} with fused '₹' amounts ready for 1-tap fix)`);
            } else {
              toast.success(`Found ${parsed.length} transaction${parsed.length === 1 ? "" : "s"}`);
            }
          }

          setIsReviewMode(true);
        } catch (err: any) {
          console.error("OCR Error:", err);
          toast.error("Could not scan image locally. Try quick batch entry instead.");
        } finally {
          setIsOcrProcessing(false);
        }
      };

      reader.readAsDataURL(file);
    },
    [expenseCategories, defaultCatId]
  );

  // --- Clipboard Paste Listener (Ctrl+V) ---
  useEffect(() => {
    if (!open || isReviewMode) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            toast.info("Processing pasted screenshot...");
            processImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [open, isReviewMode, processImageFile]);

  // --- Parse Raw SMS / Text ---
  const handleParseSmsText = () => {
    if (!smsInputText.trim()) return;

    const parsed = parseRawOCRText(smsInputText, expenseCategories);
    if (parsed.length === 0) {
      toast.warning("Could not identify amounts in text.");
      return;
    }

    setReviewItems(parsed);
    setIsReviewMode(true);
    setIsSmsOpen(false);
    toast.success(`Found ${parsed.length} transaction${parsed.length === 1 ? "" : "s"}`);
  };

  // --- Turbo Grid Handlers ---
  const handleTurboRowChange = (id: string, field: keyof TurboGridRow, value: string) => {
    setTurboRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleAddTurboRow = () => {
    setTurboRows((prev) => [
      ...prev,
      {
        id: `grid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        amount: "",
        note: "",
        categoryId: defaultCatId,
        paymentMethod: "UPI",
      },
    ]);
  };

  const handleRemoveTurboRow = (id: string) => {
    if (turboRows.length <= 1) {
      setTurboRows(createEmptyTurboRows(1, defaultCatId));
      return;
    }
    setTurboRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleConvertTurboToReview = () => {
    const validRows = turboRows.filter((r) => parseFloat(r.amount) > 0);
    if (validRows.length === 0) {
      toast.error("Please enter an amount for at least one transaction.");
      return;
    }

    const items: ParsedExpenseItem[] = validRows.map((r, idx) => {
      const cat = expenseCategories.find((c) => c.id === r.categoryId) || expenseCategories[0];
      return {
        id: `turbo_${Date.now()}_${idx}`,
        amount: parseFloat(r.amount),
        note: r.note.trim() || `${cat?.name || "Daily"} Expense`,
        categoryId: r.categoryId || defaultCatId,
        categoryName: cat?.name || "Expense",
        date: batchDate,
        paymentMethod: r.paymentMethod || "UPI",
        type: "expense",
        selected: true,
      };
    });

    setReviewItems(items);
    setIsReviewMode(true);
  };

  // --- Review Mode Handlers ---
  const handleToggleSelectItem = (id: string) => {
    setReviewItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          if (!it.selected && (it.amount <= 0 || isNaN(it.amount))) {
            toast.warning("Please enter an amount before selecting this transaction.");
            return it;
          }
          return { ...it, selected: !it.selected };
        }
        return it;
      })
    );
  };

  const handleSelectAll = (select: boolean) => {
    setReviewItems((prev) =>
      prev.map((it) => {
        if (select && (it.amount <= 0 || isNaN(it.amount))) {
          return { ...it, selected: false };
        }
        return { ...it, selected: select };
      })
    );
  };

  const handleUpdateReviewItem = (id: string, field: keyof ParsedExpenseItem, value: any) => {
    setReviewItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const updated = { ...it, [field]: value };
          if (field === "categoryId") {
            const cat = expenseCategories.find((c) => c.id === value);
            updated.categoryName = cat?.name || "Expense";
          }

          // Re-evaluate completeness
          const hasAmount = Number(updated.amount) > 0;
          const hasNote = Boolean(updated.note && updated.note.trim().length > 0 && updated.note !== "Screenshot Expense");
          updated.isIncomplete = !hasAmount || !hasNote;

          // Auto-select if valid amount entered for an incomplete row
          if (hasAmount && !it.selected && (it.amount <= 0 || it.isIncomplete)) {
            updated.selected = true;
          }

          return updated;
        }
        return it;
      })
    );
  };

  const handleRemoveReviewItem = (id: string) => {
    setReviewItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleAddReviewRow = () => {
    const today = new Date().toISOString().split("T")[0];
    setReviewItems((prev) => [
      ...prev,
      {
        id: `manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        amount: 50,
        note: "Quick Expense",
        categoryId: defaultCatId,
        categoryName: expenseCategories[0]?.name || "Food",
        date: today,
        paymentMethod: "UPI",
        type: "expense",
        selected: true,
      },
    ]);
  };

  const selectedReviewItems = reviewItems.filter((it) => it.selected && it.amount > 0);
  const totalSelectedAmount = selectedReviewItems.reduce((sum, it) => sum + it.amount, 0);
  const incompleteCount = useMemo(
    () => reviewItems.filter((it) => it.isIncomplete || it.amount <= 0).length,
    [reviewItems]
  );
  const unfixedPhantomCount = useMemo(
    () => reviewItems.filter((it) => it.phantomRupeeDetected && !it.isPhantomFixed).length,
    [reviewItems]
  );

  // --- Phantom Rupee 1-Tap Handlers ---
  const handleTogglePhantomRupee = (id: string) => {
    setReviewItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const isFixed = it.isPhantomFixed;
          const targetAmount = isFixed
            ? (it.originalAmount !== undefined ? it.originalAmount : it.amount)
            : (it.suggestedAmount !== undefined ? it.suggestedAmount : it.amount);

          return {
            ...it,
            amount: targetAmount,
            isPhantomFixed: !isFixed,
            selected: targetAmount > 0,
            isIncomplete: targetAmount <= 0,
          };
        }
        return it;
      })
    );
  };

  const handleFixAllPhantomRupees = () => {
    let count = 0;
    setReviewItems((prev) =>
      prev.map((it) => {
        if (it.phantomRupeeDetected && !it.isPhantomFixed && it.suggestedAmount !== undefined) {
          count++;
          return {
            ...it,
            amount: it.suggestedAmount,
            isPhantomFixed: true,
            selected: it.suggestedAmount > 0,
            isIncomplete: it.suggestedAmount <= 0,
          };
        }
        return it;
      })
    );
    if (count > 0) {
      toast.success(`Corrected ${count} fused Rupee amount${count === 1 ? "" : "s"}!`);
    }
  };

  // --- Save All Selected to Ledger ---
  const handleSaveAll = async () => {
    if (selectedReviewItems.length === 0) {
      toast.error("No valid transactions selected.");
      return;
    }

    try {
      const payload = selectedReviewItems.map((it) => ({
        id: it.id,
        amount: Number(it.amount),
        note: it.note.trim() || "Expense",
        categoryId: it.categoryId,
        date: it.date,
        paymentMethod: it.paymentMethod,
        type: "expense" as const,
        isRecurring: false,
      }));

      await bulkAddMutation.mutateAsync(payload);
      toast.success(`Saved ${payload.length} expenses (${currencySymbol}${totalSelectedAmount.toLocaleString()})`);
      handleClose(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save expenses");
    }
  };

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={handleClose}
      title="Bulk Expenses"
      description="Scan receipts, upload screenshots, or batch add entries."
    >
      <div className="space-y-3.5 pt-0.5">
        {/* Step Tabs (When not in review mode) */}
        {!isReviewMode ? (
          <>
            {/* Minimal Segmented Control */}
            <div className="grid grid-cols-2 p-1 bg-cream-100/90 rounded-2xl border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("ocr")}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  activeTab === "ocr"
                    ? "bg-navy-950 text-white shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]"
                    : "text-navy-800 hover:bg-cream-200"
                )}
              >
                <Camera className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Scan Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("grid")}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  activeTab === "grid"
                    ? "bg-navy-950 text-white shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]"
                    : "text-navy-800 hover:bg-cream-200"
                )}
              >
                <Zap className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Quick Batch</span>
              </button>
            </div>

            {/* TAB 1: SCAN / UPLOAD */}
            {activeTab === "ocr" && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={galleryInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processImageFile(file);
                    e.target.value = "";
                  }}
                  accept="image/*"
                  className="hidden"
                />

                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processImageFile(file);
                    e.target.value = "";
                  }}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />

                {/* Dropzone Card */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!isOcrProcessing) setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && !isOcrProcessing) processImageFile(file);
                  }}
                  className={cn(
                    "border-2 border-dashed border-navy-950 rounded-2xl p-5 sm:p-6 text-center transition-all bg-cream-50/70 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] select-none",
                    isDragging && "bg-amber-100 border-navy-950 scale-[1.01]",
                    isOcrProcessing && "pointer-events-none opacity-85"
                  )}
                >
                  {isOcrProcessing ? (
                    <div className="space-y-3 py-2">
                      <div className="h-11 w-11 rounded-2xl bg-amber-300 border-2 border-navy-950 mx-auto flex items-center justify-center text-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]">
                        <Loader2 className="h-5 w-5 stroke-[2.5] animate-spin" />
                      </div>
                      <div>
                        <h5 className="font-black text-xs sm:text-sm text-navy-950">
                          {ocrStatusText}
                        </h5>
                        <p className="text-[10px] font-bold text-navy-500 mt-0.5">
                          Processing on-device
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full max-w-xs mx-auto bg-white rounded-full h-2.5 border-2 border-navy-950 overflow-hidden shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]">
                        <div
                          className="bg-emerald-400 h-full transition-all duration-300"
                          style={{ width: `${Math.max(10, ocrProgress)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="h-11 w-11 rounded-2xl bg-amber-300 border-2 border-navy-950 mx-auto flex items-center justify-center text-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]">
                        <Upload className="h-5 w-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-navy-950">
                          Upload receipt or screenshot
                        </h4>
                        <p className="text-[11px] font-bold text-navy-500 max-w-xs mx-auto mt-0.5">
                          Drag & drop, paste from clipboard, or pick a file
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-center gap-2 pt-0.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-xl bg-navy-950 hover:bg-navy-900 text-white font-black text-xs border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] cursor-pointer flex items-center gap-1.5 active:translate-y-0.5 transition-all"
                        >
                          <ImageIcon className="h-3.5 w-3.5 stroke-[2.5]" />
                          <span>Choose Image</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-xl bg-white hover:bg-cream-100 text-navy-950 font-black text-xs border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] cursor-pointer flex items-center gap-1.5 active:translate-y-0.5 transition-all"
                        >
                          <Camera className="h-3.5 w-3.5 stroke-[2.5]" />
                          <span>Camera</span>
                        </button>
                      </div>

                      {/* Privacy & Paste Footnote */}
                      <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-navy-500 pt-1">
                        <span className="inline-flex items-center gap-1">
                          <Lock className="h-3 w-3 text-navy-400" /> On-device OCR
                        </span>
                        <span>•</span>
                        <span>
                          <kbd className="px-1.5 py-0.5 bg-white border border-navy-950/40 rounded text-[9px] font-mono font-bold">
                            Ctrl+V
                          </kbd>{" "}
                          to paste
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Collapsible SMS / Text Parser */}
                <div className="bg-cream-50/70 rounded-2xl p-3 border-2 border-navy-950/20 space-y-2">
                  <div
                    onClick={() => setIsSmsOpen(!isSmsOpen)}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-navy-700" />
                      <span className="text-xs font-black text-navy-950">
                        Paste bank SMS or raw text
                      </span>
                    </div>
                    {isSmsOpen ? (
                      <ChevronUp className="h-3.5 w-3.5 text-navy-600" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-navy-600" />
                    )}
                  </div>

                  {isSmsOpen && (
                    <div className="space-y-2 pt-1">
                      <textarea
                        rows={3}
                        value={smsInputText}
                        onChange={(e) => setSmsInputText(e.target.value)}
                        placeholder="e.g. Paid Rs 40 for Chai, Zepto Rs 350, Uber Rs 220..."
                        className="w-full bg-white rounded-xl border-2 border-navy-950 p-2.5 text-xs font-bold text-navy-950 outline-none placeholder:text-navy-400 focus:ring-2 focus:ring-amber-300"
                      />
                      <button
                        type="button"
                        onClick={handleParseSmsText}
                        className="w-full py-2 bg-amber-300 hover:bg-amber-400 text-navy-950 font-black text-xs rounded-xl border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] cursor-pointer transition-all active:translate-y-0.5"
                      >
                        Extract Items →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: QUICK BATCH (TURBO GRID) */}
            {activeTab === "grid" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-0.5 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-navy-500 hidden sm:inline">
                      Press <kbd className="px-1 py-0.5 bg-white border border-navy-950/40 rounded text-[9px] font-mono font-bold">Enter</kbd> to add row
                    </span>

                    {/* Batch Date Selector */}
                    <div
                      className="relative bg-cream-100 hover:bg-cream-200 active:translate-y-0.5 rounded-lg border border-navy-950/60 px-2 py-1 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)] flex items-center gap-1.5 cursor-pointer transition-all"
                      title="Set date for batch entry"
                    >
                      <Calendar className="h-3 w-3 text-navy-700 pointer-events-none shrink-0" />
                      <span className="text-[10px] font-black text-navy-900 pointer-events-none whitespace-nowrap">
                        {formatDateBadge(batchDate)}
                      </span>
                      <input
                        type="date"
                        value={batchDate}
                        onChange={(e) => setBatchDate(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddTurboRow}
                    className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-navy-950 border border-navy-950 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)] flex items-center gap-1 cursor-pointer transition-all active:translate-y-0.5"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[3]" /> Add Row
                  </button>
                </div>

                {/* Grid Rows (Responsive 2-line cards to prevent horizontal squishing) */}
                <div className="max-h-[46vh] overflow-y-auto space-y-2 pr-0.5 overscroll-contain">
                  {turboRows.map((row, idx) => (
                    <div
                      key={row.id}
                      className="p-2.5 rounded-2xl bg-white border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] space-y-2"
                    >
                      {/* Line 1: Index + Note + Remove */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-navy-400 w-5 text-center shrink-0">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={row.note}
                          onChange={(e) => handleTurboRowChange(row.id, "note", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTurboRow();
                            }
                          }}
                          placeholder="Description (e.g. Chai, Groceries, Uber)"
                          className="flex-1 min-w-0 bg-cream-50/70 focus:bg-white rounded-lg border border-navy-950/30 focus:border-navy-950 px-2.5 py-1 text-xs font-bold text-navy-950 placeholder:text-navy-400 outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveTurboRow(row.id)}
                          className="p-1 rounded-lg text-navy-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          title="Remove row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Line 2: Amount + Category */}
                      <div className="flex items-center gap-2 pl-7">
                        <div className="relative w-28 shrink-0">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-navy-500 pointer-events-none">
                            {currencySymbol}
                          </span>
                          <input
                            type="number"
                            value={row.amount}
                            onChange={(e) => handleTurboRowChange(row.id, "amount", e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddTurboRow();
                              }
                            }}
                            placeholder="0"
                            className="w-full bg-cream-50/70 focus:bg-white rounded-lg border border-navy-950/40 focus:border-navy-950 pl-6 pr-2 py-1 text-xs font-black text-navy-950 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            autoFocus={idx === 0}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <NeoCategoryPicker
                            value={row.categoryId}
                            onChange={(val) => handleTurboRowChange(row.id, "categoryId", val)}
                            categories={expenseCategories}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleConvertTurboToReview}
                  className="w-full py-2.5 bg-emerald-400 hover:bg-emerald-500 text-navy-950 font-black text-xs rounded-xl border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] cursor-pointer flex items-center justify-center gap-1.5 transition-all active:translate-y-0.5"
                >
                  <span>Review Items</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </button>
              </div>
            )}
          </>
        ) : (
          /* --- REVIEW CHECKLIST (SENIOR DEV / PRODUCTION-GRADE) --- */
          <div className="space-y-3">
            {/* Header: Action Bar */}
            <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-navy-950 uppercase tracking-wide">
                  Review Items
                </span>
                <span className="text-[10px] font-black bg-amber-300 text-navy-950 px-2 py-0.5 rounded-full border border-navy-950">
                  {selectedReviewItems.length} of {reviewItems.length} selected
                </span>
                {incompleteCount > 0 && (
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-amber-700" />
                    <span>{incompleteCount} need{incompleteCount === 1 ? "s" : ""} info</span>
                  </span>
                )}
                {unfixedPhantomCount > 0 && (
                  <button
                    type="button"
                    onClick={handleFixAllPhantomRupees}
                    className="text-[10px] font-black bg-[#CEF431] hover:bg-[#b8dd24] text-navy-950 px-2 py-0.5 rounded-full border border-navy-950 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)] flex items-center gap-1 cursor-pointer transition-all active:translate-y-0.5"
                    title="Remove leading digits fused from ₹ symbol by OCR"
                  >
                    <Zap className="h-2.5 w-2.5 fill-navy-950 stroke-navy-950" />
                    <span>Fix {unfixedPhantomCount} Fused ₹</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSelectAll(selectedReviewItems.length !== reviewItems.length)}
                  className="text-[11px] font-bold text-navy-700 hover:text-navy-950 underline cursor-pointer"
                >
                  {selectedReviewItems.length === reviewItems.length ? "Deselect all" : "Select all"}
                </button>

                <button
                  type="button"
                  onClick={() => setIsReviewMode(false)}
                  className="text-[11px] font-black text-navy-800 bg-white hover:bg-cream-100 px-2 py-1 rounded-lg border border-navy-950 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)] cursor-pointer flex items-center gap-1 active:translate-y-0.5 transition-all"
                >
                  <RefreshCw className="h-3 w-3" /> New scan
                </button>
              </div>
            </div>

            {/* Checklist Items: Spacious, 2-tier card (NO horizontal squishing!) */}
            <div className="max-h-[48vh] overflow-y-auto space-y-2.5 pr-0.5 overscroll-contain">
              {reviewItems.length === 0 ? (
                <div className="text-center py-8 text-navy-400 space-y-2">
                  <p className="text-xs font-bold">No expenses left in queue.</p>
                  <button
                    type="button"
                    onClick={handleAddReviewRow}
                    className="text-xs font-black text-navy-950 underline cursor-pointer"
                  >
                    + Add an expense
                  </button>
                </div>
              ) : (
                reviewItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "p-3 rounded-2xl border-2 border-navy-950 transition-all space-y-2.5 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]",
                      item.selected ? "bg-white" : "bg-cream-50/50 border-dashed opacity-65"
                    )}
                  >
                    {/* Line 1: Checkbox + Merchant/Note (Full flex-1) + Trash */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectItem(item.id)}
                        className={cn(
                          "h-6 w-6 rounded-lg border-2 border-navy-950 flex items-center justify-center text-xs font-black cursor-pointer shrink-0 transition-all",
                          item.selected
                            ? "bg-emerald-400 text-navy-950 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]"
                            : "bg-white text-transparent"
                        )}
                        aria-label="Toggle select"
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </button>

                      <input
                        type="text"
                        value={item.note}
                        onChange={(e) => handleUpdateReviewItem(item.id, "note", e.target.value)}
                        placeholder="Merchant / Note"
                        className="flex-1 min-w-0 bg-cream-50/70 focus:bg-white rounded-lg border border-navy-950/30 focus:border-navy-950 px-2.5 py-1 text-xs font-black text-navy-950 placeholder:text-navy-400 outline-none transition-colors"
                      />

                      {item.isIncomplete && (
                        <span className="text-[10px] font-black bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded border border-amber-950/40 flex items-center gap-1 shrink-0">
                          <AlertCircle className="h-3 w-3 text-amber-800" />
                          <span>Needs info</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveReviewItem(item.id)}
                        className="p-1 rounded-lg text-navy-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Line 2: Amount + Category + Date Pill + Payment Method */}
                    <div className="flex items-center gap-2 pl-8 flex-wrap sm:flex-nowrap">
                      {/* Amount Input */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="relative w-24 sm:w-28 shrink-0">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-navy-600 pointer-events-none">
                            {currencySymbol}
                          </span>
                          <input
                            type="number"
                            value={item.amount || ""}
                            onChange={(e) =>
                              handleUpdateReviewItem(item.id, "amount", parseFloat(e.target.value) || 0)
                            }
                            placeholder={item.amount <= 0 ? "Enter ₹" : "0"}
                            className={cn(
                              "w-full rounded-lg pl-6 pr-2 py-1 text-xs font-black text-navy-950 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all",
                              item.amount <= 0
                                ? "bg-amber-50 border-2 border-dashed border-amber-500 placeholder:text-amber-800/60 focus:border-navy-950 ring-1 ring-amber-300"
                                : "bg-cream-50/70 focus:bg-white border border-navy-950/40 focus:border-navy-950"
                            )}
                          />
                        </div>

                        {item.phantomRupeeDetected && item.suggestedAmount !== undefined && (
                          <button
                            type="button"
                            onClick={() => handleTogglePhantomRupee(item.id)}
                            className={cn(
                              "inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg border border-navy-950 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)] transition-all active:translate-y-0.5 cursor-pointer shrink-0",
                              item.isPhantomFixed
                                ? "bg-cream-100 text-navy-600 hover:bg-cream-200"
                                : "bg-[#CEF431] text-navy-950 hover:bg-[#b8dd24]"
                            )}
                            title={
                              item.isPhantomFixed
                                ? `Revert back to ₹${item.originalAmount}`
                                : `Tesseract fused '₹' with amount. Tap to use ₹${item.suggestedAmount}`
                            }
                          >
                            <Zap className="h-2.5 w-2.5 fill-current stroke-current" />
                            <span>{item.isPhantomFixed ? `Revert (${item.originalAmount})` : `Use ₹${item.suggestedAmount}`}</span>
                          </button>
                        )}
                      </div>

                      {/* Category Dropdown */}
                      <div className="flex-1 min-w-[120px]">
                        <NeoCategoryPicker
                          value={item.categoryId}
                          onChange={(val) => handleUpdateReviewItem(item.id, "categoryId", val)}
                          categories={expenseCategories}
                        />
                      </div>

                      {/* Date Badge (Interactive) */}
                      <div
                        className="relative bg-cream-100 hover:bg-cream-200 active:translate-y-0.5 rounded-lg border border-navy-950/60 px-2 py-1 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)] flex items-center gap-1 shrink-0 cursor-pointer transition-all"
                        title="Change transaction date"
                      >
                        <Calendar className="h-3 w-3 stroke-[2.5] text-navy-700 pointer-events-none shrink-0" />
                        <span className="text-[10px] font-black text-navy-900 pointer-events-none whitespace-nowrap">
                          {formatDateBadge(item.date)}
                        </span>
                        <input
                          type="date"
                          value={item.date}
                          onChange={(e) => handleUpdateReviewItem(item.id, "date", e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </div>

                      {/* Payment Method Selector */}
                      <NeoPaymentMethodPicker
                        value={item.paymentMethod || "UPI"}
                        onChange={(val) => handleUpdateReviewItem(item.id, "paymentMethod", val)}
                      />
                    </div>
                  </div>
                ))
              )}

              {/* Add Manual Item Button */}
              <button
                type="button"
                onClick={handleAddReviewRow}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-navy-950/30 hover:border-navy-950 text-navy-800 hover:bg-amber-50/60 text-xs font-black cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="h-4 w-4 stroke-[3]" /> Add item manually
              </button>
            </div>

            {/* Commit Footer: Modern, spacious action bar */}
            <div className="pt-3 border-t-2 border-navy-950/10 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-navy-500">
                  Total Selected
                </div>
                <div className="text-base sm:text-lg font-black text-navy-950 tracking-tight">
                  {currencySymbol}{totalSelectedAmount.toLocaleString()}
                  <span className="text-[11px] font-bold text-navy-500 ml-1.5">
                    ({selectedReviewItems.length} {selectedReviewItems.length === 1 ? "item" : "items"})
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={bulkAddMutation.isPending || selectedReviewItems.length === 0}
                onClick={handleSaveAll}
                className="py-2.5 px-4 sm:px-5 bg-emerald-400 hover:bg-emerald-500 disabled:opacity-40 text-navy-950 font-black text-xs sm:text-sm rounded-xl border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] cursor-pointer flex items-center gap-2 active:translate-y-0.5 transition-all shrink-0"
              >
                {bulkAddMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Save Expenses</span>
                    <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </ResponsiveFormContainer>
  );
}
