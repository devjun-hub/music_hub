import * as Tone from "tone";
import { DRUM_SOUNDS, STEP_COUNT, type DrumSoundId } from "@/lib/constants";
import { createDrumKit } from "./drumKit";

/** 8트랙 x 16스텝 드럼 패턴 (사운드별 스텝 on/off 배열) */
export type Pattern = Record<DrumSoundId, boolean[]>;

export function createEmptyPattern(): Pattern {
  return Object.fromEntries(
    DRUM_SOUNDS.map((sound) => [sound.id, Array<boolean>(STEP_COUNT).fill(false)]),
  ) as Pattern;
}

/** 패턴에 켜진 스텝이 하나라도 있는지 확인한다. */
export function hasActiveStep(pattern: Pattern): boolean {
  return DRUM_SOUNDS.some((sound) => pattern[sound.id].some(Boolean));
}

const EMPTY_PATTERN = createEmptyPattern();

let currentPattern: Pattern = createEmptyPattern();
const listeners = new Set<() => void>();

/**
 * 드럼 섹션의 현재 패턴을 리믹스 섹션과 공유하는 모듈 스토어.
 * 섹션 간 직접 의존을 피하기 위해 이 공통 오디오 모듈을 거쳐서만 주고받는다.
 */
export function getDrumPatternSnapshot(): Pattern {
  return currentPattern;
}

/** useSyncExternalStore의 서버 스냅샷(고정 참조)용 빈 패턴. */
export function getEmptyDrumPattern(): Pattern {
  return EMPTY_PATTERN;
}

export function setDrumPattern(pattern: Pattern): void {
  currentPattern = pattern;
  listeners.forEach((listener) => listener());
}

export function subscribeDrumPattern(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 렌더링한 루프 끝에 더하는 잔향용 여유 시간(초). 크래시 등 긴 release를 잘리지 않게 한다. */
const LOOP_TAIL_SECONDS = 1.2;

/**
 * 현재 패턴을 주어진 BPM으로 오프라인 렌더링해 한 바퀴 분량의 AudioBuffer로 만든다.
 * 드럼 키트 신스를 오프라인 컨텍스트에서 새로 생성하므로 라이브 재생에는 영향이 없다.
 */
export async function renderDrumLoopToBuffer(pattern: Pattern, bpm: number): Promise<AudioBuffer> {
  const stepSeconds = 60 / bpm / 4;
  const loopSeconds = stepSeconds * STEP_COUNT;

  const rendered = await Tone.Offline(({ transport }) => {
    transport.bpm.value = bpm;
    const kit = createDrumKit();
    const sequence = new Tone.Sequence<number>(
      (time, step) => {
        for (const sound of DRUM_SOUNDS) {
          if (pattern[sound.id][step]) {
            kit.trigger(sound.id, time);
          }
        }
      },
      Array.from({ length: STEP_COUNT }, (_, step) => step),
      "16n",
    );
    sequence.start(0);
    transport.start();
  }, loopSeconds + LOOP_TAIL_SECONDS);

  const buffer = rendered.get();
  if (!buffer) {
    throw new Error("드럼 루프를 렌더링하지 못했습니다.");
  }
  return buffer;
}
