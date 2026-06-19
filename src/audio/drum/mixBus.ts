import * as Tone from "tone";
import { getAudioContext } from "../context";

/**
 * 드럼 키트 출력이 모이는 버스.
 * 리버브 → 딜레이 FX 체인을 통해 마스터로 출력하며,
 * MediaRecorder 캡처를 위한 스트림도 함께 제공한다.
 */
export interface MixBus {
  readonly input: Tone.ToneAudioNode;
  readonly stream: MediaStream;
  setReverbWet(wet: number): void;
  setDelayWet(wet: number): void;
  dispose(): void;
}

export function createMixBus(): MixBus {
  const inputGain = new Tone.Gain(1);

  // 알고리즘 리버브 (wet=0 = 드라이, 1 = 풀 리버브)
  const reverb = new Tone.Reverb({ decay: 2.0, wet: 0 });
  // 박자 동기 딜레이 (8분음표 기준, wet=0 = 드라이)
  const delay = new Tone.FeedbackDelay({ delayTime: "8n", feedback: 0.35, wet: 0 });

  // 신호 체인: inputGain → reverb → delay → destination
  inputGain.chain(reverb, delay);
  delay.toDestination();

  // 녹음 스트림 (FX 적용 후 출력을 캡처)
  const streamDestination = getAudioContext().createMediaStreamDestination();
  delay.connect(streamDestination);

  return {
    input: inputGain,
    stream: streamDestination.stream,
    setReverbWet(wet) {
      reverb.wet.value = wet;
    },
    setDelayWet(wet) {
      delay.wet.value = wet;
    },
    dispose() {
      inputGain.dispose();
      reverb.dispose();
      delay.dispose();
    },
  };
}
