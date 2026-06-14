import * as Tone from "tone";

export type DeckEqBand = "low" | "mid" | "high";

/**
 * DJ 덱 1개 분량의 오디오 체인: Player → EQ3 → Gain(채널 볼륨).
 * 재생 위치는 Tone.Player가 직접 제공하지 않으므로 시작 시각 + 오프셋으로 직접 추적한다.
 */
export interface DeckEngine {
  /** 믹서 입력(크로스페이더의 a 또는 b)에 채널 출력을 연결한다. */
  connect(destination: Tone.ToneAudioNode): void;
  /** 새 트랙을 로드한다. 기존 재생/큐 포인트는 초기화된다. */
  load(buffer: AudioBuffer): void;
  hasTrack(): boolean;
  isPlaying(): boolean;
  play(): void;
  pause(): void;
  /** 재생 중이면 정지 후 큐 포인트로, 정지 상태면 큐 포인트로 위치만 이동한다. */
  cue(): void;
  /** 초 단위로 위치를 이동한다. 새 위치는 큐 포인트로도 갱신된다(0~duration로 클램프). */
  seek(seconds: number): void;
  /** percent% 만큼 속도를 변경한다 (1 + percent/100 배속, 피치도 함께 변한다). */
  setPitch(percent: number): void;
  setEq(band: DeckEqBand, db: number): void;
  /** 0~1 정규화된 채널 볼륨 */
  setVolume(amplitude: number): void;
  getPosition(): number;
  getDuration(): number;
  dispose(): void;
}

export function createDeckEngine(): DeckEngine {
  const eq = new Tone.EQ3();
  const channel = new Tone.Gain(1);
  eq.connect(channel);

  let player: Tone.Player | null = null;
  let duration = 0;
  let cuePoint = 0;
  let offset = 0;
  let startTime = 0;
  let playbackRate = 1;
  let playing = false;

  /** 현재까지 경과한 재생 위치(초)를 계산한다. 정지 중이면 마지막 오프셋을 그대로 반환. */
  function getPosition(): number {
    if (!player) return 0;
    if (!playing) return offset;
    const elapsed = (Tone.now() - startTime) * playbackRate;
    return Math.min(offset + elapsed, duration);
  }

  /** 피치 변경/시크 시 현재 위치를 새 오프셋으로 고정해 위치 계산이 끊기지 않게 한다. */
  function rebase(): void {
    offset = getPosition();
    startTime = Tone.now();
  }

  function disposePlayer(): void {
    player?.stop();
    player?.dispose();
    player = null;
  }

  return {
    connect(destination) {
      channel.connect(destination);
    },
    load(buffer) {
      disposePlayer();
      duration = buffer.duration;
      offset = 0;
      cuePoint = 0;
      playing = false;
      const next = new Tone.Player(buffer).connect(eq);
      next.playbackRate = playbackRate;
      player = next;
    },
    hasTrack() {
      return player !== null;
    },
    isPlaying() {
      return playing;
    },
    play() {
      if (!player || playing) return;
      player.start(undefined, offset);
      startTime = Tone.now();
      playing = true;
    },
    pause() {
      if (!player || !playing) return;
      offset = getPosition();
      player.stop();
      playing = false;
    },
    cue() {
      if (!player) return;
      if (playing) {
        player.stop();
        playing = false;
      }
      offset = cuePoint;
    },
    seek(seconds) {
      const clamped = Math.min(Math.max(seconds, 0), duration);
      cuePoint = clamped;
      offset = clamped;
      if (playing && player) {
        player.stop();
        player.start(undefined, clamped);
        startTime = Tone.now();
      }
    },
    setPitch(percent) {
      if (playing) rebase();
      playbackRate = 1 + percent / 100;
      if (player) player.playbackRate = playbackRate;
    },
    setEq(band, db) {
      eq[band].value = db;
    },
    setVolume(amplitude) {
      channel.gain.value = amplitude;
    },
    getPosition,
    getDuration() {
      return duration;
    },
    dispose() {
      disposePlayer();
      eq.dispose();
      channel.dispose();
    },
  };
}
