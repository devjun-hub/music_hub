import * as Tone from "tone";
import {
  DEFAULT_ECHO_WET,
  DEFAULT_REVERB_WET,
  ECHO_DELAY_TIME,
  ECHO_FEEDBACK,
  REVERB_DECAY,
} from "@/lib/constants";

/**
 * 녹음 셀 1개의 이펙트 체인: PitchShift(오토튠) → FeedbackDelay(에코) → Reverb.
 * on/off는 wet 값을 0으로 낮춰서 구현해, 토글 시 노드 재연결 없이 즉시 반영된다.
 */
export interface CellEffectsChain {
  /** Player를 연결할 입력단 (PitchShift) */
  readonly input: Tone.ToneAudioNode;
  /** 볼륨 Gain으로 이어지는 출력단 (Reverb) */
  readonly output: Tone.ToneAudioNode;
  setEchoEnabled(enabled: boolean): void;
  setEchoWet(wet: number): void;
  setReverbEnabled(enabled: boolean): void;
  setReverbWet(wet: number): void;
  /** 오토튠 보정값(semitone)을 즉시 적용한다. */
  setAutotunePitch(semitones: number): void;
  dispose(): void;
}

export function createCellEffectsChain(): CellEffectsChain {
  const pitchShift = new Tone.PitchShift({ pitch: 0 });
  const echo = new Tone.FeedbackDelay({
    delayTime: ECHO_DELAY_TIME,
    feedback: ECHO_FEEDBACK,
    wet: 0,
  });
  const reverb = new Tone.Reverb({ decay: REVERB_DECAY, wet: 0 });
  // 임펄스 리스폰스 생성은 비동기. 생성 전까지는 wet=0이라 무음 상태로 안전하다.
  void reverb.generate();

  pitchShift.chain(echo, reverb);

  let echoEnabled = false;
  let echoWet = DEFAULT_ECHO_WET;
  let reverbEnabled = false;
  let reverbWet = DEFAULT_REVERB_WET;

  return {
    input: pitchShift,
    output: reverb,
    setEchoEnabled(enabled) {
      echoEnabled = enabled;
      echo.wet.value = enabled ? echoWet : 0;
    },
    setEchoWet(wet) {
      echoWet = wet;
      if (echoEnabled) echo.wet.value = wet;
    },
    setReverbEnabled(enabled) {
      reverbEnabled = enabled;
      reverb.wet.value = enabled ? reverbWet : 0;
    },
    setReverbWet(wet) {
      reverbWet = wet;
      if (reverbEnabled) reverb.wet.value = wet;
    },
    setAutotunePitch(semitones) {
      pitchShift.pitch = semitones;
    },
    dispose() {
      pitchShift.dispose();
      echo.dispose();
      reverb.dispose();
    },
  };
}
