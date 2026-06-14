"use client";

import { useAudioEngine } from "@/audio/AudioEngineProvider";
import { MAX_BPM, MIN_BPM } from "@/lib/constants";

/** 언락 상태, 전역 BPM, 마스터 볼륨을 보여주는 공통 헤더 */
export function Header() {
  const { isUnlocked, bpm, setBpm, masterVolume, setMasterVolume } = useAudioEngine();

  const handleBpmChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (Number.isNaN(value)) return;
    setBpm(Math.min(MAX_BPM, Math.max(MIN_BPM, value)));
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-surface-border bg-surface px-4">
      <span className="text-sm font-semibold tracking-wide">Music Hub</span>

      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <span
          aria-hidden
          className={`h-2.5 w-2.5 rounded-full ${
            isUnlocked ? "bg-accent-active" : "bg-foreground-muted/40"
          }`}
        />
        <span>{isUnlocked ? "오디오 준비됨" : "오디오 잠금"}</span>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-foreground-muted">BPM</span>
          <input
            type="number"
            inputMode="numeric"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={handleBpmChange}
            className="w-16 rounded border border-surface-border bg-background px-2 py-1 font-mono tabular-nums"
          />
        </label>

        <label className="hidden items-center gap-2 text-sm sm:flex">
          <span className="text-foreground-muted">Vol</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={masterVolume}
            onChange={(event) => setMasterVolume(Number(event.target.value))}
            className="w-24 accent-accent-active"
            aria-label="마스터 볼륨"
          />
        </label>
      </div>
    </header>
  );
}
