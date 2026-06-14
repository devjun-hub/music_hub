"use client";

import { DEFAULT_CROSSFADER } from "@/lib/constants";

interface MixerPanelProps {
  crossfade: number;
  onCrossfadeChange: (value: number) => void;
}

/** 두 덱을 잇는 크로스페이더. 마스터 볼륨은 공통 헤더의 전역 컨트롤을 그대로 쓴다. */
export function MixerPanel({ crossfade, onCrossfadeChange }: MixerPanelProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-surface-border bg-surface p-3 lg:justify-center">
      <h2 className="text-center text-sm font-semibold text-foreground-muted">믹서</h2>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-semibold text-foreground-muted">
          <span>A</span>
          <span>크로스페이더</span>
          <span>B</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={crossfade}
          onChange={(event) => onCrossfadeChange(Number(event.target.value))}
          aria-label="크로스페이더"
          className="h-6 w-full accent-accent-active"
        />
      </div>

      <button
        type="button"
        onClick={() => onCrossfadeChange(DEFAULT_CROSSFADER)}
        className="mx-auto min-h-9 rounded-full border border-surface-border px-4 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
      >
        중앙으로
      </button>
    </div>
  );
}
