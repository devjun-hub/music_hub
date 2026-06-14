import * as Tone from "tone";

/**
 * 리믹스 트랙 1개 분량의 오디오 체인: Player → Panner → Gain(볼륨) → Gain(뮤트/솔로 게이트).
 * Player는 전역 Tone.Transport에 동기화되어 다른 트랙과 같은 타임라인에서 재생/정지된다.
 */
export interface TrackEngine {
  /** 마스터 믹스 버스 입력에 연결한다. */
  connect(destination: Tone.ToneAudioNode): void;
  /** 새 오디오를 로드한다. 기존 플레이어는 정리 후 교체된다. */
  load(buffer: AudioBuffer): void;
  /** 0~1 정규화된 채널 볼륨 */
  setVolume(amplitude: number): void;
  /** -1(왼쪽) ~ 1(오른쪽) */
  setPan(value: number): void;
  /** 뮤트/솔로 조합 결과(다른 트랙 상태까지 고려)를 반영한 최종 출력 on/off */
  setActive(active: boolean): void;
  getDuration(): number;
  dispose(): void;
}

export function createTrackEngine(): TrackEngine {
  const panner = new Tone.Panner(0);
  const volumeGain = new Tone.Gain(1);
  const activeGain = new Tone.Gain(1);
  panner.chain(volumeGain, activeGain);

  let player: Tone.Player | null = null;
  let duration = 0;

  function disposePlayer(): void {
    if (!player) return;
    player.unsync();
    player.stop();
    player.dispose();
    player = null;
  }

  return {
    connect(destination) {
      activeGain.connect(destination);
    },
    load(buffer) {
      disposePlayer();
      duration = buffer.duration;
      const next = new Tone.Player(buffer).connect(panner);
      next.sync().start(0);
      player = next;
    },
    setVolume(amplitude) {
      volumeGain.gain.value = amplitude;
    },
    setPan(value) {
      panner.pan.value = value;
    },
    setActive(active) {
      activeGain.gain.value = active ? 1 : 0;
    },
    getDuration() {
      return duration;
    },
    dispose() {
      disposePlayer();
      panner.dispose();
      volumeGain.dispose();
      activeGain.dispose();
    },
  };
}
