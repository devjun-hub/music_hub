import * as Tone from "tone";
import type { DrumSoundId } from "@/lib/constants";

interface DrumVoice {
  trigger(time?: number): void;
  /** baseVolume(생성 시 볼륨) 기준 dB 오프셋을 적용한다. */
  setVolume(offsetDb: number): void;
  /** 반음(semitone) 단위 피치 보정을 적용한다. */
  setTune(semitones: number): void;
  dispose(): void;
}

export interface DrumKit {
  trigger(id: DrumSoundId, time?: number): void;
  setSoundVolume(id: DrumSoundId, offsetDb: number): void;
  setSoundTune(id: DrumSoundId, semitones: number): void;
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
  const baseVolume = synth.volume.value;
  let tune = 0;
  return {
    trigger: (time) => {
      const frequency = tune === 0 ? note : Tone.Frequency(note).transpose(tune).toFrequency();
      synth.triggerAttackRelease(frequency, "8n", time);
    },
    setVolume: (offsetDb) => {
      synth.volume.value = baseVolume + offsetDb;
    },
    setTune: (semitones) => {
      tune = semitones;
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
  const baseVolume = synth.volume.value;
  return {
    trigger: (time) => {
      synth.triggerAttackRelease(decay, time);
    },
    setVolume: (offsetDb) => {
      synth.volume.value = baseVolume + offsetDb;
    },
    // 노이즈는 고유 음높이가 없으므로, 필터 컷오프를 옮겨 톤을 "튠"의 대용으로 삼는다.
    setTune: (semitones) => {
      filter.frequency.value = filterFrequency * Math.pow(2, semitones / 12);
    },
    dispose: () => {
      synth.dispose();
      filter.dispose();
    },
  };
}

/** MetalSynth로 만드는 크래시/라이드/카우벨류 심벌 보이스 */
function createMetalVoice(
  output: Tone.ToneAudioNode,
  note: string,
  duration: number,
  options: ConstructorParameters<typeof Tone.MetalSynth>[0] = {},
  volumeDb = -10,
): DrumVoice {
  const synth = new Tone.MetalSynth(options).connect(output);
  synth.volume.value = volumeDb;
  const baseVolume = synth.volume.value;
  let tune = 0;
  return {
    trigger: (time) => {
      const frequency = tune === 0 ? note : Tone.Frequency(note).transpose(tune).toFrequency();
      synth.triggerAttackRelease(frequency, duration, time);
    },
    setVolume: (offsetDb) => {
      synth.volume.value = baseVolume + offsetDb;
    },
    setTune: (semitones) => {
      tune = semitones;
    },
    dispose: () => synth.dispose(),
  };
}

/** 클랩: 두 개의 NoiseSynth를 미세하게 시차를 두고 발음해 "손뼉" 두께를 만든다. */
function createClapVoice(output: Tone.ToneAudioNode): DrumVoice {
  const filter1 = new Tone.Filter(2000, "bandpass").connect(output);
  const filter2 = new Tone.Filter(3200, "bandpass").connect(output);
  const synth1 = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.09, sustain: 0 },
  }).connect(filter1);
  const synth2 = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.005, decay: 0.13, sustain: 0 },
  }).connect(filter2);
  synth1.volume.value = -4;
  synth2.volume.value = -7;
  const base1 = synth1.volume.value;
  const base2 = synth2.volume.value;
  return {
    trigger: (time) => {
      synth1.triggerAttackRelease(0.09, time);
      const t2 = time !== undefined ? time + 0.006 : undefined;
      synth2.triggerAttackRelease(0.13, t2);
    },
    setVolume: (offsetDb) => {
      synth1.volume.value = base1 + offsetDb;
      synth2.volume.value = base2 + offsetDb;
    },
    setTune: (semitones) => {
      filter1.frequency.value = 2000 * Math.pow(2, semitones / 12);
      filter2.frequency.value = 3200 * Math.pow(2, semitones / 12);
    },
    dispose: () => {
      synth1.dispose(); filter1.dispose();
      synth2.dispose(); filter2.dispose();
    },
  };
}

