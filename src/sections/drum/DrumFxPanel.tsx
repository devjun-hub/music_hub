"use client";

import { useState } from "react";
import { LabeledSlider } from "@/components/LabeledSlider";

interface DrumFxPanelProps {
  reverbWet: number;
  delayWet: number;
  onReverbWetChange: (wet: number) => void;
  onDelayWetChange: (wet: number) => void;
}

const formatPercent = (v: number) => `${Math.round(v * 100)}%`;

/** 드럼 버스 리버브·딜레이 FX 컨트롤 패널 */
export function DrumFxPanel({
  reverbWet,
  delayWet,
  onReverbWetChange,
  onDelayWetChange,
}: DrumFxPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasActiveEffect = reverbWet > 0 || delayWet > 0;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-dashed border-surface-border text-sm text-foreground-muted transition-colors hover:border-foreground-muted hover:text-foreground"
      >
        <span>FX {isOpen ? "닫기" : "펼치기"}</span>
        {hasActiveEffect && !isOpen && (
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-accent-active"
            style={{ boxShadow: "0 0 6px var(--primary-glow)" }}
          />
        )}
      </button>
      {isOpen && (
        <div
          className="space-y-3 rounded-xl border p-3"
          style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}
        >
          <LabeledSlider
            label="리버브"
            value={reverbWet}
            min={0}
            max={1}
            step={0.01}
            onChange={onReverbWetChange}
            formatValue={formatPercent}
            ariaLabel="드럼 리버브 강도"
          />
          <LabeledSlider
            label="딜레이"
            value={delayWet}
            min={0}
            max={1}
            step={0.01}
            onChange={onDelayWetChange}
            formatValue={formatPercent}
            ariaLabel="드럼 딜레이 강도"
          />
        </div>
      )}
    </div>
  );
}
