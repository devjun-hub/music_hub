import * as Tone from "tone";
import { DJ_HOT_CUE_COUNT, type DjEchoDivision, type DjLoopBeats } from "@/lib/constants";
import { createDeckFxChain } from "./fxChain";

export type DeckEqBand = "low" | "mid" | "high";

/**
 * DJ 덱 1개 분량의 오디오 체인: Player → EQ3 → FX(필터/에코/리버브) → Gain(채널 볼륨).
 * 재생 위치는 Tone.Player가 직접 제공하지 않으므로 시작 시각 + 오프셋으로 직접 추적한다.
 */
export interface DeckEngine {
  /** 믹서 입력(크로스페이더의 a 또는 b)에 채널 출력을 연결한다. */
  connect(destination: Tone.ToneAudioNode): void;
  /** 새 트랙을 로드한다. 기존 재생/큐/핫큐/루프 상태는 초기화된다. */
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
  /** -1(로우패스 완전 닫힘) ~ 0(바이패스) ~ 1(하이패스 완전 닫힘) */
  setFilter(value: number): void;
  setEchoEnabled(enabled: boolean): void;
  setEchoWet(wet: number): void;
  setEchoDivision(division: DjEchoDivision): void;
  /** 현재 effectiveBpm에 맞춰 에코 딜레이 타임을 재계산한다. */
  setEchoBpm(effectiveBpm: number): void;
  setReverbEnabled(enabled: boolean): void;
  setReverbWet(wet: number): void;
  /** 현재 위치를 핫큐 슬롯(0~DJ_HOT_CUE_COUNT-1)에 저장한다. */
  setHotCue(index: number): void;
  /** 핫큐 슬롯으로 즉시 점프하며 재생을 시작한다(루프는 해제). 비어있으면 무시한다. */
  triggerHotCue(index: number): void;
  clearHotCue(index: number): void;
  getHotCues(): ReadonlyArray<number | null>;
  /** 비트 루프를 켜고 끈다. beatSeconds는 1비트 길이(초) — 켤 때 현재 위치부터 loopBeats개 비트를 반복한다. */
  toggleLoop(beatSeconds: number): void;
  setLoopBeats(beats: DjLoopBeats): void;
  isLoopActive(): boolean;
  getPosition(): number;
  getDuration(): number;
  dispose(): void;
}

export function createDeckEngine(): DeckEngine {
  const eq = new Tone.EQ3();
  const fxChain = createDeckFxChain();
  const channel = new Tone.Gain(1);
  eq.connect(fxChain.input);
  fxChain.output.connect(channel);

  let player: Tone.Player | null = null;
  let duration = 0;
  let cuePoint = 0;
  let offset = 0;
  let startTime = 0;
  let playbackRate = 1;
  let playing = false;

  let hotCues: Array<number | null> = new Array(DJ_HOT_CUE_COUNT).fill(null);
  let loopActive = false;
  let loopBeats: DjLoopBeats = 4;
  let loopStart = 0;
  let loopEnd = 0;
  /** 루프 켤 때 사용한 1비트 길이(초). setLoopBeats로 길이를 바꿀 때 재사용한다. */
  let loopBeatSeconds = 0;

  /** 현재까지 경과한 재생 위치(초)를 계산한다. 정지 중이면 마지막 오프셋을 그대로 반환. */
  function getPosition(): number {
    if (!player) return 0;
    if (!playing) return offset;
    const elapsed = (Tone.now() - startTime) * playbackRate;
    const rawPosition = offset + elapsed;
    if (loopActive && loopEnd > loopStart && rawPosition >= loopEnd) {
      const loopLength = loopEnd - loopStart;
      return loopStart + ((rawPosition - loopStart) % loopLength);
    }
    return Math.min(rawPosition, duration);
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
      hotCues = new Array(DJ_HOT_CUE_COUNT).fill(null);
      loopActive = false;
      loopStart = 0;
      loopEnd = 0;
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
      if (loopActive) {
        loopActive = false;
        player.loop = false;
      }
      offset = cuePoint;
    },
    seek(seconds) {
      const clamped = Math.min(Math.max(seconds, 0), duration);
      cuePoint = clamped;
      offset = clamped;
      if (loopActive && player) {
        loopActive = false;
        player.loop = false;
      }
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
    setFilter(value) {
      fxChain.setFilter(value);
    },
    setEchoEnabled(enabled) {
      fxChain.setEchoEnabled(enabled);
    },
    setEchoWet(wet) {
      fxChain.setEchoWet(wet);
    },
    setEchoDivision(division) {
      fxChain.setEchoDivision(division);
    },
    setEchoBpm(effectiveBpm) {
      fxChain.setEchoBpm(effectiveBpm);
    },
    setReverbEnabled(enabled) {
      fxChain.setReverbEnabled(enabled);
    },
    setReverbWet(wet) {
      fxChain.setReverbWet(wet);
    },
    setHotCue(index) {
      hotCues[index] = getPosition();
    },
    triggerHotCue(index) {
      const point = hotCues[index];
      if (point === null || point === undefined || !player) return;
      if (loopActive) {
        loopActive = false;
        player.loop = false;
      }
      player.stop();
      player.start(undefined, point);
      offset = point;
      startTime = Tone.now();
      playing = true;
    },
    clearHotCue(index) {
      hotCues[index] = null;
    },
    getHotCues() {
      return [...hotCues];
    },
    toggleLoop(beatSeconds) {
      if (!player) return;
      if (loopActive) {
        offset = getPosition();
        startTime = Tone.now();
        loopActive = false;
        player.loop = false;
        return;
      }
      const start = getPosition();
      const end = Math.min(start + loopBeats * beatSeconds, duration);
      if (end <= start) return;
      loopStart = start;
      loopEnd = end;
      loopBeatSeconds = beatSeconds;
      loopActive = true;
      player.loop = true;
      player.loopStart = loopStart;
      player.loopEnd = loopEnd;
      offset = loopStart;
      startTime = Tone.now();
    },
    setLoopBeats(beats) {
      loopBeats = beats;
      if (loopActive && loopBeatSeconds > 0 && player) {
        const newEnd = Math.min(loopStart + beats * loopBeatSeconds, duration);
        if (newEnd > loopStart) {
          loopEnd = newEnd;
          player.loopEnd = loopEnd;
        }
      }
    },
    isLoopActive() {
      return loopActive;
    },
    getPosition,
    getDuration() {
      return duration;
    },
    dispose() {
      disposePlayer();
      eq.dispose();
      fxChain.dispose();
      channel.dispose();
    },
  };
}
