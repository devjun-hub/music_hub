"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import {
  createEmptyPattern,
  getDrumPatternSnapshot,
  setDrumPattern,
  type Pattern,
} from "@/audio/drumLoop";
import {
  DEFAULT_DRUM_BANK,
  DEFAULT_DRUM_SWING,
  DRUM_BANK_IDS,
  DRUM_SOUNDS,
  DRUM_SWING_MAX_RATIO,
  STEP_COUNT,
  type DrumBankId,
  type DrumSoundId,
} from "@/lib/constants";

export type { Pattern };

/** 뱅크 A는 공유 스토어의 기존 패턴을 이어받고, B~D는 빈 패턴으로 시작한다. */
function createInitialBanks(): Record<DrumBankId, Pattern> {
  const banks = Object.fromEntries(
    DRUM_BANK_IDS.map((id) => [id, createEmptyPattern()]),
  ) as Record<DrumBankId, Pattern>;
  banks[DEFAULT_DRUM_BANK] = getDrumPatternSnapshot();
  return banks;
}

/**
 * 8트랙 x 16스텝 패턴(뱅크 A~D)을 전역 Transport/BPM에 맞춰 재생하는 시퀀서.
 * 각 스텝에서 활성화된 사운드에 대해 onStep(soundId, time)을 호출하며, 스윙 비율에 따라
 * 오프비트 스텝의 시각을 살짝 늦춘다. 활성 뱅크의 패턴은 리믹스 섹션의 "드럼 루프 추가"에서도
 * 읽을 수 있도록 공유 스토어에 반영한다.
 */
export function useStepSequencer(onStep: (id: DrumSoundId, time: number) => void) {
  const [banks, setBanks] = useState<Record<DrumBankId, Pattern>>(createInitialBanks);
  const [activeBank, setActiveBankState] = useState<DrumBankId>(DEFAULT_DRUM_BANK);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [swing, setSwing] = useState(DEFAULT_DRUM_SWING);

  const banksRef = useRef(banks);
  const activeBankRef = useRef(activeBank);
  const patternRef = useRef(banks[activeBank]);
  const onStepRef = useRef(onStep);
  const isPlayingRef = useRef(false);
  const swingRef = useRef(swing);

  useEffect(() => {
    banksRef.current = banks;
    patternRef.current = banks[activeBank];
  }, [banks, activeBank]);

  useEffect(() => {
    onStepRef.current = onStep;
  }, [onStep]);

  useEffect(() => {
    swingRef.current = swing;
  }, [swing]);

  useEffect(() => {
    const sequence = new Tone.Sequence<number>(
      (time, step) => {
        const isOffbeat = step % 2 === 1;
        const swingDelay = isOffbeat
          ? (swingRef.current / 100) * DRUM_SWING_MAX_RATIO * Tone.Time("16n").toSeconds()
          : 0;
        const hitTime = time + swingDelay;

        for (const sound of DRUM_SOUNDS) {
          if (patternRef.current[sound.id][step]) {
            onStepRef.current(sound.id, hitTime);
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
    setBanks((prev) => {
      const bank = activeBankRef.current;
      const bankPattern = prev[bank];
      const nextPattern = { ...bankPattern, [soundId]: [...bankPattern[soundId]] };
      nextPattern[soundId][step] = !nextPattern[soundId][step];
      setDrumPattern(nextPattern);
      return { ...prev, [bank]: nextPattern };
    });
  }, []);

  const clear = useCallback(() => {
    const empty = createEmptyPattern();
    setDrumPattern(empty);
    setBanks((prev) => ({ ...prev, [activeBankRef.current]: empty }));
  }, []);

  /** 재생 중에도 즉시 반영되도록 ref를 먼저 갱신한 뒤 상태를 갱신한다. */
  const setActiveBank = useCallback((bank: DrumBankId) => {
    activeBankRef.current = bank;
    const bankPattern = banksRef.current[bank];
    patternRef.current = bankPattern;
    setDrumPattern(bankPattern);
    setActiveBankState(bank);
  }, []);

  /** 외부 패턴을 현재 뱅크에 깊은 복사로 불러온다. 재생 중에도 즉시 반영된다. */
  const loadPattern = useCallback((newPattern: Pattern) => {
    const loaded = DRUM_SOUNDS.reduce<Pattern>((acc, sound) => {
      const targetPattern = newPattern[sound.id];
      acc[sound.id] = targetPattern ? [...targetPattern] : Array(STEP_COUNT).fill(false);
      return acc;
    }, {} as Pattern);
    patternRef.current = loaded;
    setDrumPattern(loaded);
    setBanks((prev) => ({ ...prev, [activeBankRef.current]: loaded }));
  }, []);

  return {
    pattern: banks[activeBank],
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
  };
}
