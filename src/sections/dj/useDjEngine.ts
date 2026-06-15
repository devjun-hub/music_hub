"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { decodeAudioFile } from "@/audio/decodeAudioFile";
import { createDeckEngine, type DeckEngine, type DeckEqBand } from "@/audio/dj/deckEngine";
import { createFxPadKit, type FxPadKit } from "@/audio/dj/fxPads";
import { createDjMixer, type DjMixer } from "@/audio/dj/mixer";
import {
  DEFAULT_CROSSFADER,
  DEFAULT_DJ_DECK_BPM,
  DEFAULT_DJ_DECK_VOLUME,
  DEFAULT_DJ_ECHO_DIVISION,
  DEFAULT_DJ_FILTER,
  DEFAULT_DJ_LOOP_BEATS,
  DEFAULT_DJ_PITCH_RANGE,
  DEFAULT_ECHO_WET,
  DEFAULT_REVERB_WET,
  DJ_HOT_CUE_COUNT,
  DJ_NUDGE_PERCENT,
  type DjEchoDivision,
  type DjFxPadId,
  type DjLoopBeats,
} from "@/lib/constants";

export interface DeckUiState {
  trackName: string | null;
  duration: number;
  position: number;
  isPlaying: boolean;
  pitchPercent: number;
  pitchRange: number;
  eq: Record<DeckEqBand, number>;
  volume: number;
  bpm: number;
  loadError: string | null;
  /** -1(로우패스 완전 닫힘) ~ 0(바이패스) ~ 1(하이패스 완전 닫힘) */
  filter: number;
  echoEnabled: boolean;
  echoWet: number;
  echoDivision: DjEchoDivision;
  reverbEnabled: boolean;
  reverbWet: number;
  /** 핫큐 슬롯별 위치(초). null이면 비어있음. */
  hotCues: ReadonlyArray<number | null>;
  loopActive: boolean;
  loopBeats: DjLoopBeats;
}

export interface DeckControls extends DeckUiState {
  /** 보정된 BPM (기준 BPM × (1 + 피치%/100)) */
  effectiveBpm: number;
  loadFile(file: File): Promise<void>;
  /** 디코딩된 오디오 버퍼를 바로 로드한다 (내장 샘플 라이브러리 등 File이 아닌 소스용). */
  loadBuffer(name: string, buffer: AudioBuffer): void;
  togglePlay(): void;
  cue(): void;
  seek(seconds: number): void;
  setPitch(percent: number): void;
  setPitchRange(range: number): void;
  setEq(band: DeckEqBand, db: number): void;
  setVolume(amplitude: number): void;
  setBpm(bpm: number): void;
  /** 다른 덱의 보정 BPM에 맞춰 이 덱의 피치를 1회 보정한다 (지속적 자동 동기화 아님). */
  matchBpm(): void;
  /** true=누름(임시 피치 보정 적용), false=뗌(페이더 값으로 복귀) */
  nudge(direction: 1 | -1, active: boolean): void;
  setFilter(value: number): void;
  setEchoEnabled(enabled: boolean): void;
  setEchoWet(wet: number): void;
  setEchoDivision(division: DjEchoDivision): void;
  setReverbEnabled(enabled: boolean): void;
  setReverbWet(wet: number): void;
  /** 핫큐 슬롯에 현재 위치를 저장한다. */
  setHotCue(index: number): void;
  /** 핫큐 슬롯으로 점프한다. 비어있으면 현재 위치를 저장한다. */
  triggerHotCue(index: number): void;
  clearHotCue(index: number): void;
  /** 비트 루프를 켜고 끈다. 현재 effectiveBpm 기준 1비트 길이로 loopBeats개 비트를 반복한다. */
  toggleLoop(): void;
  setLoopBeats(beats: DjLoopBeats): void;
}

export interface DjEngine {
  deckA: DeckControls;
  deckB: DeckControls;
  /** 0(A 전용) ~ 1(B 전용) */
  crossfade: number;
  setCrossfade(value: number): void;
  /** 페스티벌 드롭 FX 패드를 트리거한다. 크로스페이더 위치와 무관하게 마스터 버스에 직접 들린다. */
  triggerFxPad(id: DjFxPadId): void;
  /** 0~1 정규화된 마스터 출력 레벨 */
  getMasterLevel(): number;
}

