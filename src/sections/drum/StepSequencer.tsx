"use client";

import { Fragment } from "react";
import type { Pattern } from "@/audio/drumLoop";
import { DRUM_SOUNDS, STEP_COUNT, type DrumSoundId } from "@/lib/constants";

interface StepSequencerProps {
  pattern: Pattern;
  isPlaying: boolean;
  currentStep: number;
  onToggleStep: (id: DrumSoundId, step: number) => void;
  onPlay: () => void;
  onStop: () => void;
  onClear: () => void;
}

/** 트랙 라벨 컬럼 + 16스텝 컬럼으로 구성된 그리드 템플릿 */
const SEQUENCER_GRID_TEMPLATE = `4.5rem repeat(${STEP_COUNT}, minmax(1.5rem, 1fr))`;

/** 8트랙 x 16스텝 패턴 에디터 + 재생/정지/클리어 컨트롤 */
export function StepSequencer({
  pattern,
  isPlaying,
  currentStep,
  onToggleStep,
  onPlay,
  onStop,
  onClear,
}: StepSequencerProps) {
  return (
    <div className="space-y-3 rounded-xl border border-surface-border bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground-muted">시퀀서</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={isPlaying ? onStop : onPlay}
            aria-pressed={isPlaying}
            className={`min-h-9 min-w-20 rounded-full px-4 text-sm font-semibold transition-colors ${
              isPlaying
                ? "bg-accent-active text-black"
                : "border border-surface-border text-foreground hover:border-foreground-muted"
            }`}
          >
            {isPlaying ? "정지" : "재생"}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="min-h-9 rounded-full border border-surface-border px-4 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
          >
            클리어
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid w-full min-w-112 items-center gap-y-1.5"
          style={{ gridTemplateColumns: SEQUENCER_GRID_TEMPLATE }}
        >
          {DRUM_SOUNDS.map((sound) => (
            <Fragment key={sound.id}>
              <span className="pr-2 text-xs font-medium text-foreground-muted">
                {sound.shortLabel}
              </span>
              {Array.from({ length: STEP_COUNT }, (_, step) => {
                const isActive = pattern[sound.id][step];
                const isCurrent = step === currentStep;
                const isAccent = step % 4 === 0;
                return (
                  <button
                    key={step}
                    type="button"
                    aria-label={`${sound.label} ${step + 1}번 스텝 ${isActive ? "켜짐" : "꺼짐"}`}
                    aria-pressed={isActive}
                    onClick={() => onToggleStep(sound.id, step)}
                    className={`mx-0.5 aspect-square rounded transition-colors ${
                      isActive
                        ? "bg-accent-active"
                        : isAccent
                          ? "bg-surface-border"
                          : "bg-surface-border/50"
                    } ${isCurrent ? "outline outline-2 outline-foreground" : ""}`}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
