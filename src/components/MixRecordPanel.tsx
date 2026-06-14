"use client";

import { DownloadPanel } from "@/components/DownloadPanel";
import { formatDuration } from "@/lib/format";
import type { MixRecordingState } from "@/lib/types";

interface MixRecordPanelProps {
  mixRecording: MixRecordingState;
  canRecord: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

/** 모든 트랙/셀을 동시 재생하며 그 결과를 녹음하고, 완료되면 MP3/WAV로 내려받는다. */
export function MixRecordPanel({ mixRecording, canRecord, onStart, onStop, onReset }: MixRecordPanelProps) {
  const { status, elapsedMs, audioBuffer, errorMessage } = mixRecording;

  return (
    <div className="space-y-3 rounded-lg border border-surface-border bg-surface p-3">
      <h2 className="text-sm font-semibold text-foreground-muted">믹스 녹음</h2>

      {status === "ready" && audioBuffer ? (
        <div className="space-y-3">
          <DownloadPanel audioBuffer={audioBuffer} filenamePrefix="mix" />
          <button
            type="button"
            onClick={onReset}
            className="min-h-11 w-full rounded-full border border-surface-border text-sm font-semibold text-foreground transition-colors hover:border-foreground-muted"
          >
            다시 녹음
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={status === "recording" ? onStop : onStart}
          disabled={(!canRecord && status !== "recording") || status === "processing"}
          aria-pressed={status === "recording"}
          className={`min-h-11 w-full rounded-full text-sm font-semibold transition-colors disabled:opacity-50 ${
            status === "recording"
              ? "animate-pulse bg-accent-record text-white"
              : "bg-accent-active text-black"
          }`}
        >
          {status === "recording"
            ? `녹음 중지 · ${formatDuration(elapsedMs)}`
            : status === "processing"
              ? "처리 중…"
              : "믹스 녹음 시작"}
        </button>
      )}

      {status === "recording" && (
        <div className="flex items-center gap-2 text-sm text-accent-record">
          <span aria-hidden className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent-record" />
          <span>녹음 중 — 모든 트랙이 함께 재생됩니다</span>
        </div>
      )}

      {status === "error" && errorMessage && (
        <p role="alert" className="text-sm text-accent-record">
          {errorMessage}
        </p>
      )}

      {!canRecord && status === "idle" && (
        <p className="text-sm text-foreground-muted">트랙을 추가하면 믹스를 녹음할 수 있습니다.</p>
      )}
    </div>
  );
}
