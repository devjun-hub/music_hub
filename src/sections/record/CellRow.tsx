"use client";

import { CellEffects } from "./CellEffects";
import { CellWaveform } from "./CellWaveform";
import { LabeledSlider } from "@/components/LabeledSlider";
import { formatDuration } from "@/lib/format";
import type { AutotuneUpdate, RecordCell } from "./useRecordEngine";

interface CellRowProps {
  cell: RecordCell;
  /** 전역 Transport 재생 위치 (초) */
  position: number;
  onVolumeChange: (value: number) => void;
  onEchoChange: (enabled: boolean, wet?: number) => void;
  onReverbChange: (enabled: boolean, wet?: number) => void;
  onAutotuneChange: (update: AutotuneUpdate) => void;
  onRemove: () => void;
  /** 믹스 녹음 중에는 셀 삭제 같은 구조 변경을 막는다. */
  disabled?: boolean;
}

const KIND_LABELS: Record<RecordCell["kind"], string> = {
  source: "음원",
  vocal: "보컬",
  sample: "샘플",
};

/** 셀 1개: 이름/길이/삭제, 파형, 볼륨, 이펙트 컨트롤. */
export function CellRow({
  cell,
  position,
  onVolumeChange,
  onEchoChange,
  onReverbChange,
  onAutotuneChange,
  onRemove,
  disabled,
}: CellRowProps) {
  return (
    <div className="space-y-2 rounded-lg border border-surface-border bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 rounded bg-surface-border px-1.5 py-0.5 text-xs font-medium text-foreground-muted">
            {KIND_LABELS[cell.kind]}
          </span>
          <span className="truncate text-sm font-medium text-foreground" title={cell.name}>
            {cell.name}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="font-mono text-xs tabular-nums text-foreground-muted">
            {formatDuration(cell.duration * 1000)}
          </span>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`${cell.name} 삭제`}
            disabled={disabled}
            className="min-h-9 min-w-9 rounded border border-surface-border text-base text-foreground-muted transition-colors hover:text-accent-record disabled:opacity-40"
          >
            ×
          </button>
        </div>
      </div>

      <CellWaveform url={cell.waveformUrl} position={position} duration={cell.duration} />

      <LabeledSlider
        label="볼륨"
        min={0}
        max={1}
        step={0.01}
        value={cell.volume}
        onChange={onVolumeChange}
        formatValue={(value) => `${Math.round(value * 100)}%`}
        ariaLabel={`${cell.name} 볼륨`}
      />

      <CellEffects
        cell={cell}
        onEchoChange={onEchoChange}
        onReverbChange={onReverbChange}
        onAutotuneChange={onAutotuneChange}
      />
    </div>
  );
}
