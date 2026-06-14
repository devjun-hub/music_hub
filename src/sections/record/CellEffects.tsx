"use client";

import { LabeledSlider } from "@/components/LabeledSlider";
import {
  AUTOTUNE_RETUNE_MAX,
  AUTOTUNE_RETUNE_MIN,
  AUTOTUNE_RETUNE_STEP,
  AUTOTUNE_SCALES,
  ECHO_WET_MAX,
  ECHO_WET_MIN,
  ECHO_WET_STEP,
  REVERB_WET_MAX,
  REVERB_WET_MIN,
  REVERB_WET_STEP,
} from "@/lib/constants";
import type { AutotuneUpdate, RecordCell } from "./useRecordEngine";

interface CellEffectsProps {
  cell: RecordCell;
  onEchoChange: (enabled: boolean, wet?: number) => void;
  onReverbChange: (enabled: boolean, wet?: number) => void;
  onAutotuneChange: (update: AutotuneUpdate) => void;
  disabled?: boolean;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function ToggleButton({
  label,
  pressed,
  onClick,
  disabled,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      disabled={disabled}
      className={`min-h-8 min-w-16 rounded-full text-xs font-semibold transition-colors disabled:opacity-40 ${
        pressed
          ? "bg-accent-active text-black"
          : "border border-surface-border text-foreground-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

/** 셀 1개의 이펙트 컨트롤: 에코/리버브(on/off + 강도), 오토튠(on/off + 스케일 + 보정 속도). */
export function CellEffects({
  cell,
  onEchoChange,
  onReverbChange,
  onAutotuneChange,
  disabled,
}: CellEffectsProps) {
  return (
    <div className="space-y-3 rounded-md border border-surface-border bg-background/40 p-2">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-foreground-muted">에코</span>
          <ToggleButton
            label={cell.echoEnabled ? "켜짐" : "꺼짐"}
            pressed={cell.echoEnabled}
            onClick={() => onEchoChange(!cell.echoEnabled)}
            disabled={disabled}
          />
        </div>
        <LabeledSlider
          label="강도"
          min={ECHO_WET_MIN}
          max={ECHO_WET_MAX}
          step={ECHO_WET_STEP}
          value={cell.echoWet}
          onChange={(value) => onEchoChange(cell.echoEnabled, value)}
          formatValue={formatPercent}
          ariaLabel={`${cell.name} 에코 강도`}
          disabled={disabled || !cell.echoEnabled}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-foreground-muted">리버브</span>
          <ToggleButton
            label={cell.reverbEnabled ? "켜짐" : "꺼짐"}
            pressed={cell.reverbEnabled}
            onClick={() => onReverbChange(!cell.reverbEnabled)}
            disabled={disabled}
          />
        </div>
        <LabeledSlider
          label="강도"
          min={REVERB_WET_MIN}
          max={REVERB_WET_MAX}
          step={REVERB_WET_STEP}
          value={cell.reverbWet}
          onChange={(value) => onReverbChange(cell.reverbEnabled, value)}
          formatValue={formatPercent}
          ariaLabel={`${cell.name} 리버브 강도`}
          disabled={disabled || !cell.reverbEnabled}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-foreground-muted">오토튠</span>
          <ToggleButton
            label={cell.autotuneEnabled ? "켜짐" : "꺼짐"}
            pressed={cell.autotuneEnabled}
            onClick={() => onAutotuneChange({ enabled: !cell.autotuneEnabled })}
            disabled={disabled}
          />
        </div>
        <div className="flex gap-1.5">
          {AUTOTUNE_SCALES.map((scale) => (
            <button
              key={scale.id}
              type="button"
              onClick={() => onAutotuneChange({ scale: scale.id })}
              aria-pressed={cell.autotuneScale === scale.id}
              disabled={disabled || !cell.autotuneEnabled}
              className={`min-h-8 flex-1 rounded-full text-xs font-medium transition-colors disabled:opacity-40 ${
                cell.autotuneScale === scale.id
                  ? "bg-foreground text-background"
                  : "border border-surface-border text-foreground-muted hover:text-foreground"
              }`}
            >
              {scale.label}
            </button>
          ))}
        </div>
        <LabeledSlider
          label="속도"
          min={AUTOTUNE_RETUNE_MIN}
          max={AUTOTUNE_RETUNE_MAX}
          step={AUTOTUNE_RETUNE_STEP}
          value={cell.autotuneRetune}
          onChange={(value) => onAutotuneChange({ retune: value })}
          formatValue={formatPercent}
          ariaLabel={`${cell.name} 오토튠 보정 속도`}
          disabled={disabled || !cell.autotuneEnabled}
        />
      </div>
    </div>
  );
}
