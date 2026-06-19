"use client";

import { formatDuration } from "@/lib/format";

interface TransportBarProps {
  isPlaying: boolean;
  position: number;
  totalDuration: number;
  onTogglePlay: () => void;
  disabled?: boolean;
}

/** 전체 트랙/셀 동시 재생/정지 + 현재 위치 / 전체 길이 표시. */
export function TransportBar({
  isPlaying,
  position,
  totalDuration,
  onTogglePlay,
  disabled,
}: TransportBarProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border p-3"
      style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}
    >
      <button
        type="button"
        onClick={onTogglePlay}
        disabled={disabled || totalDuration <= 0}
        aria-pressed={isPlaying}
        className={`min-h-14 min-w-28 rounded-full text-base font-semibold transition-all disabled:opacity-40 ${
          isPlaying
            ? "bg-accent-active text-black"
            : "border border-surface-border text-foreground hover:border-foreground-muted"
        }`}
        style={isPlaying ? { boxShadow: "0 0 16px var(--primary-glow)" } : {}}
      >
        {isPlaying ? "정지" : "재생"}
      </button>
      <span className="font-mono text-sm tabular-nums text-foreground-muted">
        {formatDuration(position * 1000)} / {formatDuration(totalDuration * 1000)}
      </span>
    </div>
  );
}
