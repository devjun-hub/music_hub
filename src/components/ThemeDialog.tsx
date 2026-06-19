"use client";

import { useEffect, useRef } from "react";
import { THEMES, ThemeId, useTheme } from "@/lib/theme";

interface ThemeDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ThemeDialog({ open, onClose }: ThemeDialogProps) {
  const { theme, setTheme } = useTheme();
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="테마 선택"
        className="w-full max-w-xs rounded-2xl p-6"
        style={{
          background: "rgba(18,18,20,0.97)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
          backdropFilter: "blur(24px)",
        }}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">테마 선택</h2>
            <p className="mt-0.5 text-xs text-foreground-muted">Primary 색상을 변경합니다</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-surface-border hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none">
              <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Theme swatches */}
        <div className="grid grid-cols-5 gap-2">
          {THEMES.map((t) => {
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id as ThemeId)}
                aria-label={`${t.label} 테마`}
                aria-pressed={isActive}
                className="group flex flex-col items-center gap-2 rounded-xl p-2.5 transition-all duration-200"
                style={{
                  background: isActive ? `${t.color}18` : "transparent",
                  border: `1px solid ${isActive ? t.color : "rgba(255,255,255,0.07)"}`,
                  boxShadow: isActive ? `0 0 14px ${t.color}50` : "none",
                }}
              >
                <div
                  className="h-7 w-7 rounded-full transition-all duration-200"
                  style={{
                    background: t.color,
                    boxShadow: isActive
                      ? `0 0 10px ${t.color}, 0 0 20px ${t.color}60`
                      : `0 0 0px transparent`,
                  }}
                />
                <span
                  className="text-[10px] font-medium leading-none"
                  style={{ color: isActive ? t.color : "#71717a" }}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-center text-[11px] text-foreground-muted/60">
          선택한 테마는 자동으로 저장됩니다
        </p>
      </div>
    </div>
  );
}
