import * as Tone from "tone";

/** 두 덱을 크로스페이더로 묶어 앱 공용 단일 마스터 출력(Tone.Destination)에 연결한다. */
export interface DjMixer {
  /** 덱 A 채널 출력을 연결할 입력 */
  readonly inputA: Tone.ToneAudioNode;
  /** 덱 B 채널 출력을 연결할 입력 */
  readonly inputB: Tone.ToneAudioNode;
  /** 0(A 전용) ~ 1(B 전용) */
  setCrossfade(value: number): void;
  dispose(): void;
}

export function createDjMixer(): DjMixer {
  const crossFade = new Tone.CrossFade().toDestination();

  return {
    inputA: crossFade.a,
    inputB: crossFade.b,
    setCrossfade(value) {
      crossFade.fade.value = value;
    },
    dispose() {
      crossFade.dispose();
    },
  };
}
