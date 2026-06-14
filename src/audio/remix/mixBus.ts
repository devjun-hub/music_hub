import * as Tone from "tone";
import { getAudioContext } from "../context";

/**
 * 모든 리믹스 트랙이 모이는 마스터 버스.
 * 앱 마스터 출력(Tone.Destination)으로 모니터링하면서, 동시에
 * MediaStreamAudioDestinationNode로도 내보내 MediaRecorder로 믹스를 캡처할 수 있게 한다.
 */
export interface MixBus {
  readonly input: Tone.ToneAudioNode;
  readonly stream: MediaStream;
  dispose(): void;
}

export function createMixBus(): MixBus {
  const gain = new Tone.Gain(1).toDestination();
  const streamDestination = getAudioContext().createMediaStreamDestination();
  gain.connect(streamDestination);

  return {
    input: gain,
    stream: streamDestination.stream,
    dispose() {
      gain.dispose();
    },
  };
}
