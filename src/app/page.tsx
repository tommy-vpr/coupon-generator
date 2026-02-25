"use client";

import { useState, useCallback, useEffect } from "react";
import { generateCode, generateBatchCodes, formatDate } from "@/lib/utils";
import BrandSwitcher from "@/components/BrandSwitcher";

// ─── Types ────────────────────────────────────────────────

type DiscountType = "fixed_amount" | "percentage";
type Mode = "single" | "batch";
type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface GeneratedCode {
  code: string;
  status: "pending" | "created" | "failed";
  error?: string;
}

interface PriceRuleData {
  id: number;
  title: string;
  value_type: string;
  value: string;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
}

// ─── Toast System ─────────────────────────────────────────

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-enter flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border backdrop-blur-sm max-w-sm ${
            toast.type === "success"
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : toast.type === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-blue-500/10 border-blue-500/20 text-blue-400"
          }`}
        >
          <span className="text-sm font-medium flex-1">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-current opacity-50 hover:opacity-100 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────

function TagIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 6h.008v.008H6V6z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpinnerIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={`${className} animate-spin`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function CouponGeneratorPage() {
  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // User state
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success) setCurrentUser(data.data);
      } catch {
        // not logged in
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/login";
  };

  // Mode & form state
  const [mode, setMode] = useState<Mode>("batch");
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState<string>("10");
  const [prefix, setPrefix] = useState<string>("SAVE");
  const [codeLength, setCodeLength] = useState<number>(8);
  const [batchCount, setBatchCount] = useState<number>(10);
  const [title, setTitle] = useState<string>("");
  const [scheduleMode, setScheduleMode] = useState<"immediate" | "scheduled">(
    "immediate",
  );
  const [startsAt, setStartsAt] = useState<string>(
    new Date().toISOString().slice(0, 16),
  );
  const [endsAt, setEndsAt] = useState<string>("");
  const [usageLimit, setUsageLimit] = useState<string>("");
  const [oncePerCustomer, setOncePerCustomer] = useState<boolean>(true);

  // Generated codes state
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewCode, setPreviewCode] = useState<string>("");

  // History
  const [recentRules, setRecentRules] = useState<PriceRuleData[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(false);

  // Brand state
  const [activeBrandName, setActiveBrandName] = useState<string>("");

  // Update preview when settings change
  useEffect(() => {
    setPreviewCode(generateCode(prefix, codeLength));
  }, [prefix, codeLength]);

  // Auto-generate title
  useEffect(() => {
    const typeLabel = discountType === "percentage" ? "%" : "$";
    const modeLabel = mode === "single" ? "Single" : `Batch (${batchCount})`;
    setTitle(`${discountValue}${typeLabel} Off — ${modeLabel}`);
  }, [discountType, discountValue, mode, batchCount]);

  // Load recent price rules
  const loadRecentRules = useCallback(async () => {
    setIsLoadingRules(true);
    try {
      const res = await fetch("/api/price-rules");
      const data = await res.json();
      if (data.success) {
        setRecentRules(data.data?.slice(0, 10) || []);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoadingRules(false);
    }
  }, []);

  useEffect(() => {
    loadRecentRules();
  }, [loadRecentRules]);

  // Brand switch handler — clears state and reloads for new store
  const handleBrandSwitch = useCallback(
    (brand: { id: string; name: string; domain: string }) => {
      setActiveBrandName(brand.name);
      setGeneratedCodes([]);
      setRecentRules([]);
      addToast("info", `Switched to ${brand.name}`);
      setTimeout(() => {
        loadRecentRules();
      }, 100);
    },
    [loadRecentRules, addToast],
  );

  // ─── Generate Handler ─────────────────────────────────

  const handleGenerate = async () => {
    if (!discountValue || Number(discountValue) <= 0) {
      addToast("error", "Please enter a valid discount value");
      return;
    }

    if (discountType === "percentage" && Number(discountValue) > 100) {
      addToast("error", "Percentage cannot exceed 100%");
      return;
    }

    setIsGenerating(true);

    try {
      // Step 1: Create price rule
      const priceRuleRes = await fetch("/api/price-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          value_type: discountType,
          value: discountValue,
          starts_at:
            scheduleMode === "immediate"
              ? new Date().toISOString()
              : new Date(startsAt).toISOString(),
          ...(scheduleMode === "scheduled" &&
            endsAt && { ends_at: new Date(endsAt).toISOString() }),
          ...(usageLimit && { usage_limit: Number(usageLimit) }),
          once_per_customer: oncePerCustomer,
        }),
      });

      const priceRuleData = await priceRuleRes.json();

      if (!priceRuleData.success) {
        throw new Error(priceRuleData.error || "Failed to create price rule");
      }

      const priceRuleId = priceRuleData.data.id;
      addToast("success", `Price rule created: ${title}`);

      // Step 2: Generate codes
      if (mode === "single") {
        const code = generateCode(prefix, codeLength);
        setGeneratedCodes([{ code, status: "pending" }]);

        const codeRes = await fetch("/api/discount-codes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ price_rule_id: priceRuleId, code }),
        });

        const codeData = await codeRes.json();

        if (codeData.success) {
          setGeneratedCodes([{ code, status: "created" }]);
          addToast("success", `Code created: ${code}`);
        } else {
          setGeneratedCodes([
            { code, status: "failed", error: codeData.error },
          ]);
          addToast("error", `Failed to create code: ${codeData.error}`);
        }
      } else {
        // Batch mode
        const codes = generateBatchCodes(prefix, codeLength, batchCount);
        setGeneratedCodes(
          codes.map((code) => ({ code, status: "pending" as const })),
        );

        const batchRes = await fetch("/api/discount-codes/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ price_rule_id: priceRuleId, codes }),
        });

        const batchData = await batchRes.json();

        if (batchData.success) {
          setGeneratedCodes(
            codes.map((code) => ({ code, status: "created" as const })),
          );
          addToast(
            "success",
            `Batch created: ${batchData.data.total_created} codes`,
          );
        } else {
          // Mark all as failed but still show them
          setGeneratedCodes(
            codes.map((code) => ({
              code,
              status: "failed" as const,
              error: batchData.error,
            })),
          );
          addToast("error", batchData.error || "Batch creation failed");
        }
      }

      // Refresh rules list
      loadRecentRules();
    } catch (error) {
      addToast(
        "error",
        error instanceof Error ? error.message : "An error occurred",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Utility Handlers ─────────────────────────────────

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast("info", "Copied to clipboard");
  };

  const copyAllCodes = () => {
    const allCodes = generatedCodes.map((c) => c.code).join("\n");
    navigator.clipboard.writeText(allCodes);
    addToast("info", `${generatedCodes.length} codes copied`);
  };

  const exportCSV = () => {
    const csv = [
      "Code,Status",
      ...generatedCodes.map((c) => `${c.code},${c.status}`),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coupons-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("info", "CSV exported");
  };

  const clearCodes = () => {
    setGeneratedCodes([]);
    addToast("info", "Codes cleared");
  };

  const resetForm = () => {
    setMode("batch");
    setDiscountType("percentage");
    setDiscountValue("10");
    setPrefix("SAVE");
    setCodeLength(8);
    setBatchCount(10);
    setScheduleMode("immediate");
    setEndsAt("");
    setUsageLimit("");
    setOncePerCustomer(true);
    setStartsAt(new Date().toISOString().slice(0, 16));
    setGeneratedCodes([]);
    addToast("info", "Form reset");
  };

  // ─── Render ───────────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface-0">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <header className="border-b border-surface-300/50 bg-surface-50/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TagIcon className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">
                Coupon Generator
              </h1>
              <p className="text-[11px] text-zinc-500">Shopify Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BrandSwitcher onSwitch={handleBrandSwitch} />
            {currentUser && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-200 border border-surface-300/50">
                  <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-green-400">
                      {currentUser.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-zinc-400">
                    {currentUser.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-surface-200 transition"
                  title="Sign out"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── Left: Generator Form ─────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mode Toggle */}
            <div className="bg-surface-100 rounded-xl border border-surface-300/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-zinc-100">
                  Generate Codes
                </h2>
                <div className="flex bg-surface-200 rounded-lg p-0.5">
                  {(["single", "batch"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                        mode === m
                          ? "bg-surface-400 text-zinc-100 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {m === "single" ? "Single Code" : "Batch Codes"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount Type */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    Discount Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        {
                          value: "percentage",
                          label: "Percentage",
                          icon: "%",
                          desc: "Off order total",
                        },
                        {
                          value: "fixed_amount",
                          label: "Fixed Amount",
                          icon: "$",
                          desc: "Dollar discount",
                        },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setDiscountType(opt.value)}
                        className={`relative flex items-center gap-3 p-4 rounded-lg border transition-all text-left ${
                          discountType === opt.value
                            ? "border-green-500/40 bg-green-500/5"
                            : "border-surface-300/50 bg-surface-200/50 hover:border-surface-400"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                            discountType === opt.value
                              ? "bg-green-500/10 text-green-400"
                              : "bg-surface-300/50 text-zinc-500"
                          }`}
                        >
                          {opt.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-zinc-200">
                            {opt.label}
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            {opt.desc}
                          </div>
                        </div>
                        {discountType === opt.value && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Value & Title Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2">
                      Discount Value
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                        {discountType === "percentage" ? "%" : "$"}
                      </span>
                      <input
                        type="number"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="w-full bg-surface-200 border border-surface-300/50 rounded-lg pl-8 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition"
                        placeholder="10"
                        min="0"
                        max={discountType === "percentage" ? "100" : undefined}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2">
                      Rule Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-surface-200 border border-surface-300/50 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition"
                      placeholder="Summer Sale 20%"
                    />
                  </div>
                </div>

                {/* Code Settings */}
                <div className="pt-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-3">
                    Code Format
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1.5">
                        Prefix
                      </label>
                      <input
                        type="text"
                        value={prefix}
                        onChange={(e) =>
                          setPrefix(
                            e.target.value
                              .toUpperCase()
                              .replace(/[^A-Z0-9]/g, ""),
                          )
                        }
                        className="w-full bg-surface-200 border border-surface-300/50 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition"
                        placeholder="SAVE"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1.5">
                        Random Length
                      </label>
                      <input
                        type="number"
                        value={codeLength}
                        onChange={(e) =>
                          setCodeLength(
                            Math.max(4, Math.min(16, Number(e.target.value))),
                          )
                        }
                        className="w-full bg-surface-200 border border-surface-300/50 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition"
                        min="4"
                        max="16"
                      />
                    </div>
                    {mode === "batch" && (
                      <div>
                        <label className="block text-[11px] text-zinc-500 mb-1.5">
                          # of Codes
                        </label>
                        <input
                          type="number"
                          value={batchCount}
                          onChange={(e) =>
                            setBatchCount(
                              Math.max(
                                1,
                                Math.min(500, Number(e.target.value)),
                              ),
                            )
                          }
                          className="w-full bg-surface-200 border border-surface-300/50 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono placeholder-zinc-600 focus:outline-none focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition"
                          min="1"
                          max="500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Preview */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[11px] text-zinc-500">Preview:</span>
                    <code className="text-xs font-mono text-green-400 bg-green-500/5 border border-green-500/10 px-2 py-0.5 rounded">
                      {previewCode}
                    </code>
                    <button
                      onClick={() =>
                        setPreviewCode(generateCode(prefix, codeLength))
                      }
                      className="text-[11px] text-zinc-500 hover:text-zinc-300 transition"
                    >
                      ↻ refresh
                    </button>
                  </div>
                </div>

                {/* Schedule & Limits */}
                <div className="pt-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-3">
                    Activation
                  </label>

                  {/* Immediate vs Scheduled toggle */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      {
                        value: "immediate" as const,
                        label: "Active Immediately",
                        desc: "Starts right now",
                        icon: (
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path
                              d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ),
                      },
                      {
                        value: "scheduled" as const,
                        label: "Schedule",
                        desc: "Set start & end dates",
                        icon: (
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path
                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ),
                      },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setScheduleMode(opt.value)}
                        className={`relative flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                          scheduleMode === opt.value
                            ? "border-green-500/40 bg-green-500/5"
                            : "border-surface-300/50 bg-surface-200/50 hover:border-surface-400"
                        }`}
                      >
                        <div
                          className={`flex-shrink-0 ${
                            scheduleMode === opt.value
                              ? "text-green-400"
                              : "text-zinc-500"
                          }`}
                        >
                          {opt.icon}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-zinc-200">
                            {opt.label}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            {opt.desc}
                          </div>
                        </div>
                        {scheduleMode === opt.value && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-400" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Date fields — only when scheduled */}
                  {scheduleMode === "scheduled" && (
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-[11px] text-zinc-500 mb-1.5">
                          Start Date
                        </label>
                        <input
                          type="datetime-local"
                          value={startsAt}
                          onChange={(e) => setStartsAt(e.target.value)}
                          className="w-full bg-surface-200 border border-surface-300/50 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition [color-scheme:dark]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-500 mb-1.5">
                          End Date{" "}
                          <span className="text-zinc-600">(optional)</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={endsAt}
                          onChange={(e) => setEndsAt(e.target.value)}
                          className="w-full bg-surface-200 border border-surface-300/50 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1.5">
                        Total Usage Limit{" "}
                        <span className="text-zinc-600">(optional)</span>
                      </label>
                      <input
                        type="number"
                        value={usageLimit}
                        onChange={(e) => setUsageLimit(e.target.value)}
                        className="w-full bg-surface-200 border border-surface-300/50 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 transition"
                        placeholder="Unlimited"
                        min="1"
                      />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={oncePerCustomer}
                            onChange={(e) =>
                              setOncePerCustomer(e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-surface-400 rounded-full peer-checked:bg-green-500/60 transition-colors" />
                          <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-zinc-200 rounded-full peer-checked:translate-x-4 transition-transform shadow-sm" />
                        </div>
                        <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition">
                          Once per customer
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="pt-4 flex gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-all active:scale-[0.99] shadow-lg shadow-green-900/20"
                  >
                    {isGenerating ? (
                      <>
                        <SpinnerIcon className="w-4 h-4" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <TagIcon className="w-4 h-4" />
                        <span>
                          Generate{" "}
                          {mode === "single" ? "Code" : `${batchCount} Codes`}
                        </span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetForm}
                    disabled={isGenerating}
                    className="px-4 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 bg-surface-200 hover:bg-surface-300 border border-surface-300/50 transition disabled:opacity-50"
                    title="Reset form"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* ─── Generated Codes Results ────────────── */}
            {generatedCodes.length > 0 && (
              <div className="bg-surface-100 rounded-xl border border-surface-300/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-zinc-100">
                    Generated Codes
                    <span className="ml-2 text-xs font-normal text-zinc-500">
                      ({generatedCodes.length})
                    </span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyAllCodes}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-surface-200 hover:bg-surface-300 border border-surface-300/50 transition"
                    >
                      <CopyIcon className="w-3.5 h-3.5" />
                      Copy All
                    </button>
                    <button
                      onClick={exportCSV}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-surface-200 hover:bg-surface-300 border border-surface-300/50 transition"
                    >
                      <DownloadIcon className="w-3.5 h-3.5" />
                      CSV
                    </button>
                    <button
                      onClick={clearCodes}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400/70 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 transition"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Clear
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                  {generatedCodes.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-200/50 hover:bg-surface-200 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === "created"
                              ? "bg-green-400"
                              : item.status === "failed"
                                ? "bg-red-400"
                                : "bg-yellow-400 animate-pulse"
                          }`}
                        />
                        <code className="text-sm font-mono text-zinc-200">
                          {item.code}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-medium ${
                            item.status === "created"
                              ? "text-green-400"
                              : item.status === "failed"
                                ? "text-red-400"
                                : "text-yellow-400"
                          }`}
                        >
                          {item.status}
                        </span>
                        <button
                          onClick={() => copyToClipboard(item.code)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-300 text-zinc-500 hover:text-zinc-300 transition-all"
                        >
                          <CopyIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ─── Right Sidebar: Recent Rules ──────── */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-surface-100 rounded-xl border border-surface-300/50 p-6">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">
                Session Summary
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-200/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-zinc-100 font-mono">
                    {
                      generatedCodes.filter((c) => c.status === "created")
                        .length
                    }
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Codes Created
                  </div>
                </div>
                <div className="bg-surface-200/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-zinc-100 font-mono">
                    {generatedCodes.filter((c) => c.status === "failed").length}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">Failed</div>
                </div>
              </div>
            </div>

            {/* Recent Price Rules */}
            <div className="bg-surface-100 rounded-xl border border-surface-300/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Recent Price Rules
                </h3>
                <button
                  onClick={loadRecentRules}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 transition"
                >
                  ↻ refresh
                </button>
              </div>

              {isLoadingRules ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 pulse-dot" />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 pulse-dot" />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 pulse-dot" />
                  </div>
                </div>
              ) : recentRules.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-zinc-600 text-sm">No rules yet</div>
                  <div className="text-zinc-700 text-xs mt-1">
                    Generate codes to create price rules
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {recentRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-3 rounded-lg bg-surface-200/50 border border-surface-300/30 hover:border-surface-400/50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-zinc-200 truncate">
                            {rule.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                rule.value_type === "percentage"
                                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              }`}
                            >
                              {rule.value_type === "percentage"
                                ? `${Math.abs(Number(rule.value))}%`
                                : `$${Math.abs(Number(rule.value))}`}
                            </span>
                            <span className="text-[10px] text-zinc-600">
                              {formatDate(rule.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Card */}
            <div className="bg-surface-100 rounded-xl border border-surface-300/50 p-6">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                How It Works
              </h3>
              <div className="space-y-3">
                {[
                  {
                    step: "1",
                    text: "Configure discount type, value, and code format",
                  },
                  {
                    step: "2",
                    text: "A Shopify Price Rule is auto-created for your discount",
                  },
                  {
                    step: "3",
                    text: "Discount codes are generated and linked to the rule",
                  },
                  {
                    step: "4",
                    text: "Copy codes or export as CSV to distribute",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-surface-300 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                      {item.step}
                    </span>
                    <span className="text-xs text-zinc-400 leading-relaxed">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
