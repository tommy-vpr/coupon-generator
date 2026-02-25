"use client";

import { useState, useEffect, useRef } from "react";

interface BrandInfo {
  id: string;
  name: string;
  domain: string;
  allowedOrigin: string;
  logo: string;
  color: string;
}

interface BrandSwitcherProps {
  onSwitch?: (brand: BrandInfo) => void;
}

// Assign a consistent color to each brand for visual distinction
const BRAND_COLORS = [
  {
    bg: "bg-emerald-500",
    ring: "shadow-emerald-400/50",
    dot: "bg-emerald-400",
  },
  { bg: "bg-violet-500", ring: "shadow-violet-400/50", dot: "bg-violet-400" },
  { bg: "bg-amber-500", ring: "shadow-amber-400/50", dot: "bg-amber-400" },
  { bg: "bg-sky-500", ring: "shadow-sky-400/50", dot: "bg-sky-400" },
  { bg: "bg-rose-500", ring: "shadow-rose-400/50", dot: "bg-rose-400" },
  { bg: "bg-teal-500", ring: "shadow-teal-400/50", dot: "bg-teal-400" },
  { bg: "bg-orange-500", ring: "shadow-orange-400/50", dot: "bg-orange-400" },
  { bg: "bg-indigo-500", ring: "shadow-indigo-400/50", dot: "bg-indigo-400" },
  { bg: "bg-pink-500", ring: "shadow-pink-400/50", dot: "bg-pink-400" },
  { bg: "bg-cyan-500", ring: "shadow-cyan-400/50", dot: "bg-cyan-400" },
];

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Shows brand logo if available, falls back to colored initials */
function BrandAvatar({
  brand,
  colorClass,
  size = "sm",
}: {
  brand: BrandInfo;
  colorClass: string;
  size?: "sm" | "md";
}) {
  const dims = size === "sm" ? "w-12 h-6" : "w-16 h-12";
  const textSize = size === "sm" ? "text-[9px]" : "text-[10px]";
  const rounded = size === "sm" ? "rounded-md" : "rounded-lg";

  if (brand.logo) {
    return (
      <div
        className={`${dims} ${rounded} overflow-hidden flex-shrink-0 px-2`}
        style={brand.color ? { backgroundColor: brand.color } : undefined}
      >
        <img
          src={brand.logo}
          alt={brand.name}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`${dims} ${rounded} flex items-center justify-center flex-shrink-0 ${!brand.color ? colorClass : ""}`}
      style={brand.color ? { backgroundColor: brand.color } : undefined}
    >
      <span className={`${textSize} font-bold text-white leading-none`}>
        {getInitials(brand.name)}
      </span>
    </div>
  );
}

export default function BrandSwitcher({ onSwitch }: BrandSwitcherProps) {
  const [brands, setBrands] = useState<BrandInfo[]>([]);
  const [activeBrandId, setActiveBrandId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/brands");
        const data = await res.json();
        if (data.success) {
          setBrands(data.data.brands);
          setActiveBrandId(data.data.activeBrandId);
        }
      } catch {
        // silently fail
      }
    }
    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeIndex = brands.findIndex((b) => b.id === activeBrandId);
  const activeBrand = brands[activeIndex];
  const activeColor = BRAND_COLORS[activeIndex % BRAND_COLORS.length];

  const handleSwitch = async (brand: BrandInfo, idx: number) => {
    if (brand.id === activeBrandId) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: brand.id }),
      });
      const data = await res.json();

      if (data.success) {
        setActiveBrandId(brand.id);
        setIsOpen(false);
        onSwitch?.(brand);
      }
    } catch {
      // handle error
    } finally {
      setIsSwitching(false);
    }
  };

  if (brands.length === 0) return null;

  // Single brand — static pill
  if (brands.length === 1 && activeBrand) {
    return (
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-surface-200 border border-surface-300/50">
        <BrandAvatar
          brand={activeBrand}
          colorClass={activeColor.bg}
          size="sm"
        />
        <span className="text-xs font-medium text-zinc-300">
          {activeBrand.name}
        </span>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className={`
          flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all group
          ${
            isOpen
              ? "bg-surface-300 border-surface-400"
              : "bg-surface-200 border-surface-300/50 hover:border-surface-400"
          }
        `}
      >
        {activeBrand && activeColor && (
          <BrandAvatar
            brand={activeBrand}
            colorClass={`${activeColor.bg} shadow-sm`}
            size="sm"
          />
        )}
        {/* <span className="text-xs font-medium text-zinc-300 max-w-[140px] truncate">
          {isSwitching ? "Switching..." : activeBrand?.name || "Select Brand"}
        </span> */}
        <svg
          className={`w-3 h-3 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-72 bg-surface-100 border border-surface-300/60 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
          style={{ animation: "slideIn 0.15s ease-out" }}
        >
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-surface-300/30 bg-surface-50/50">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
              Switch Brand
            </span>
          </div>

          {/* Brand List */}
          <div className="py-1.5">
            {brands.map((brand, idx) => {
              const isActive = brand.id === activeBrandId;
              const color = BRAND_COLORS[idx % BRAND_COLORS.length];

              return (
                <button
                  key={brand.id}
                  onClick={() => handleSwitch(brand, idx)}
                  disabled={isSwitching}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left transition-all
                    ${isActive ? "bg-surface-200/60" : "hover:bg-surface-200/40"}
                  `}
                >
                  {/* Brand Avatar */}
                  <BrandAvatar
                    brand={brand}
                    colorClass={`${color.bg} ${isActive ? `shadow-sm ${color.ring}` : "opacity-70"}`}
                    size="md"
                  />

                  {/* Brand Info */}
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm font-medium truncate ${isActive ? "text-zinc-100" : "text-zinc-300"}`}
                    >
                      {brand.name}
                    </div>
                    {(brand.allowedOrigin || brand.domain) && (
                      <div className="text-[10px] text-zinc-600 truncate font-mono mt-0.5">
                        {brand.allowedOrigin || brand.domain}
                      </div>
                    )}
                  </div>

                  {/* Active Indicator */}
                  {isActive && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${color.dot} shadow-sm ${color.ring}`}
                      />
                      <span className="text-[10px] font-medium text-zinc-500">
                        Active
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-surface-300/20">
            <p className="text-[10px] text-zinc-600">
              Switching brands changes which Shopify store receives your
              discount codes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
