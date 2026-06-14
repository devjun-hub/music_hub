"use client";

import { DRUM_MODES, type DrumMode } from "@/lib/constants";

const MODE_LABELS: Record<DrumMode, string> = {
  pad: "패드",
  kit: "드럼 키트",
};

interface DrumModeToggleProps {
  mode: DrumMode;
  onChange: (mode: DrumMode) => void;
}

/** 연주 화면을 MPC 스타일 패드 그리드 / 실제 드럼 키트 모형 중에서 고르는 토글 */
export function DrumModeToggle({ mode, onChange }: DrumModeToggleProps) {
  return (
    <div
      role="group"
      aria-label="드럼 연주 화면 선택"
      className="inline-flex rounded-full border border-surface-border bg-surface p-1"
    >
      {DRUM_MODES.map((value) => {
        const isActive = value === mode;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(value)}
            className={`min-h-9 rounded-full px-4 text-sm font-medium transition-colors ${
              isActive
                ? "bg-accent-active text-black"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            {MODE_LABELS[value]}
          </button>
        );
      })}
    </div>
  );
}
