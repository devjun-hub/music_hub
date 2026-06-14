"use client";

import { useEffect, useState } from "react";
import { DEFAULT_DRUM_MODE, DRUM_SOUNDS, type DrumMode, type DrumSoundId } from "@/lib/constants";
import { DrumKitVisual } from "./DrumKitVisual";
import { DrumModeToggle } from "./DrumModeToggle";
import { PadGrid } from "./PadGrid";
import { StepSequencer } from "./StepSequencer";
import { useDrumKit } from "./useDrumKit";
import { useStepSequencer } from "./useStepSequencer";

/** 키보드 숫자키(1~8)를 DRUM_SOUNDS 순서에 맞춰 사운드 ID로 매핑 */
const KEY_TO_SOUND_ID = new Map<string, DrumSoundId>(
  DRUM_SOUNDS.map((sound) => [sound.key, sound.id]),
);

export function DrumSection() {
  const [mode, setMode] = useState<DrumMode>(DEFAULT_DRUM_MODE);
  const { trigger, hitCounts } = useDrumKit();
  const { pattern, isPlaying, currentStep, play, stop, toggleStep, clear } = useStepSequencer(
    (id, time) => trigger(id, time),
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      const soundId = KEY_TO_SOUND_ID.get(event.key);
      if (soundId) trigger(soundId);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [trigger]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">드럼</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            패드를 두드려 연주하거나, 16스텝 시퀀서로 루프를 만들어보세요.
          </p>
        </div>
        <DrumModeToggle mode={mode} onChange={setMode} />
      </div>

      {mode === "pad" ? (
        <PadGrid hitCounts={hitCounts} onTrigger={trigger} />
      ) : (
        <DrumKitVisual hitCounts={hitCounts} onTrigger={trigger} />
      )}

      <StepSequencer
        pattern={pattern}
        isPlaying={isPlaying}
        currentStep={currentStep}
        onToggleStep={toggleStep}
        onPlay={play}
        onStop={stop}
        onClear={clear}
      />
    </div>
  );
}
