"use client";

import { useEffect, useState } from "react";
import { DEFAULT_DRUM_MODE, DRUM_SOUNDS, type DrumMode, type DrumSoundId } from "@/lib/constants";
import { MixRecordPanel } from "@/components/MixRecordPanel";
import { BeatPresetsPanel } from "./BeatPresetsPanel";
import { DrumFxPanel } from "./DrumFxPanel";
import { DrumKitVisual } from "./DrumKitVisual";
import { DrumMixerPanel } from "./DrumMixerPanel";
import { DrumModeToggle } from "./DrumModeToggle";
import { PadGrid } from "./PadGrid";
import { StepSequencer } from "./StepSequencer";
import { useDrumKit } from "./useDrumKit";
import { useDrumRecorder } from "./useDrumRecorder";
import { useStepSequencer } from "./useStepSequencer";

export function DrumSection() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<DrumMode>(DEFAULT_DRUM_MODE);
  const [selectedSoundId, setSelectedSoundId] = useState<DrumSoundId>("kick");

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    trigger,
    hitCounts,
    soundVolumes,
    soundTunes,
    setSoundVolume,
    setSoundTune,
    reverbWet,
    delayWet,
    setReverbWet,
    setDelayWet,
    getMixStream,
  } = useDrumKit();
  const {
    pattern,
    banks,
    activeBank,
    setActiveBank,
    isPlaying,
    currentStep,
    play,
    stop,
    toggleStep,
    clear,
    loadPattern,
    swing,
    setSwing,
  } = useStepSequencer((id, time) => trigger(id, time));
  const recorder = useDrumRecorder(getMixStream);

  const handlePadTrigger = (id: DrumSoundId) => {
    trigger(id);
    setSelectedSoundId(id);
  };

  useEffect(() => {
    if (!mounted) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      const key = event.key.toLowerCase();
      const sound = DRUM_SOUNDS.find((s) => s.key === key);
      if (sound) {
        trigger(sound.id);
        setSelectedSoundId(sound.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [trigger, mounted]);

  if (!mounted) {
    return (
      <div className="mx-auto flex h-full w-full items-center justify-center p-8 text-foreground-muted font-semibold">
        드럼 모듈 로딩 중...
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full flex-col gap-3 p-3 overflow-hidden lg:max-w-none">
      <div className="flex flex-wrap items-start justify-between gap-3 flex-none">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--primary)", textShadow: "0 0 12px var(--primary-glow)" }}
          >
            드럼
          </h1>
          <p className="mt-1 text-sm text-foreground-muted landscape:max-md:hidden">
            패드를 두드려 연주하거나, 16스텝 시퀀서로 루프를 만들어보세요.
          </p>
          <p className="mt-1 text-[11px] text-foreground-muted/60 landscape:max-md:hidden">
            단축키 — 뱅크 A (왼손):
            <kbd className="mx-0.5 rounded border border-surface-border px-1 font-mono">1</kbd>
            <kbd className="mx-0.5 rounded border border-surface-border px-1 font-mono">2</kbd>
            <kbd className="mx-0.5 rounded border border-surface-border px-1 font-mono">q</kbd>
            <kbd className="mx-0.5 rounded border border-surface-border px-1 font-mono">a</kbd>
            <kbd className="mx-0.5 rounded border border-surface-border px-1 font-mono">z</kbd>… |
            뱅크 B (오른손):
            <kbd className="mx-0.5 rounded border border-surface-border px-1 font-mono">7</kbd>
            <kbd className="mx-0.5 rounded border border-surface-border px-1 font-mono">8</kbd>
            <kbd className="mx-0.5 rounded border border-surface-border px-1 font-mono">u</kbd>
            <kbd className="mx-0.5 rounded border border-surface-border px-1 font-mono">h</kbd>
            <kbd className="mx-0.5 rounded border border-surface-border px-1 font-mono">n</kbd>…
          </p>
        </div>
        <DrumModeToggle mode={mode} onChange={setMode} />
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 landscape:grid-cols-[minmax(0,1fr)_20rem] lg:grid-cols-[minmax(0,1fr)_22rem] gap-3 overflow-hidden">
        <div className="flex flex-col gap-3 overflow-y-auto h-full pr-1 min-h-0">
          {mode === "pad" ? (
            <PadGrid hitCounts={hitCounts} onTrigger={handlePadTrigger} selectedSoundId={selectedSoundId} />
          ) : (
            <DrumKitVisual hitCounts={hitCounts} onTrigger={handlePadTrigger} selectedSoundId={selectedSoundId} />
          )}

          <StepSequencer
            pattern={pattern}
            isPlaying={isPlaying}
            currentStep={currentStep}
            onToggleStep={toggleStep}
            onPlay={play}
            onStop={stop}
            onClear={clear}
            banks={banks}
            activeBank={activeBank}
            onBankChange={setActiveBank}
            swing={swing}
            onSwingChange={setSwing}
            selectedSoundId={selectedSoundId}
            onSelectedSoundChange={setSelectedSoundId}
          />

          <BeatPresetsPanel onLoad={loadPattern} onPlay={play} isPlaying={isPlaying} />
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto h-full pr-1 min-h-0">
          <DrumFxPanel
            reverbWet={reverbWet}
            delayWet={delayWet}
            onReverbWetChange={setReverbWet}
            onDelayWetChange={setDelayWet}
          />

          <DrumMixerPanel
            soundVolumes={soundVolumes}
            soundTunes={soundTunes}
            onVolumeChange={setSoundVolume}
            onTuneChange={setSoundTune}
          />

          <MixRecordPanel
            mixRecording={recorder.state}
            canRecord
            onStart={recorder.start}
            onStop={recorder.stop}
            onReset={recorder.reset}
            title="드럼 녹음"
            startLabel="녹음 시작"
            recordingMessage="녹음 중 — 패드 연주와 시퀀서 소리가 그대로 기록됩니다"
            filenamePrefix="drum"
          />
        </div>
      </div>
    </div>
  );
}