function createInitialDeckState(): DeckUiState {
  return {
    trackName: null,
    duration: 0,
    position: 0,
    isPlaying: false,
    pitchPercent: 0,
    pitchRange: DEFAULT_DJ_PITCH_RANGE,
    eq: { low: 0, mid: 0, high: 0 },
    volume: DEFAULT_DJ_DECK_VOLUME,
    bpm: DEFAULT_DJ_DECK_BPM,
    loadError: null,
    filter: DEFAULT_DJ_FILTER,
    echoEnabled: false,
    echoWet: DEFAULT_ECHO_WET,
    echoDivision: DEFAULT_DJ_ECHO_DIVISION,
    reverbEnabled: false,
    reverbWet: DEFAULT_REVERB_WET,
    hotCues: new Array(DJ_HOT_CUE_COUNT).fill(null),
    loopActive: false,
    loopBeats: DEFAULT_DJ_LOOP_BEATS,
  };
}

const LOAD_ERROR_MESSAGE =
  "이 파일은 재생할 수 없습니다. 지원되지 않는 형식이거나 손상된 파일일 수 있습니다.";

/**
 * DJ 섹션 오디오 엔진(믹서 + 덱 A/B)을 생성/정리하고, 두 덱의 UI 상태와
 * 컨트롤 함수를 반환한다. 오디오 노드 생성/연결/해제는 이 훅 안에서만 다룬다.
 */
