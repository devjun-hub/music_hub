import * as Tone from "tone";
import type { DrumSoundId } from "@/lib/constants";

interface DrumVoice {
  trigger(time?: number): void;
  dispose(): void;
}

export interface DrumKit {
  trigger(id: DrumSoundId, time?: number): void;
  dispose(): void;
}

/** 여러 사운드가 동시에 울려도 클리핑되지 않도록 키트 출력 전체에 적용하는 게인 */
const KIT_OUTPUT_VOLUME_DB = -6;

type MembraneOptions = ConstructorParameters<typeof Tone.MembraneSynth>[0];
type NoiseOptions = ConstructorParameters<typeof Tone.NoiseSynth>[0];

function createMembraneVoice(
  output: Tone.ToneAudioNode,
  note: string,
  options: MembraneOptions = {},
): DrumVoice {
  const synth = new Tone.MembraneSynth(options).connect(output);
  return {
    trigger: (time) => {
      synth.triggerAttackRelease(note, "8n", time);
    },
    dispose: () => synth.dispose(),
  };
}

/** 화이트 노이즈 + 필터로 만드는 스네어/하이햇류 보이스 */
function createNoiseVoice(
  output: Tone.ToneAudioNode,
  filterFrequency: number,
  filterType: BiquadFilterType,
  decay: number,
  options: NoiseOptions = {},
): DrumVoice {
  const filter = new Tone.Filter(filterFrequency, filterType).connect(output);
  const synth = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay, sustain: 0 },
    ...options,
  }).connect(filter);
  return {
    trigger: (time) => {
      synth.triggerAttackRelease(decay, time);
    },
    dispose: () => {
      synth.dispose();
      filter.dispose();
    },
  };
}

/** MetalSynth로 만드는 크래시 심벌 보이스 */
function createCrashVoice(output: Tone.ToneAudioNode): DrumVoice {
  const synth = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 1, release: 0.3 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5,
  }).connect(output);
  synth.volume.value = -10;
  return {
    trigger: (time) => {
      synth.triggerAttackRelease("C4", 1, time);
    },
    dispose: () => synth.dispose(),
  };
}

/**
 * Tone.js 신디사이저만으로 구성한 8종 드럼 키트.
 * 외부 샘플 파일 없이 동작하며, 사운드별로 독립된 신스 인스턴스를 가진다.
 */
export function createDrumKit(): DrumKit {
  const output = new Tone.Volume(KIT_OUTPUT_VOLUME_DB).toDestination();

  const voices: Record<DrumSoundId, DrumVoice> = {
    kick: createMembraneVoice(output, "C1", {
      pitchDecay: 0.05,
      octaves: 6,
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 1.2 },
    }),
    snare: createNoiseVoice(output, 1200, "highpass", 0.18),
    hihatClosed: createNoiseVoice(output, 8000, "highpass", 0.05),
    hihatOpen: createNoiseVoice(output, 7000, "highpass", 0.35),
    tomLow: createMembraneVoice(output, "G2", {
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.8 },
    }),
    tomMid: createMembraneVoice(output, "C3", {
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.6 },
    }),
    tomHigh: createMembraneVoice(output, "E3", {
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.5 },
    }),
    crash: createCrashVoice(output),
  };

  return {
    trigger(id, time) {
      voices[id].trigger(time);
    },
    dispose() {
      for (const voice of Object.values(voices)) {
        voice.dispose();
      }
      output.dispose();
    },
  };
}
