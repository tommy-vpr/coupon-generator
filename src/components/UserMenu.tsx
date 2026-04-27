"use client";

import { useEffect, useRef, useState } from "react";

interface UserMenuProps {
  user: { name: string; role: string };
  onLogout: () => void;
}

export default function UserMenu({ user, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = user.name?.charAt(0).toUpperCase() || "U";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Desktop: pill + explicit Logout */}
      <div className="hidden sm:flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-200 border border-surface-300/50">
          <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <span className="text-[8px] font-bold text-green-400">
              {initial}
            </span>
          </div>
          <span className="text-[11px] font-medium text-zinc-300">
            {user.name}
          </span>
        </div>
        <button
          onClick={onLogout}
          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-400 hover:bg-surface-200 transition text-xs flex items-center gap-1"
          title="Sign out"
        >
          Logout
          <LogoutIcon />
        </button>
      </div>

      {/* Mobile: avatar button → dropdown */}
      <div ref={ref} className="relative sm:hidden">
        <button
          onClick={() => setIsOpen((v) => !v)}
          aria-label="User menu"
          aria-expanded={isOpen}
          className={`w-8 h-8 rounded-full flex items-center justify-center border transition ${
            isOpen
              ? "bg-surface-300 border-surface-400"
              : "bg-surface-200 border-surface-300/50 hover:border-surface-400"
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-green-400">
              {initial}
            </span>
          </div>
        </button>

        {isOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-52 bg-surface-100 border border-surface-300/60 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
            style={{ animation: "slideIn 0.15s ease-out" }}
          >
            {/* User info */}
            <div className="px-3 py-2.5 border-b border-surface-300/30 bg-surface-50/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold text-green-400">
                    {initial}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-zinc-200 truncate">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-zinc-500 capitalize truncate">
                    {user.role}
                  </div>
                </div>
              </div>
            </div>

            {/* Sign out */}
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-rose-400 hover:bg-surface-200/40 transition text-xs"
            >
              <LogoutIcon />
              Sign out
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function LogoutIcon() {
  return (
    <svg
      className="w-4 h-4"
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
  );
}