export function useDjEngine(): DjEngine {
  const engineRef = useRef<{
    mixer: DjMixer;
    deckA: DeckEngine;
    deckB: DeckEngine;
    fxPads: FxPadKit;
  } | null>(null);
  const [deckAState, setDeckAState] = useState<DeckUiState>(createInitialDeckState);
  const [deckBState, setDeckBState] = useState<DeckUiState>(createInitialDeckState);
  const [crossfade, setCrossfadeState] = useState(DEFAULT_CROSSFADER);

  useEffect(() => {
    const mixer = createDjMixer();
    const deckA = createDeckEngine();
    const deckB = createDeckEngine();
    const fxPads = createFxPadKit(mixer.fxInput);
    deckA.connect(mixer.inputA);
    deckB.connect(mixer.inputB);
    mixer.setCrossfade(DEFAULT_CROSSFADER);
    deckA.setVolume(DEFAULT_DJ_DECK_VOLUME);
    deckB.setVolume(DEFAULT_DJ_DECK_VOLUME);
    deckA.setEchoBpm(DEFAULT_DJ_DECK_BPM);
    deckB.setEchoBpm(DEFAULT_DJ_DECK_BPM);
    engineRef.current = { mixer, deckA, deckB, fxPads };

    return () => {
      deckA.dispose();
      deckB.dispose();
      fxPads.dispose();
      mixer.dispose();
      engineRef.current = null;
    };
  }, []);

  // 재생 중인 덱의 위치를 매 프레임 갱신하고, 트랙 끝에 도달하면 자동 정지한다.
  useEffect(() => {
    let frame: number;

    const tick = () => {
      const engines = engineRef.current;
      if (engines) {
        syncDeckPosition(engines.deckA, setDeckAState);
        syncDeckPosition(engines.deckB, setDeckBState);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  function setCrossfade(value: number): void {
    engineRef.current?.mixer.setCrossfade(value);
    setCrossfadeState(value);
  }

  // engineRef는 동기 콜백(키보드 핸들러, rAF 루프)에서만 읽으며 렌더 중에는 호출되지 않는다.
  const triggerFxPad = useCallback((id: DjFxPadId) => {
    engineRef.current?.fxPads.trigger(id);
  }, []);

  const getMasterLevel = useCallback(() => {
    return engineRef.current?.mixer.getMasterLevel() ?? 0;
  }, []);

  function buildDeckControls(
    deckKey: "deckA" | "deckB",
    state: DeckUiState,
    setState: (updater: (prev: DeckUiState) => DeckUiState) => void,
    getOtherState: () => DeckUiState,
  ): DeckControls {
    const getEngine = () => engineRef.current?.[deckKey];
    return buildControls(getEngine, state, setState, getOtherState);
  }

  // DeckControls의 메서드들은 이벤트 핸들러에서만 engineRef.current(getEngine)에 접근하고
  // 렌더 중에는 호출되지 않는다. react-hooks/refs는 이 패턴을 정적으로 검증하지 못한다.
  // eslint-disable-next-line react-hooks/refs
  const deckA = buildDeckControls("deckA", deckAState, setDeckAState, () => deckBState);
  // eslint-disable-next-line react-hooks/refs
  const deckB = buildDeckControls("deckB", deckBState, setDeckBState, () => deckAState);

  return { deckA, deckB, crossfade, setCrossfade, triggerFxPad, getMasterLevel };
}

/** 재생 중인 덱의 위치를 폴링하고, 트랙 끝에 도달하면 자동 정지한다. */
function syncDeckPosition(engine: DeckEngine, setState: Dispatch<SetStateAction<DeckUiState>>): void {
  if (!engine.isPlaying()) return;
  const position = engine.getPosition();
  const duration = engine.getDuration();
  if (position >= duration) {
    engine.pause();
    setState((prev) => ({ ...prev, isPlaying: false, position: duration }));
  } else {
    setState((prev) => (prev.position === position ? prev : { ...prev, position }));
  }
}

function buildControls(
  getEngine: () => DeckEngine | undefined,
  state: DeckUiState,
  setState: (updater: (prev: DeckUiState) => DeckUiState) => void,
  getOtherState: () => DeckUiState,
): DeckControls {
  function applyBuffer(name: string, buffer: AudioBuffer): void {
    const engine = getEngine();
    if (!engine) return;
    engine.load(buffer);
    setState((prev) => ({
      ...prev,
      trackName: name,
      duration: buffer.duration,
      position: 0,
      isPlaying: false,
      loadError: null,
      hotCues: new Array(DJ_HOT_CUE_COUNT).fill(null),
      loopActive: false,
    }));
  }

  return {
    ...state,
    effectiveBpm: state.bpm * (1 + state.pitchPercent / 100),

    async loadFile(file) {
      if (!getEngine()) return;
      try {
        const audioBuffer = await decodeAudioFile(file);
        applyBuffer(file.name, audioBuffer);
      } catch {
        setState((prev) => ({ ...prev, loadError: LOAD_ERROR_MESSAGE }));
      }
    },

    loadBuffer(name, buffer) {
      applyBuffer(name, buffer);
    },

    togglePlay() {
      const engine = getEngine();
      if (!engine || !engine.hasTrack()) return;
      if (engine.isPlaying()) {
        engine.pause();
      } else {
        engine.play();
      }
      setState((prev) => ({ ...prev, isPlaying: engine.isPlaying() }));
    },

    cue() {
      const engine = getEngine();
      if (!engine || !engine.hasTrack()) return;
      engine.cue();
      setState((prev) => ({
        ...prev,
        isPlaying: engine.isPlaying(),
        position: engine.getPosition(),
        loopActive: engine.isLoopActive(),
      }));
    },

    seek(seconds) {
      const engine = getEngine();
      if (!engine || !engine.hasTrack()) return;
      engine.seek(seconds);
      setState((prev) => ({
        ...prev,
        position: engine.getPosition(),
        loopActive: engine.isLoopActive(),
      }));
    },

    setPitch(percent) {
      const engine = getEngine();
      engine?.setPitch(percent);
      setState((prev) => {
        engine?.setEchoBpm(prev.bpm * (1 + percent / 100));
        return { ...prev, pitchPercent: percent };
      });
    },

    setPitchRange(range) {
      setState((prev) => {
        const clamped = Math.min(Math.max(prev.pitchPercent, -range), range);
        if (clamped !== prev.pitchPercent) {
          const engine = getEngine();
          engine?.setPitch(clamped);
          engine?.setEchoBpm(prev.bpm * (1 + clamped / 100));
        }
        return { ...prev, pitchRange: range, pitchPercent: clamped };
      });
    },

    setEq(band, db) {
      getEngine()?.setEq(band, db);
      setState((prev) => ({ ...prev, eq: { ...prev.eq, [band]: db } }));
    },

    setVolume(amplitude) {
      getEngine()?.setVolume(amplitude);
      setState((prev) => ({ ...prev, volume: amplitude }));
    },

    setBpm(bpm) {
      const engine = getEngine();
      setState((prev) => {
        engine?.setEchoBpm(bpm * (1 + prev.pitchPercent / 100));
        return { ...prev, bpm };
      });
    },

    matchBpm() {
      const other = getOtherState();
      const otherEffective = other.bpm * (1 + other.pitchPercent / 100);
      setState((prev) => {
        if (prev.bpm <= 0) return prev;
        const targetPitch = (otherEffective / prev.bpm - 1) * 100;
        const clamped = Math.min(Math.max(targetPitch, -prev.pitchRange), prev.pitchRange);
        const engine = getEngine();
        engine?.setPitch(clamped);
        engine?.setEchoBpm(prev.bpm * (1 + clamped / 100));
        return { ...prev, pitchPercent: clamped };
      });
    },

    nudge(direction, active) {
      const engine = getEngine();
      if (!engine) return;
      const target = active ? state.pitchPercent + direction * DJ_NUDGE_PERCENT : state.pitchPercent;
      engine.setPitch(target);
    },

    setFilter(value) {
      getEngine()?.setFilter(value);
      setState((prev) => ({ ...prev, filter: value }));
    },

    setEchoEnabled(enabled) {
      getEngine()?.setEchoEnabled(enabled);
      setState((prev) => ({ ...prev, echoEnabled: enabled }));
    },

    setEchoWet(wet) {
      getEngine()?.setEchoWet(wet);
      setState((prev) => ({ ...prev, echoWet: wet }));
    },

    setEchoDivision(division) {
      const engine = getEngine();
      engine?.setEchoDivision(division);
      setState((prev) => {
        engine?.setEchoBpm(prev.bpm * (1 + prev.pitchPercent / 100));
        return { ...prev, echoDivision: division };
      });
    },

    setReverbEnabled(enabled) {
      getEngine()?.setReverbEnabled(enabled);
      setState((prev) => ({ ...prev, reverbEnabled: enabled }));
    },

    setReverbWet(wet) {
      getEngine()?.setReverbWet(wet);
      setState((prev) => ({ ...prev, reverbWet: wet }));
    },

    setHotCue(index) {
      const engine = getEngine();
      if (!engine) return;
      engine.setHotCue(index);
      setState((prev) => {
        const hotCues = [...prev.hotCues];
        hotCues[index] = engine.getHotCues()[index];
        return { ...prev, hotCues };
      });
    },

    triggerHotCue(index) {
      const engine = getEngine();
      if (!engine) return;
      engine.triggerHotCue(index);
      setState((prev) => ({
        ...prev,
        isPlaying: engine.isPlaying(),
        position: engine.getPosition(),
        loopActive: engine.isLoopActive(),
      }));
    },

    clearHotCue(index) {
      const engine = getEngine();
      if (!engine) return;
      engine.clearHotCue(index);
      setState((prev) => {
        const hotCues = [...prev.hotCues];
        hotCues[index] = null;
        return { ...prev, hotCues };
      });
    },

    toggleLoop() {
      const engine = getEngine();
      if (!engine || !engine.hasTrack()) return;
      const effectiveBpm = state.bpm * (1 + state.pitchPercent / 100);
      if (effectiveBpm <= 0) return;
      engine.toggleLoop(60 / effectiveBpm);
      setState((prev) => ({ ...prev, loopActive: engine.isLoopActive() }));
    },

    setLoopBeats(beats) {
      getEngine()?.setLoopBeats(beats);
      setState((prev) => ({ ...prev, loopBeats: beats }));
    },
  };
}
