"use client";

import { LabeledSlider } from "@/components/LabeledSlider";
import { TRACK_PAN_MAX, TRACK_PAN_MIN, TRACK_PAN_STEP } from "@/lib/constants";
import { formatDuration } from "@/lib/format";
import type { RemixTrack } from "./useRemixEngine";

interface TrackRowProps {
  track: RemixTrack;
  onVolumeChange: (value: number) => void;
  onPanChange: (value: number) => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onRemove: () => void;
  /** 믹스 녹음 중에는 구조 변경(뮤트/솔로/삭제)을 막는다. 볼륨/팬은 라이브 조절을 위해 유지. */
  disabled?: boolean;
}

const SOURCE_LABELS: Record<RemixTrack["sourceKind"], string> = {
  recording: "녹음",
  upload: "파일",
  drumLoop: "드럼",
  sample: "샘플",
};

function formatPan(value: number): string {
  if (Math.abs(value) < 0.05) return "C";
  const percent = Math.round(Math.abs(value) * 100);
  return value < 0 ? `L${percent}` : `R${percent}`;
}

/** 트랙 1개의 이름/길이, 뮤트·솔로·삭제, 볼륨/팬 슬라이더. */
export function TrackRow({
  track,
  onVolumeChange,
  onPanChange,
  onToggleMute,
  onToggleSolo,
  onRemove,
  disabled,
}: TrackRowProps) {
  return (
    <div className="space-y-2 rounded-lg border border-surface-border bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 rounded bg-surface-border px-1.5 py-0.5 text-xs font-medium text-foreground-muted">
            {SOURCE_LABELS[track.sourceKind]}
          </span>
          <span className="truncate text-sm font-medium text-foreground" title={track.name}>
            {track.name}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="font-mono text-xs tabular-nums text-foreground-muted">
            {formatDuration(track.duration * 1000)}
          </span>
          <button
            type="button"
            onClick={onToggleMute}
            aria-pressed={track.muted}
            aria-label={`${track.name} 뮤트`}
            disabled={disabled}
            className={`min-h-9 min-w-9 rounded text-xs font-bold transition-colors disabled:opacity-40 ${
              track.muted
                ? "bg-accent-record text-white"
                : "border border-surface-border text-foreground-muted hover:text-foreground"
            }`}
          >
            M
          </button>
          <button
            type="button"
            onClick={onToggleSolo}
            aria-pressed={track.solo}
            aria-label={`${track.name} 솔로`}
            disabled={disabled}
            className={`min-h-9 min-w-9 rounded text-xs font-bold transition-colors disabled:opacity-40 ${
              track.solo
                ? "bg-accent-active text-black"
                : "border border-surface-border text-foreground-muted hover:text-foreground"
            }`}
          >
            S
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`${track.name} 삭제`}
            disabled={disabled}
            className="min-h-9 min-w-9 rounded border border-surface-border text-base text-foreground-muted transition-colors hover:text-accent-record disabled:opacity-40"
          >
            ×
          </button>
        </div>
      </div>
      <LabeledSlider
        label="볼륨"
        min={0}
        max={1}
        step={0.01}
        value={track.volume}
        onChange={onVolumeChange}
        formatValue={(value) => `${Math.round(value * 100)}%`}
        ariaLabel={`${track.name} 볼륨`}
      />
      <LabeledSlider
        label="팬"
        min={TRACK_PAN_MIN}
        max={TRACK_PAN_MAX}
        step={TRACK_PAN_STEP}
        value={track.pan}
        onChange={onPanChange}
        formatValue={formatPan}
        ariaLabel={`${track.name} 팬`}
      />
    </div>
  );
}
