import * as Tone from "tone";
import { DJ_MASTER_LIMITER_THRESHOLD_DB } from "@/lib/constants";

/**
 * 두 덱을 크로스페이더로 묶고, 마스터 버스(리미터+미터)를 거쳐
 * 앱 공용 단일 마스터 출력(Tone.Destination)에 연결한다.
 */
export interface DjMixer {
  /** 덱 A 채널 출력을 연결할 입력 */
  readonly inputA: Tone.ToneAudioNode;
  /** 덱 B 채널 출력을 연결할 입력 */
  readonly inputB: Tone.ToneAudioNode;
  /** FX 드롭 패드 출력을 연결할 입력. 크로스페이더를 거치지 않고 마스터 버스에 직접 합류한다. */
  readonly fxInput: Tone.ToneAudioNode;
  /** 0(A 전용) ~ 1(B 전용) */
  setCrossfade(value: number): void;
  /** 0~1 정규화된 마스터 출력 레벨 */
  getMasterLevel(): number;
  dispose(): void;
}

export function createDjMixer(): DjMixer {
  const crossFade = new Tone.CrossFade();
  const masterGain = new Tone.Gain(1);
  const limiter = new Tone.Limiter(DJ_MASTER_LIMITER_THRESHOLD_DB);
  const meter = new Tone.Meter({ normalRange: true });

  crossFade.connect(masterGain);
  masterGain.chain(limiter, Tone.Destination);
  limiter.connect(meter);

  return {
    inputA: crossFade.a,
    inputB: crossFade.b,
    fxInput: masterGain,
    setCrossfade(value) {
      crossFade.fade.value = value;
    },
    getMasterLevel() {
      const value = meter.getValue();
      return typeof value === "number" ? value : value[0];
    },
    dispose() {
      crossFade.dispose();
      masterGain.dispose();
      limiter.dispose();
      meter.dispose();
    },
  };
}
