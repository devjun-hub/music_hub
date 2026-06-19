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
  /** 패널 제목. 기본값 "믹스 녹음". */
  title?: string;
  /** 시작 버튼 라벨(대기 상태). 기본값 "믹스 녹음 시작". */
  startLabel?: string;
  /** 녹음 중 표시되는 안내 문구. 기본값은 다중 트랙 동시 재생 안내. */
  recordingMessage?: string;
  /** canRecord가 false일 때 idle 상태에서 보여줄 안내 문구. 기본값은 트랙 추가 안내. */
  idleHint?: string;
  /** 다운로드 파일명 접두사. 기본값 "mix". */
  filenamePrefix?: string;
}

/** 오디오 결과를 녹음하고, 완료되면 MP3/WAV로 내려받는다. */
export function MixRecordPanel({
  mixRecording,
  canRecord,
  onStart,
  onStop,
  onReset,
  title = "믹스 녹음",
  startLabel = "믹스 녹음 시작",
  recordingMessage = "녹음 중 — 모든 트랙이 함께 재생됩니다",
  idleHint = "트랙을 추가하면 믹스를 녹음할 수 있습니다.",
  filenamePrefix = "mix",
}: MixRecordPanelProps) {
  const { status, elapsedMs, audioBuffer, errorMessage } = mixRecording;

  return (
    <div
      className="space-y-3 rounded-lg border p-3 transition-all duration-300"
      style={{
        background: status === "recording" ? "rgba(239,68,68,0.04)" : "var(--glass-bg)",
        borderColor: status === "recording" ? "rgba(239,68,68,0.3)" : "var(--glass-border)",
        boxShadow: status === "recording" ? "0 0 20px rgba(239,68,68,0.15)" : "none",
      }}
    >
      <h2 className="text-sm font-semibold text-foreground-muted">{title}</h2>

      {status === "ready" && audioBuffer ? (
        <div className="space-y-3">
          <DownloadPanel audioBuffer={audioBuffer} filenamePrefix={filenamePrefix} />
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
          className={`min-h-11 w-full rounded-full text-sm font-semibold transition-all disabled:opacity-50 ${
            status === "recording"
              ? "animate-pulse bg-accent-record text-white"
              : "bg-accent-active text-black"
          }`}
          style={
            status === "recording"
              ? { boxShadow: "0 0 16px rgba(239,68,68,0.5)" }
              : { boxShadow: "0 0 12px var(--primary-glow)" }
          }
        >
          {status === "recording"
            ? `녹음 중지 · ${formatDuration(elapsedMs)}`
            : status === "processing"
              ? "처리 중…"
              : startLabel}
        </button>
      )}

      {status === "recording" && (
        <div className="flex items-center gap-2 text-sm text-accent-record">
          <span
            aria-hidden
            className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent-record"
            style={{ boxShadow: "0 0 8px rgba(239,68,68,0.7)" }}
          />
          <span>{recordingMessage}</span>
        </div>
      )}

      {status === "error" && errorMessage && (
        <p role="alert" className="text-sm text-accent-record">
          {errorMessage}
        </p>
      )}

      {!canRecord && status === "idle" && (
        <p className="text-sm text-foreground-muted">{idleHint}</p>
      )}
    </div>
  );
}
