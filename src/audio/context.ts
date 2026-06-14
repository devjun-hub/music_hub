import * as Tone from "tone";

let unlocked = false;

/**
 * 앱 전체에서 공유하는 단일 AudioContext.
 * Tone.js가 내부적으로 생성/관리하는 컨텍스트를 그대로 노출한다.
 * 섹션별로 새 AudioContext를 만들지 않는다.
 */
export function getAudioContext(): AudioContext {
  return Tone.getContext().rawContext as AudioContext;
}

/**
 * iOS Safari는 첫 제스처에서 무음 버퍼를 한 번 재생해야
 * 이후 오디오 재생 지연/무음 문제가 사라진다.
 */
function unlockIOSAudio(context: AudioContext): void {
  const buffer = context.createBuffer(1, 1, context.sampleRate);
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start(0);
}

/**
 * 사용자 제스처(클릭/터치) 핸들러 안에서만 호출할 것.
 * Tone.start()로 AudioContext를 resume하고 iOS 언락을 수행한다.
 */
export async function unlockAudioContext(): Promise<void> {
  if (unlocked) return;
  await Tone.start();
  unlockIOSAudio(getAudioContext());
  unlocked = true;
}

export function isAudioContextUnlocked(): boolean {
  return unlocked;
}

/** 전역 BPM. Transport를 사용하는 모든 섹션(드럼, DJ 등)이 이 값을 공유한다. */
export function setGlobalBpm(bpm: number): void {
  Tone.getTransport().bpm.value = bpm;
}

export function getGlobalBpm(): number {
  return Tone.getTransport().bpm.value;
}

/** 0(무음) ~ 1(최대) 정규화 값을 데시벨로 변환한다. */
export function amplitudeToDb(amplitude: number): number {
  if (amplitude <= 0) return Number.NEGATIVE_INFINITY;
  return 20 * Math.log10(amplitude);
}

/** 마스터 출력(Tone.Destination) 볼륨을 0~1 정규화 값으로 설정한다. */
export function setMasterVolume(amplitude: number): void {
  Tone.getDestination().volume.value = amplitudeToDb(amplitude);
}
