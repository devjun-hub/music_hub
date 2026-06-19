"use client";

import { useAudioEngine } from "@/audio/AudioEngineProvider";
import type { Pattern } from "@/audio/drumLoop";
import { DRUM_BEAT_PRESETS, type DrumBeatPreset } from "@/lib/constants";

interface BeatPresetsPanelProps {
  onLoad: (pattern: Pattern) => void;
  onPlay: () => void;
  isPlaying: boolean;
}

function PresetCard({
  preset,
  onLoad,
  onPreview,
}: {
  preset: DrumBeatPreset;
  onLoad: () => void;
  onPreview: () => void;
}) {
  return (
    <div
      className="flex flex-col justify-between gap-1.5 rounded-lg border p-2"
      style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}
    >
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{preset.name}</p>
          <p className="text-[10px] text-foreground-muted truncate hidden sm:block md:hidden xl:block">{preset.description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-surface-border px-1.5 py-0.5 font-mono text-[10px] tabular-nums">
          {preset.bpm}
        </span>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onLoad}
          className="h-7 flex-1 rounded-full border border-surface-border text-[10px] font-semibold text-foreground-muted transition-colors hover:border-foreground-muted hover:text-foreground"
        >
          로드
        </button>
        <button
          type="button"
          onClick={onPreview}
          className="h-7 flex-1 rounded-full bg-accent-active text-[10px] font-semibold text-black transition-opacity hover:opacity-90"
        >
          ▶ 재생
        </button>
      </div>
    </div>
  );
}

/** 3가지 샘플 비트 프리셋 — 패턴을 불러오거나 즉시 재생해볼 수 있다. */
export function BeatPresetsPanel({ onLoad, onPlay, isPlaying }: BeatPresetsPanelProps) {
  const { setBpm } = useAudioEngine();

  const handleLoad = (preset: DrumBeatPreset) => {
    setBpm(preset.bpm);
    onLoad(preset.pattern as Pattern);
  };

  const handlePreview = (preset: DrumBeatPreset) => {
    setBpm(preset.bpm);
    onLoad(preset.pattern as Pattern);
    if (!isPlaying) onPlay();
  };

  return (
    <div
      className="space-y-2 rounded-xl border p-3"
      style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}
    >
      <h2 className="text-sm font-semibold text-foreground-muted">샘플 비트</h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {DRUM_BEAT_PRESETS.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            onLoad={() => handleLoad(preset)}
            onPreview={() => handlePreview(preset)}
          />
        ))}
      </div>
    </div>
  );
}
