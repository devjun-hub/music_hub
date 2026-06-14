import Pitchfinder from "pitchfinder";
import { AUTOTUNE_SCALES, type AutotuneScaleId } from "@/lib/constants";

export type PitchDetector = (buffer: Float32Array) => number | null;

/** YIN 알고리즘 기반 피치 감지기를 생성한다. */
export function createPitchDetector(sampleRate: number): PitchDetector {
  return Pitchfinder.YIN({ sampleRate });
}

/**
 * 감지된 주파수(Hz)를 선택한 스케일(루트 C 고정, v1)에서 가장 가까운 음으로
 * 보정하기 위한 semitone 차이를 계산한다.
 * 결과값을 Tone.PitchShift.pitch에 그대로 적용하면 가장 가까운 스케일 음으로 스냅된다.
 */
export function calculatePitchCorrection(frequency: number, scaleId: AutotuneScaleId): number {
  const scale = AUTOTUNE_SCALES.find((candidate) => candidate.id === scaleId) ?? AUTOTUNE_SCALES[0];

  const midi = 69 + 12 * Math.log2(frequency / 440);
  const roundedMidi = Math.round(midi);
  const fraction = midi - roundedMidi;
  const pitchClass = ((roundedMidi % 12) + 12) % 12;

  let correction = 0;
  let minDistance = Infinity;
  for (const target of scale.pitchClasses) {
    for (const octaveOffset of [-12, 0, 12]) {
      const diff = target + octaveOffset - pitchClass;
      const distance = Math.abs(diff);
      if (distance < minDistance) {
        minDistance = distance;
        correction = diff;
      }
    }
  }

  return correction - fraction;
}
