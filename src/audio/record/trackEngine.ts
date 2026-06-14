import * as Tone from "tone";
import {
  AUTOTUNE_ANALYSIS_INTERVAL_MS,
  AUTOTUNE_FFT_SIZE,
  AUTOTUNE_MAX_FREQUENCY,
  AUTOTUNE_MIN_FREQUENCY,
  DEFAULT_AUTOTUNE_RETUNE,
  DEFAULT_AUTOTUNE_SCALE,
  type AutotuneScaleId,
} from "@/lib/constants";
import { getAudioContext } from "../context";
import { createCellEffectsChain, type CellEffectsChain } from "./effects";
import { calculatePitchCorrection, createPitchDetector, type PitchDetector } from "./pitch";

/**
 * 녹음 셀 1개의 오디오 체인: Player → 이펙트 체인(오토튠/에코/리버브) → Gain(볼륨) → 마스터 버스.
 * Player는 전역 Tone.Transport에 동기화되어 다른 셀과 같은 타임라인에서 재생/정지된다.
 *
 * 오토튠이 켜져 있으면 Player 출력을 별도 Analyser로 분석(YIN)해 피치를 감지하고,
 * 선택한 스케일에서 가장 가까운 음과의 차이를 "보정 속도"만큼 글라이드하며
 * 이펙트 체인의 PitchShift.pitch에 적용한다.
 */
export interface CellEngine {
  /** 마스터 믹스 버스 입력에 연결한다. */
  connect(destination: Tone.ToneAudioNode): void;
  /** 새 오디오를 로드한다. 기존 플레이어는 정리 후 교체된다. */
  load(buffer: AudioBuffer): void;
  /** 0~1 정규화된 채널 볼륨 */
  setVolume(amplitude: number): void;
  setEchoEnabled(enabled: boolean): void;
  setEchoWet(wet: number): void;
  setReverbEnabled(enabled: boolean): void;
  setReverbWet(wet: number): void;
  setAutotuneEnabled(enabled: boolean): void;
  setAutotuneScale(scale: AutotuneScaleId): void;
  /** 0~1: 분석 주기마다 목표 피치로 다가가는 비율 */
  setAutotuneRetune(speed: number): void;
  getDuration(): number;
  dispose(): void;
}

export function createCellEngine(): CellEngine {
  const effects: CellEffectsChain = createCellEffectsChain();
  const analyser = new Tone.Analyser("waveform", AUTOTUNE_FFT_SIZE);
  const volumeGain = new Tone.Gain(1);
  effects.output.connect(volumeGain);

  const detectPitch: PitchDetector = createPitchDetector(getAudioContext().sampleRate);

  let player: Tone.Player | null = null;
  let duration = 0;
  let autotuneEnabled = false;
  let autotuneScale: AutotuneScaleId = DEFAULT_AUTOTUNE_SCALE;
  let autotuneRetune = DEFAULT_AUTOTUNE_RETUNE;
  let currentPitch = 0;

  const analysisTimer = setInterval(() => {
    if (!autotuneEnabled) return;

    const waveform = analyser.getValue();
    if (!(waveform instanceof Float32Array)) return;

    const frequency = detectPitch(waveform);
    if (
      frequency === null ||
      frequency < AUTOTUNE_MIN_FREQUENCY ||
      frequency > AUTOTUNE_MAX_FREQUENCY
    ) {
      return;
    }

    const target = calculatePitchCorrection(frequency, autotuneScale);
    currentPitch += (target - currentPitch) * autotuneRetune;
    effects.setAutotunePitch(currentPitch);
  }, AUTOTUNE_ANALYSIS_INTERVAL_MS);

  function disposePlayer(): void {
    if (!player) return;
    player.unsync();
    player.stop();
    player.disconnect();
    player.dispose();
    player = null;
  }

  return {
    connect(destination) {
      volumeGain.connect(destination);
    },
    load(buffer) {
      disposePlayer();
      duration = buffer.duration;
      const next = new Tone.Player(buffer);
      next.connect(analyser);
      next.connect(effects.input);
      next.sync().start(0);
      player = next;
    },
    setVolume(amplitude) {
      volumeGain.gain.value = amplitude;
    },
    setEchoEnabled(enabled) {
      effects.setEchoEnabled(enabled);
    },
    setEchoWet(wet) {
      effects.setEchoWet(wet);
    },
    setReverbEnabled(enabled) {
      effects.setReverbEnabled(enabled);
    },
    setReverbWet(wet) {
      effects.setReverbWet(wet);
    },
    setAutotuneEnabled(enabled) {
      autotuneEnabled = enabled;
      if (!enabled) {
        currentPitch = 0;
        effects.setAutotunePitch(0);
      }
    },
    setAutotuneScale(scale) {
      autotuneScale = scale;
    },
    setAutotuneRetune(speed) {
      autotuneRetune = speed;
    },
    getDuration() {
      return duration;
    },
    dispose() {
      clearInterval(analysisTimer);
      disposePlayer();
      analyser.dispose();
      effects.dispose();
      volumeGain.dispose();
    },
  };
}
