import * as Tone from "tone";
import type { DjFxPadId } from "@/lib/constants";

/** FX 패드 보이스가 마스터 버스를 압도하지 않도록 적용하는 개별 출력 게인 */
const FX_PAD_VOLUME_DB = -8;

interface FxPadVoice {
  trigger(time?: number): void;
  dispose(): void;
}

export interface FxPadKit {
  trigger(id: DjFxPadId, time?: number): void;
  dispose(): void;
}

/** 에어혼: FatOscillator를 음 아래에서 목표음으로 빠르게 끌어올려 "뿜는" 어택을 만든다. */
function createAirhornPad(output: Tone.ToneAudioNode): FxPadVoice {
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB).connect(output);
  const envelope = new Tone.AmplitudeEnvelope({
    attack: 0.02,
    decay: 1.2,
    sustain: 0,
    release: 0.1,
  }).connect(volume);
  const osc = new Tone.FatOscillator({ type: "sawtooth", count: 3, spread: 20 }).connect(envelope);
  osc.start();

  const targetFrequency = Tone.Frequency("C5").toFrequency();
  const startFrequency = targetFrequency * 0.85;

  return {
    trigger(time) {
      const t = time ?? Tone.now();
      osc.frequency.cancelScheduledValues(t);
      osc.frequency.setValueAtTime(startFrequency, t);
      osc.frequency.exponentialRampToValueAtTime(targetFrequency, t + 0.08);
      envelope.triggerAttackRelease(1.2, t);
    },
    dispose() {
      osc.dispose();
      envelope.dispose();
      volume.dispose();
    },
  };
}

/** 사이렌: 톱니 오실레이터 주파수를 LFO로 흔들어 경광등 같은 사이렌 사운드를 만든다. */
function createSirenPad(output: Tone.ToneAudioNode): FxPadVoice {
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB).connect(output);
  const envelope = new Tone.AmplitudeEnvelope({
    attack: 0.05,
    decay: 0.1,
    sustain: 1,
    release: 0.3,
  }).connect(volume);
  const osc = new Tone.Oscillator({ type: "sawtooth", frequency: 750 }).connect(envelope);
  const lfo = new Tone.LFO({ frequency: 5, min: 500, max: 1000 });
  lfo.connect(osc.frequency);
  osc.start();
  lfo.start();

  return {
    trigger(time) {
      envelope.triggerAttackRelease(1.5, time ?? Tone.now());
    },
    dispose() {
      lfo.dispose();
      osc.dispose();
      envelope.dispose();
      volume.dispose();
    },
  };
}

/** 라이저: 화이트 노이즈를 밴드패스 필터로 통과시키며 컷오프를 끌어올려 빌드업 긴장감을 만든다. */
function createRiserPad(output: Tone.ToneAudioNode): FxPadVoice {
  const RISE_SECONDS = 2;
  const START_HZ = 300;
  const END_HZ = 8000;

  const volume = new Tone.Volume(FX_PAD_VOLUME_DB).connect(output);
  const envelope = new Tone.AmplitudeEnvelope({
    attack: 0.05,
    decay: RISE_SECONDS,
    sustain: 0,
    release: 0.3,
  }).connect(volume);
  const filter = new Tone.Filter({ type: "bandpass", frequency: START_HZ, Q: 1 }).connect(envelope);
  const noise = new Tone.Noise("white").connect(filter);
  noise.start();

  return {
    trigger(time) {
      const t = time ?? Tone.now();
      filter.frequency.cancelScheduledValues(t);
      filter.frequency.setValueAtTime(START_HZ, t);
      filter.frequency.exponentialRampToValueAtTime(END_HZ, t + RISE_SECONDS);
      envelope.triggerAttackRelease(RISE_SECONDS, t);
    },
    dispose() {
      noise.dispose();
      filter.dispose();
      envelope.dispose();
      volume.dispose();
    },
  };
}

/** 임팩트: 저음 MembraneSynth와 짧은 노이즈 버스트를 동시에 쳐서 "붐" 타격감을 만든다. */
function createImpactPad(output: Tone.ToneAudioNode): FxPadVoice {
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB).connect(output);
  const sub = new Tone.MembraneSynth({
    pitchDecay: 0.08,
    octaves: 4,
    envelope: { attack: 0.001, decay: 1.2, sustain: 0, release: 0.4 },
  }).connect(volume);
  const noiseFilter = new Tone.Filter(2000, "lowpass").connect(volume);
  const noise = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.15, sustain: 0 },
  }).connect(noiseFilter);

  return {
    trigger(time) {
      const t = time ?? Tone.now();
      sub.triggerAttackRelease("A0", 1.2, t);
      noise.triggerAttackRelease(0.15, t);
    },
    dispose() {
      sub.dispose();
      noise.dispose();
      noiseFilter.dispose();
      volume.dispose();
    },
  };
}

/**
 * 페스티벌 드롭 FX 패드 4종(에어혼/사이렌/라이저/임팩트)을 Tone.js 신스로 직접 합성한다.
 * destination(마스터 버스)에 직접 연결되어 크로스페이더 위치와 무관하게 들린다.
 */
export function createFxPadKit(destination: Tone.ToneAudioNode): FxPadKit {
  const pads: Record<DjFxPadId, FxPadVoice> = {
    airhorn: createAirhornPad(destination),
    siren: createSirenPad(destination),
    riser: createRiserPad(destination),
    impact: createImpactPad(destination),
  };

  return {
    trigger(id, time) {
      pads[id].trigger(time);
    },
    dispose() {
      for (const pad of Object.values(pads)) {
        pad.dispose();
      }
    },
  };
}
