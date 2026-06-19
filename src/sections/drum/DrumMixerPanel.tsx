"use client";

import { useState } from "react";
import { LabeledSlider } from "@/components/LabeledSlider";
import {
  DRUM_SOUNDS,
  DRUM_TUNE_MAX_SEMITONES,
  DRUM_TUNE_MIN_SEMITONES,
  DRUM_TUNE_STEP,
  DRUM_VOLUME_MAX,
  DRUM_VOLUME_MIN,
  DRUM_VOLUME_STEP,
  type DrumSoundId,
} from "@/lib/constants";

interface DrumMixerPanelProps {
  soundVolumes: Record<DrumSoundId, number>;
  soundTunes: Record<DrumSoundId, number>;
  onVolumeChange: (id: DrumSoundId, value: number) => void;
  onTuneChange: (id: DrumSoundId, value: number) => void;
}

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;
const formatSemitones = (value: number) => (value > 0 ? `+${value}` : `${value}`);

/** 8개 드럼 사운드별 볼륨/튠 슬라이더를 모아둔 접이식 믹서 패널 */
export function DrumMixerPanel({
  soundVolumes,
  soundTunes,
  onVolumeChange,
  onTuneChange,
}: DrumMixerPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="min-h-11 w-full rounded-full border border-dashed border-surface-border text-sm text-foreground-muted transition-colors hover:border-foreground-muted hover:text-foreground"
      >
        믹서 {isOpen ? "닫기" : "펼치기"}
      </button>
      {isOpen && (
        <div
          className="space-y-3 rounded-xl border p-3"
          style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}
        >
          <div className="max-h-[280px] overflow-y-auto pr-1 space-y-3">
            {DRUM_SOUNDS.map((sound) => (
              <div
                key={sound.id}
                className="space-y-1.5 border-b border-surface-border pb-2 last:border-0 last:pb-0"
              >
                <p className="text-xs font-semibold text-foreground-muted">{sound.label}</p>
                <LabeledSlider
                  label="볼륨"
                  value={soundVolumes[sound.id]}
                  min={DRUM_VOLUME_MIN}
                  max={DRUM_VOLUME_MAX}
                  step={DRUM_VOLUME_STEP}
                  onChange={(value) => onVolumeChange(sound.id, value)}
                  formatValue={formatPercent}
                  ariaLabel={`${sound.label} 볼륨`}
                />
                <LabeledSlider
                  label="튠"
                  value={soundTunes[sound.id]}
                  min={DRUM_TUNE_MIN_SEMITONES}
                  max={DRUM_TUNE_MAX_SEMITONES}
                  step={DRUM_TUNE_STEP}
                  onChange={(value) => onTuneChange(sound.id, value)}
                  formatValue={formatSemitones}
                  ariaLabel={`${sound.label} 튠`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