function createSynthVoice(
  output: Tone.ToneAudioNode,
  note: string,
  type: "sawtooth" | "square" | "sine" | "triangle" = "sawtooth",
  decay = 0.15,
  volumeDb = -10,
): DrumVoice {
  const synth = new Tone.Synth({
    oscillator: { type },
    envelope: { attack: 0.002, decay, sustain: 0, release: 0.2 },
  }).connect(output);
  synth.volume.value = volumeDb;
  const baseVolume = synth.volume.value;
  let tune = 0;
  return {
    trigger: (time) => {
      const frequency = tune === 0 ? note : Tone.Frequency(note).transpose(tune).toFrequency();
      synth.triggerAttackRelease(frequency, decay, time);
    },
    setVolume: (offsetDb) => {
      synth.volume.value = baseVolume + offsetDb;
    },
    setTune: (semitones) => {
      tune = semitones;
    },
    dispose: () => synth.dispose(),
  };
}

function createBassDropVoice(output: Tone.ToneAudioNode): DrumVoice {
  const osc = new Tone.Oscillator("C2", "sine").connect(output);
  const env = new Tone.AmplitudeEnvelope({ attack: 0.01, decay: 1.2, sustain: 0, release: 1.0 }).connect(output);
  osc.disconnect();
  osc.connect(env);
  osc.start();
  osc.volume.value = -3;
  const baseVolume = osc.volume.value;
  return {
    trigger: (time) => {
      const now = time ?? Tone.now();
      osc.frequency.setValueAtTime(65.4, now); // C2
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.8);
      env.triggerAttackRelease(1.2, time);
    },
    setVolume: (offsetDb) => {
      osc.volume.value = baseVolume + offsetDb;
    },
    setTune: () => {},
    dispose: () => {
      osc.dispose();
      env.dispose();
    },
  };
}

function createLaserVoice(output: Tone.ToneAudioNode): DrumVoice {
  const osc = new Tone.Oscillator("C5", "triangle").connect(output);
  const env = new Tone.AmplitudeEnvelope({ attack: 0.001, decay: 0.3, sustain: 0, release: 0.3 }).connect(output);
  osc.disconnect();
  osc.connect(env);
  osc.start();
  osc.volume.value = -6;
  const baseVolume = osc.volume.value;
  return {
    trigger: (time) => {
      const now = time ?? Tone.now();
      osc.frequency.setValueAtTime(1000, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);
      env.triggerAttackRelease(0.3, time);
    },
    setVolume: (offsetDb) => {
      osc.volume.value = baseVolume + offsetDb;
    },
    setTune: () => {},
    dispose: () => {
      osc.dispose();
      env.dispose();
    },
  };
}

function createUplifterVoice(output: Tone.ToneAudioNode): DrumVoice {
  const filter = new Tone.Filter(200, "bandpass").connect(output);
  const noise = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 1.5, decay: 0.5, sustain: 0.8, release: 1.0 },
  }).connect(filter);
  noise.volume.value = -12;
  const baseVolume = noise.volume.value;
  return {
    trigger: (time) => {
      const now = time ?? Tone.now();
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(6000, now + 2.0);
      noise.triggerAttackRelease(2.0, time);
    },
    setVolume: (offsetDb) => {
      noise.volume.value = baseVolume + offsetDb;
    },
    setTune: () => {},
    dispose: () => {
      noise.dispose();
      filter.dispose();
    },
  };
}

function createDownlifterVoice(output: Tone.ToneAudioNode): DrumVoice {
  const filter = new Tone.Filter(6000, "bandpass").connect(output);
  const noise = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.01, decay: 2.0, sustain: 0 },
  }).connect(filter);
  noise.volume.value = -12;
  const baseVolume = noise.volume.value;
  return {
    trigger: (time) => {
      const now = time ?? Tone.now();
      filter.frequency.setValueAtTime(6000, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 1.8);
      noise.triggerAttackRelease(2.0, time);
    },
    setVolume: (offsetDb) => {
      noise.volume.value = baseVolume + offsetDb;
    },
    setTune: () => {},
    dispose: () => {
      noise.dispose();
      filter.dispose();
    },
  };
}

/**
 * Tone.js 신디사이저만으로 구성한 16종 드럼 키트 (MPC 스타일 4×4).
 * 외부 샘플 파일 없이 동작하며, 사운드별로 독립된 신스 인스턴스를 가진다.
 * destination을 주면 그 노드로 출력을 연결하고(예: 녹음용 믹스 버스), 없으면 마스터 출력에 연결한다.
 */
