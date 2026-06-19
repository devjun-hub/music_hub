"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { amplitudeToDb } from "@/audio/context";
import { createDrumKit, type DrumKit } from "@/audio/drumKit";
import { createMixBus, type MixBus } from "@/audio/drum/mixBus";
import {
  DEFAULT_DRUM_SOUND_VOLUME,
  DEFAULT_DRUM_TUNE,
  DRUM_SOUNDS,
  type DrumSoundId,
} from "@/lib/constants";

type HitCounts = Record<DrumSoundId, number>;
type SoundLevels = Record<DrumSoundId, number>;

function createInitialHitCounts(): HitCounts {
  return Object.fromEntries(DRUM_SOUNDS.map((sound) => [sound.id, 0])) as HitCounts;
}

function createInitialVolumes(): SoundLevels {
  return Object.fromEntries(DRUM_SOUNDS.map((sound) => [sound.id, DEFAULT_DRUM_SOUND_VOLUME])) as SoundLevels;
}

function createInitialTunes(): SoundLevels {
  return Object.fromEntries(DRUM_SOUNDS.map((sound) => [sound.id, DEFAULT_DRUM_TUNE])) as SoundLevels;
}

/**
 * Tone.js 신스 기반 드럼 키트를 생성/정리하고, 패드·시퀀서에서 공용으로 쓰는
 * trigger 함수, 사운드별 볼륨/튠 컨트롤, 버스 FX(리버브·딜레이), 히트 카운터, 녹음용 스트림을 제공한다.
 */
export function useDrumKit() {
  const kitRef = useRef<DrumKit | null>(null);
  const mixBusRef = useRef<MixBus | null>(null);
  const [hitCounts, setHitCounts] = useState<HitCounts>(createInitialHitCounts);
  const [soundVolumes, setSoundVolumes] = useState<SoundLevels>(createInitialVolumes);
  const [soundTunes, setSoundTunes] = useState<SoundLevels>(createInitialTunes);
  const [reverbWet, setReverbWetState] = useState(0);
  const [delayWet, setDelayWetState] = useState(0);

  useEffect(() => {
    const mixBus = createMixBus();
    const kit = createDrumKit(mixBus.input);
    mixBusRef.current = mixBus;
    kitRef.current = kit;
    return () => {
      kit.dispose();
      mixBus.dispose();
      kitRef.current = null;
      mixBusRef.current = null;
    };
  }, []);

  /**
   * 사운드를 재생한다. time이 주어지면(시퀀서 재생) 시각 피드백도
   * Tone.Draw로 같은 오디오 시각에 맞춰 갱신한다. 없으면(라이브 연주) 즉시 갱신한다.
   */
  const trigger = useCallback((id: DrumSoundId, time?: number) => {
    kitRef.current?.trigger(id, time);

    const flash = () => setHitCounts((prev) => ({ ...prev, [id]: prev[id] + 1 }));
    if (time === undefined) {
      flash();
    } else {
      Tone.getDraw().schedule(flash, time);
    }
  }, []);

  const setSoundVolume = useCallback((id: DrumSoundId, value: number) => {
    kitRef.current?.setSoundVolume(id, amplitudeToDb(value));
    setSoundVolumes((prev) => ({ ...prev, [id]: value }));
  }, []);

  const setSoundTune = useCallback((id: DrumSoundId, semitones: number) => {
    kitRef.current?.setSoundTune(id, semitones);
    setSoundTunes((prev) => ({ ...prev, [id]: semitones }));
  }, []);

  const setReverbWet = useCallback((wet: number) => {
    mixBusRef.current?.setReverbWet(wet);
    setReverbWetState(wet);
  }, []);

  const setDelayWet = useCallback((wet: number) => {
    mixBusRef.current?.setDelayWet(wet);
    setDelayWetState(wet);
  }, []);

  /** 녹음 시작 시점에 현재 믹스 버스의 스트림을 가져온다(마운트 직후 ref에 채워짐). */
  const getMixStream = useCallback((): MediaStream | null => mixBusRef.current?.stream ?? null, []);

  return {
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
  };
}
