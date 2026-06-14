"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import {
  createEmptyPattern,
  getDrumPatternSnapshot,
  setDrumPattern,
  type Pattern,
} from "@/audio/drumLoop";
import { DRUM_SOUNDS, STEP_COUNT, type DrumSoundId } from "@/lib/constants";

export type { Pattern };

/**
 * 8트랙 x 16스텝 패턴을 전역 Transport/BPM에 맞춰 재생하는 시퀀서.
 * 각 스텝에서 활성화된 사운드에 대해 onStep(soundId, time)을 호출한다.
 * 패턴은 리믹스 섹션의 "드럼 루프 추가"에서도 읽을 수 있도록 공유 스토어에 반영한다.
 */
export function useStepSequencer(onStep: (id: DrumSoundId, time: number) => void) {
  const [pattern, setPattern] = useState<Pattern>(getDrumPatternSnapshot);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  const patternRef = useRef(pattern);
  const onStepRef = useRef(onStep);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);

  useEffect(() => {
    onStepRef.current = onStep;
  }, [onStep]);

  useEffect(() => {
    const sequence = new Tone.Sequence<number>(
      (time, step) => {
        for (const sound of DRUM_SOUNDS) {
          if (patternRef.current[sound.id][step]) {
            onStepRef.current(sound.id, time);
          }
        }
        Tone.getDraw().schedule(() => {
          if (isPlayingRef.current) {
            setCurrentStep(step);
          }
        }, time);
      },
      Array.from({ length: STEP_COUNT }, (_, step) => step),
      "16n",
    );
    sequence.start(0);

    return () => {
      sequence.dispose();
      Tone.getTransport().stop();
    };
  }, []);

  const play = useCallback(() => {
    if (Tone.getTransport().state !== "started") {
      Tone.getTransport().start();
    }
    isPlayingRef.current = true;
    setIsPlaying(true);
  }, []);

  const stop = useCallback(() => {
    Tone.getTransport().stop();
    Tone.getDraw().cancel();
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentStep(-1);
  }, []);

  const toggleStep = useCallback((soundId: DrumSoundId, step: number) => {
    setPattern((prev) => {
      const next = { ...prev, [soundId]: [...prev[soundId]] };
      next[soundId][step] = !next[soundId][step];
      setDrumPattern(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    const next = createEmptyPattern();
    setDrumPattern(next);
    setPattern(next);
  }, []);

  return { pattern, isPlaying, currentStep, play, stop, toggleStep, clear };
}