export function createDrumKit(destination?: Tone.ToneAudioNode): DrumKit {
  const output = new Tone.Volume(KIT_OUTPUT_VOLUME_DB);
  if (destination) {
    output.connect(destination);
  } else {
    output.toDestination();
  }

  const voices: Record<DrumSoundId, DrumVoice> = {
    // ── 원래 8개 ──────────────────────────────────────────────────────
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
    crash: createMetalVoice(output, "C4", 1, {
      envelope: { attack: 0.001, decay: 1, release: 0.3 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }),

    // ── 신규 8개 (MPC 확장) ───────────────────────────────────────────
    ride: createMetalVoice(output, "G4", 1.5, {
      envelope: { attack: 0.001, decay: 1.5, release: 0.5 },
      harmonicity: 5.1,
      modulationIndex: 16,
      resonance: 4500,
      octaves: 1.5,
    }, -12),

    clap: createClapVoice(output),

    rimshot: createNoiseVoice(output, 3000, "bandpass", 0.06, {
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.06, sustain: 0 },
    }),

    cowbell: createMetalVoice(output, "G3", 0.5, {
      envelope: { attack: 0.001, decay: 0.5, release: 0.3 },
      harmonicity: 5.1,
      modulationIndex: 128,
      resonance: 562,
      octaves: 0.5,
    }, -14),

    shaker: (() => {
      const filter = new Tone.Filter(9000, "highpass").connect(output);
      const synth = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.001, decay: 0.025, sustain: 0 },
      }).connect(filter);
      synth.volume.value = -6;
      const base = synth.volume.value;
      return {
        trigger: (time) => synth.triggerAttackRelease(0.025, time),
        setVolume: (offsetDb) => { synth.volume.value = base + offsetDb; },
        setTune: (semitones) => { filter.frequency.value = 9000 * Math.pow(2, semitones / 12); },
        dispose: () => { synth.dispose(); filter.dispose(); },
      };
    })(),

    conga: createMembraneVoice(output, "A3", {
      pitchDecay: 0.04,
      octaves: 5,
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.4 },
    }),

    bongo: createMembraneVoice(output, "C4", {
      pitchDecay: 0.03,
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.3 },
    }),

    perc: createNoiseVoice(output, 700, "bandpass", 0.05, {
      noise: { type: "pink" },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
    }),

    // ── EDM 확장 16종 (패드 뱅크 B) ───────────────────────────────────
    kickEdm: createMembraneVoice(output, "B0", {
      pitchDecay: 0.08,
      octaves: 8,
      envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.8 },
    }),
    snareEdm: createNoiseVoice(output, 1000, "highpass", 0.22, {
      noise: { type: "white" },
      envelope: { attack: 0.002, decay: 0.22, sustain: 0 },
    }),
    clapEdm: createClapVoice(output),
    crashEdm: createMetalVoice(output, "F#4", 2.2, {
      envelope: { attack: 0.05, decay: 2.2, release: 0.5 },
      harmonicity: 6.2,
      modulationIndex: 64,
      resonance: 5000,
      octaves: 2,
    }, -8),
    synthPluck: createSynthVoice(output, "C4", "sawtooth", 0.15, -10),
    synthLead: createSynthVoice(output, "G4", "square", 0.2, -12),
    bassDrop: createBassDropVoice(output),
    fxLaser: createLaserVoice(output),
    fxUplifter: createUplifterVoice(output),
    fxDownlifter: createDownlifterVoice(output),
    vocalHey: createSynthVoice(output, "A3", "square", 0.12, -8),
    vocalGo: createSynthVoice(output, "F3", "square", 0.18, -10),
    rimEdm: createNoiseVoice(output, 2400, "bandpass", 0.04, {
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.04, sustain: 0 },
    }),
    congaHigh: createMembraneVoice(output, "D4", {
      pitchDecay: 0.03,
      octaves: 5,
      envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.35 },
    }),
    cowbellEdm: createMetalVoice(output, "C4", 0.4, {
      envelope: { attack: 0.001, decay: 0.4, release: 0.2 },
      harmonicity: 4.8,
      modulationIndex: 96,
      resonance: 800,
      octaves: 0.4,
    }, -12),
    fxScream: createSynthVoice(output, "E4", "sawtooth", 0.25, -12),
  };

  return {
    trigger(id, time) {
      voices[id].trigger(time);
    },
    setSoundVolume(id, offsetDb) {
      voices[id].setVolume(offsetDb);
    },
    setSoundTune(id, semitones) {
      voices[id].setTune(semitones);
    },
    dispose() {
      for (const voice of Object.values(voices)) {
        voice.dispose();
      }
      output.dispose();
    },
  };
}
