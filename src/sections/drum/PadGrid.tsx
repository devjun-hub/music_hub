"use client";

import { DRUM_SOUNDS, type DrumSoundId } from "@/lib/constants";
import { usePadFlash } from "./usePadFlash";

interface PadGridProps {
  hitCounts: Record<DrumSoundId, number>;
  onTrigger: (id: DrumSoundId) => void;
}

interface PadProps {
  sound: (typeof DRUM_SOUNDS)[number];
  hitCount: number;
  onTrigger: (id: DrumSoundId) => void;
}

function Pad({ sound, hitCount, onTrigger }: PadProps) {
  const isFlashing = usePadFlash(hitCount);

  return (
    <button
      type="button"
      onClick={() => onTrigger(sound.id)}
      aria-label={`${sound.label} 패드 (단축키 ${sound.key})`}
      className={`flex aspect-square touch-manipulation flex-col items-center justify-center gap-1 rounded-xl border-2 transition active:scale-95 ${
        isFlashing
          ? "border-accent-active bg-accent-active/30"
          : "border-surface-border bg-background hover:border-foreground-muted"
      }`}
    >
      <span className="text-base font-semibold sm:text-lg">{sound.shortLabel}</span>
      <span className="font-mono text-xs text-foreground-muted">{sound.key}</span>
    </button>
  );
}

/** MPC 스타일 8패드 그리드. 패드를 누르면 즉시 소리가 나고 짧은 플래시로 타격을 표시한다. */
export function PadGrid({ hitCounts, onTrigger }: PadGridProps) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface p-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {DRUM_SOUNDS.map((sound) => (
          <Pad key={sound.id} sound={sound} hitCount={hitCounts[sound.id]} onTrigger={onTrigger} />
        ))}
      </div>
    </div>
  );
}
