"use client";

import { formatDuration } from "@/lib/format";

interface RecordingMonitorDialogProps {
  isOpen: boolean;
  elapsedMs: number;
  isMonitoring: boolean;
  onToggleMonitoring: () => void;
  onStop: () => void;
}

/** 녹음 중에 화면 하단에 고정되는 glass morphism 다이얼로그.
 *  자신의 목소리 모니터링 토글과 이어폰 착용 안내를 표시한다. */
export function RecordingMonitorDialog({
  isOpen,
  elapsedMs,
  isMonitoring,
  onToggleMonitoring,
  onStop,
}: RecordingMonitorDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="보컬 녹음 중"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 w-[min(90vw,360px)] -translate-x-1/2 rounded-2xl p-5"
      style={{
        background: "rgba(9,9,11,0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {/* 녹음 인디케이터 */}
      <div className="mb-4 flex items-center gap-3">
        <span
          aria-hidden
          className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-accent-record"
          style={{ boxShadow: "0 0 8px rgba(239,68,68,0.7)" }}
        />
        <span className="text-sm font-semibold text-foreground">보컬 녹음 중</span>
        <span className="ml-auto font-mono text-sm tabular-nums text-foreground-muted">
          {formatDuration(elapsedMs)}
        </span>
      </div>

      {/* 이어폰 안내 */}
      <p className="mb-4 text-xs leading-relaxed text-foreground-muted">
        {isMonitoring
          ? "🎧 이어폰을 착용하면 에코·하울링 없이 깨끗하게 들려요."
          : "내 목소리 듣기를 켜면 녹음하면서 실시간으로 자신의 목소리를 들을 수 있어요."}
      </p>

      {/* 모니터링 토글 */}
      <button
        type="button"
        onClick={onToggleMonitoring}
        aria-pressed={isMonitoring}
        className="mb-3 flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
        style={{
          background: isMonitoring ? "var(--primary-dim)" : "rgba(255,255,255,0.05)",
          border: isMonitoring
            ? "1px solid var(--primary-glow)"
            : "1px solid rgba(255,255,255,0.1)",
          color: isMonitoring ? "var(--accent-active)" : "var(--foreground-muted)",
          boxShadow: isMonitoring ? "0 0 10px var(--primary-glow)" : "none",
        }}
      >
        <span>🎧 내 목소리 듣기</span>
        <span className="font-semibold">{isMonitoring ? "ON" : "OFF"}</span>
      </button>

      {/* 녹음 중지 */}
      <button
        type="button"
        onClick={onStop}
        className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all"
        style={{
          background: "var(--accent-record)",
          boxShadow: "0 0 14px rgba(239,68,68,0.4)",
        }}
      >
        녹음 중지
      </button>
    </div>
  );
}
