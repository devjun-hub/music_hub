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

// ── 원래 4종 ──────────────────────────────────────────────────────────────────

/** 에어혼: FatOscillator를 음 아래에서 목표음으로 빠르게 끌어올려 "뿜는" 어택을 만든다. */
function createAirhornPad(output: Tone.ToneAudioNode): FxPadVoice {
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB).connect(output);
  const envelope = new Tone.AmplitudeEnvelope({
    attack: 0.02, decay: 1.2, sustain: 0, release: 0.1,
  }).connect(volume);
  const osc = new Tone.FatOscillator({ type: "sawtooth", count: 3, spread: 20 }).connect(envelope);
  osc.start();
  const targetFreq = Tone.Frequency("C5").toFrequency();
  const startFreq = targetFreq * 0.85;
  return {
    trigger(time) {
      const t = time ?? Tone.now();
      osc.frequency.cancelScheduledValues(t);
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, t + 0.08);
      envelope.triggerAttackRelease(1.2, t);
    },
    dispose() { osc.dispose(); envelope.dispose(); volume.dispose(); },
  };
}

/** 사이렌: 톱니 오실레이터를 LFO로 흔들어 경광등 사이렌 사운드를 만든다. */
function createSirenPad(output: Tone.ToneAudioNode): FxPadVoice {
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB).connect(output);
  const envelope = new Tone.AmplitudeEnvelope({
    attack: 0.05, decay: 0.1, sustain: 1, release: 0.3,
  }).connect(volume);
  const osc = new Tone.Oscillator({ type: "sawtooth", frequency: 750 }).connect(envelope);
  const lfo = new Tone.LFO({ frequency: 5, min: 500, max: 1000 });
  lfo.connect(osc.frequency);
  osc.start(); lfo.start();
  return {
    trigger(time) { envelope.triggerAttackRelease(1.5, time ?? Tone.now()); },
    dispose() { lfo.dispose(); osc.dispose(); envelope.dispose(); volume.dispose(); },
  };
}

/** 라이저: 화이트 노이즈를 밴드패스로 통과시키며 컷오프를 끌어올려 빌드업 긴장감을 만든다. */
function createRiserPad(output: Tone.ToneAudioNode): FxPadVoice {
  const RISE_SECONDS = 2;
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB).connect(output);
  const envelope = new Tone.AmplitudeEnvelope({
    attack: 0.05, decay: RISE_SECONDS, sustain: 0, release: 0.3,
  }).connect(volume);
  const filter = new Tone.Filter({ type: "bandpass", frequency: 300, Q: 1 }).connect(envelope);
  const noise = new Tone.Noise("white").connect(filter);
  noise.start();
  return {
    trigger(time) {
      const t = time ?? Tone.now();
      filter.frequency.cancelScheduledValues(t);
      filter.frequency.setValueAtTime(300, t);
      filter.frequency.exponentialRampToValueAtTime(8000, t + RISE_SECONDS);
      envelope.triggerAttackRelease(RISE_SECONDS, t);
    },
    dispose() { noise.dispose(); filter.dispose(); envelope.dispose(); volume.dispose(); },
  };
}

/** 임팩트: 저음 MembraneSynth와 짧은 노이즈 버스트를 동시에 쳐서 "붐" 타격감을 만든다. */
function createImpactPad(output: Tone.ToneAudioNode): FxPadVoice {
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB).connect(output);
  const sub = new Tone.MembraneSynth({
    pitchDecay: 0.08, octaves: 4,
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
    dispose() { sub.dispose(); noise.dispose(); noiseFilter.dispose(); volume.dispose(); },
  };
}

// ── 신규 8종 ──────────────────────────────────────────────────────────────────

/**
 * 스핀백: 레코드를 손으로 잡아 되감는 사운드.
 * 밴드패스 컷오프를 고음에서 저음으로 빠르게 스윕하여 "쉬이잉" 감속 질감을 만든다.
 */
function createSpinbackPad(output: Tone.ToneAudioNode): FxPadVoice {
  const DUR = 1.4;
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB - 2).connect(output);
  const envelope = new Tone.AmplitudeEnvelope({
    attack: 0.001, decay: DUR, sustain: 0, release: 0.2,
  }).connect(volume);
  const filter = new Tone.Filter({ type: "bandpass", Q: 4, frequency: 3000 }).connect(envelope);
  const noise = new Tone.Noise("white").connect(filter);
  noise.start();
  return {
    trigger(time) {
      const t = time ?? Tone.now();
      filter.frequency.cancelScheduledValues(t);
      filter.frequency.setValueAtTime(4000, t);
      filter.frequency.exponentialRampToValueAtTime(80, t + DUR);
      envelope.triggerAttackRelease(DUR, t);
    },
    dispose() { noise.dispose(); filter.dispose(); envelope.dispose(); volume.dispose(); },
  };
}

/**
 * 역심벌(리버스 크래시): 일반 크래시의 진폭 반대 — 조용하게 시작해서 크게 끝난다.
 * 드롭 직전 2초 빌드업에 사용.
 */
function createReverseCymbalPad(output: Tone.ToneAudioNode): FxPadVoice {
  const DUR = 2.0;
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB - 3).connect(output);
  const envelope = new Tone.AmplitudeEnvelope({
    attack: DUR, decay: 0.05, sustain: 0, release: 0.15,
  }).connect(volume);
  const filter = new Tone.Filter({ type: "highpass", frequency: 5000 }).connect(envelope);
  const noise = new Tone.Noise("white").connect(filter);
  noise.start();
  return {
    trigger(time) {
      envelope.triggerAttackRelease(DUR + 0.05, time ?? Tone.now());
    },
    dispose() { noise.dispose(); filter.dispose(); envelope.dispose(); volume.dispose(); },
  };
}

/**
 * 스터터: 빠른 게이트 on/off 8회로 기관총 같은 스터터 효과.
 * 클럽에서 드롭 직전 또는 브레이크 강조에 사용.
 */
function createStutterPad(output: Tone.ToneAudioNode): FxPadVoice {
  const INTERVAL = 0.055;
  const DECAY = 0.04;
  const COUNT = 8;
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB - 1).connect(output);
  const filter = new Tone.Filter({ type: "bandpass", frequency: 1600, Q: 2 }).connect(volume);
  const gate = new Tone.AmplitudeEnvelope({
    attack: 0.001, decay: DECAY, sustain: 0, release: 0.001,
  }).connect(filter);
  const noise = new Tone.Noise("white").connect(gate);
  noise.start();
  return {
    trigger(time) {
      const t = time ?? Tone.now();
      for (let i = 0; i < COUNT; i++) {
        gate.triggerAttack(t + i * INTERVAL);
        gate.triggerRelease(t + i * INTERVAL + DECAY);
      }
    },
    dispose() { noise.dispose(); gate.dispose(); filter.dispose(); volume.dispose(); },
  };
}

/**
 * 베이스붐: 서브베이스 사인파가 빠르게 피치 다운하는 묵직한 "붐" 사운드.
 * EDM/하우스 드롭에 사용.
 */
function createBassRoarPad(output: Tone.ToneAudioNode): FxPadVoice {
  const DUR = 1.6;
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB - 3).connect(output);
  const envelope = new Tone.AmplitudeEnvelope({
    attack: 0.008, decay: DUR, sustain: 0, release: 0.4,
  }).connect(volume);
  const osc = new Tone.Oscillator({ type: "sine", frequency: 80 }).connect(envelope);
  osc.start();
  return {
    trigger(time) {
      const t = time ?? Tone.now();
      osc.frequency.cancelScheduledValues(t);
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + DUR);
      envelope.triggerAttackRelease(DUR, t);
    },
    dispose() { osc.dispose(); envelope.dispose(); volume.dispose(); },
  };
}

/**
 * 배경적(포그혼): 선박 경적처럼 낮고 묵직하며 LFO로 미세하게 흔들린다.
 * 대형 클럽 드롭 분위기 연출.
 */
function createFoghornPad(output: Tone.ToneAudioNode): FxPadVoice {
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB - 2).connect(output);
  const envelope = new Tone.AmplitudeEnvelope({
    attack: 0.25, decay: 0.3, sustain: 0.8, release: 0.8,
  }).connect(volume);
  const osc = new Tone.FatOscillator({
    type: "sawtooth", count: 3, spread: 12, frequency: 88,
  }).connect(envelope);
  const lfo = new Tone.LFO({ frequency: 0.4, min: 82, max: 94 });
  lfo.connect(osc.frequency);
  osc.start(); lfo.start();
  return {
    trigger(time) { envelope.triggerAttackRelease(2.8, time ?? Tone.now()); },
    dispose() { lfo.dispose(); osc.dispose(); envelope.dispose(); volume.dispose(); },
  };
}

/**
 * 스크래치: 밴드패스 컷오프를 앞→뒤로 두 번 스윕해 바이닐 스크래치 "wah-wah" 질감을 만든다.
 */
function createScratchPad(output: Tone.ToneAudioNode): FxPadVoice {
  const DUR = 0.22;
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB - 1).connect(output);
  const filter = new Tone.Filter({ type: "bandpass", Q: 7, frequency: 800 }).connect(volume);
  const synth = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: DUR * 2.2, sustain: 0 },
  }).connect(filter);
  return {
    trigger(time) {
      const t = time ?? Tone.now();
      filter.frequency.cancelScheduledValues(t);
      // 전진 스크래치
      filter.frequency.setValueAtTime(250, t);
      filter.frequency.linearRampToValueAtTime(3800, t + DUR * 0.5);
      filter.frequency.linearRampToValueAtTime(350, t + DUR);
      // 후진 스크래치
      filter.frequency.linearRampToValueAtTime(3200, t + DUR + DUR * 0.6);
      filter.frequency.linearRampToValueAtTime(300, t + DUR * 2.2);
      synth.triggerAttackRelease(DUR * 2.2, t);
    },
    dispose() { synth.dispose(); filter.dispose(); volume.dispose(); },
  };
}

/**
 * 레이저: 고음에서 저음으로 빠르게 피치 다운하는 SF 레이저/재핑 사운드.
 * EDM 드롭 직후 어택으로 사용.
 */
function createLaserPad(output: Tone.ToneAudioNode): FxPadVoice {
  const DUR = 0.55;
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB + 1).connect(output);
  const envelope = new Tone.AmplitudeEnvelope({
    attack: 0.001, decay: DUR, sustain: 0, release: 0.05,
  }).connect(volume);
  const osc = new Tone.Oscillator({ type: "sine", frequency: 3200 }).connect(envelope);
  osc.start();
  return {
    trigger(time) {
      const t = time ?? Tone.now();
      osc.frequency.cancelScheduledValues(t);
      osc.frequency.setValueAtTime(3500, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + DUR);
      envelope.triggerAttackRelease(DUR, t);
    },
    dispose() { osc.dispose(); envelope.dispose(); volume.dispose(); },
  };
}

/**
 * 폭발: 서브베이스 MembraneSynth + 필터 스윕 노이즈를 동시에 발음해 "폭탄" 타격감을 만든다.
 * 대형 드롭 또는 클라이맥스에 사용.
 */
function createExplosionPad(output: Tone.ToneAudioNode): FxPadVoice {
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB - 5).connect(output);
  const sub = new Tone.MembraneSynth({
    pitchDecay: 0.15, octaves: 5,
    envelope: { attack: 0.001, decay: 2.2, sustain: 0, release: 0.5 },
  }).connect(volume);
  const noiseEnv = new Tone.AmplitudeEnvelope({
    attack: 0.001, decay: 1.0, sustain: 0, release: 0.3,
  }).connect(volume);
  const noiseFilter = new Tone.Filter({ type: "lowpass", frequency: 4000 }).connect(noiseEnv);
  const noise = new Tone.Noise("white").connect(noiseFilter);
  noise.start();
  return {
    trigger(time) {
      const t = time ?? Tone.now();
      sub.triggerAttackRelease("C1", 2.2, t);
      noiseFilter.frequency.cancelScheduledValues(t);
      noiseFilter.frequency.setValueAtTime(5000, t);
      noiseFilter.frequency.exponentialRampToValueAtTime(150, t + 1.0);
      noiseEnv.triggerAttackRelease(1.0, t);
    },
    dispose() {
      sub.dispose();
      noise.dispose(); noiseEnv.dispose(); noiseFilter.dispose();
      volume.dispose();
    },
  };
}

// ── 추가 8종 ──────────────────────────────────────────────────────────────────

/**
 * 스네어롤: 16연타 스네어가 점점 커지며 드롭 빌드업을 만든다.
 * 진폭 크레센도 + 빠른 연타로 긴장감을 조성한다.
 */
function createSnareRollPad(output: Tone.ToneAudioNode): FxPadVoice {
  const COUNT = 16;
  const DUR = 1.8;
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB - 3).connect(output);
  const crescendo = new Tone.Gain(0.1).connect(volume);
  const filter = new Tone.Filter({ type: "bandpass", frequency: 1800, Q: 0.7 }).connect(crescendo);
  const synth = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.048, sustain: 0 },
  }).connect(filter);
  return {
    trigger(time) {
      const t = time ?? Tone.now();
      crescendo.gain.cancelScheduledValues(t);
      crescendo.gain.setValueAtTime(0.08, t);
      crescendo.gain.linearRampToValueAtTime(1, t + DUR);
      for (let i = 0; i < COUNT; i++) {
        synth.triggerAttackRelease(0.048, t + i * (DUR / COUNT));
      }
    },
    dispose() { synth.dispose(); filter.dispose(); crescendo.dispose(); volume.dispose(); },
  };
}

/**
 * 다운스윕: 라이저와 반대 방향 — 8 kHz에서 80 Hz로 빠르게 내려오는 노이즈 필터 스윕.
 * 드롭 직후 "아래로 꺼지는" 긴장 해소감에 사용한다.
 */
function createDownSweepPad(output: Tone.ToneAudioNode): FxPadVoice {
  const DUR = 1.2;
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB - 1).connect(output);
  const envelope = new Tone.AmplitudeEnvelope({
    attack: 0.05, decay: DUR, sustain: 0, release: 0.2,
  }).connect(volume);
  const filter = new Tone.Filter({ type: "bandpass", frequency: 8000, Q: 1 }).connect(envelope);
  const noise = new Tone.Noise("white").connect(filter);
  noise.start();
  return {
    trigger(time) {
      const t = time ?? Tone.now();
      filter.frequency.cancelScheduledValues(t);
      filter.frequency.setValueAtTime(8000, t);
      filter.frequency.exponentialRampToValueAtTime(80, t + DUR);
      envelope.triggerAttackRelease(DUR, t);
    },
    dispose() { noise.dispose(); filter.dispose(); envelope.dispose(); volume.dispose(); },
  };
}

/**
 * 워블: 로우패스 컷오프를 LFO로 빠르게 흔드는 더블스텝/트랩 베이스 워블.
 * 톱니 오실레이터 + 높은 Q 필터 + 4 Hz LFO로 클래식 "wub-wub" 질감을 만든다.
 */
function createWobblePad(output: Tone.ToneAudioNode): FxPadVoice {
  const DUR = 1.8;
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB - 3).connect(output);
  const envelope = new Tone.AmplitudeEnvelope({
    attack: 0.03, decay: DUR, sustain: 0, release: 0.3,
  }).connect(volume);
  const filter = new Tone.Filter({ type: "lowpass", frequency: 400, Q: 6 }).connect(envelope);
  const osc = new Tone.FatOscillator({ type: "sawtooth", count: 2, spread: 15, frequency: 55 }).connect(filter);
  const lfo = new Tone.LFO({ frequency: 4, min: 120, max: 2400 });
  lfo.connect(filter.frequency);
  osc.start(); lfo.start();
  return {
    trigger(time) {
      envelope.triggerAttackRelease(DUR, time ?? Tone.now());
    },
    dispose() { lfo.dispose(); osc.dispose(); filter.dispose(); envelope.dispose(); volume.dispose(); },
  };
}

/**
 * 클랩붐: 단일 초대형 스네어/클랩 임팩트.
 * 압축된 짧은 화이트 노이즈 버스트로 강조 포인트에 사용한다.
 */
function createClapBombPad(output: Tone.ToneAudioNode): FxPadVoice {
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB + 2).connect(output);
  const filter = new Tone.Filter({ type: "bandpass", frequency: 2200, Q: 0.5 }).connect(volume);
  const synth = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.1 },
  }).connect(filter);
  return {
    trigger(time) { synth.triggerAttackRelease(0.35, time ?? Tone.now()); },
    dispose() { synth.dispose(); filter.dispose(); volume.dispose(); },
  };
}

/**
 * 레이브혼: UK 클럽/카리브해 DJ 스타일 "woop woop" 반복 혼.
 * 사각파 오실레이터를 3연타로 쳐서 레이브 파티 분위기를 만든다.
 */
function createRaveHornPad(output: Tone.ToneAudioNode): FxPadVoice {
  const STABS = 3;
  const GAP = 0.18;
  const DECAY = 0.13;
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB - 1).connect(output);
  const envelope = new Tone.AmplitudeEnvelope({
    attack: 0.01, decay: DECAY, sustain: 0, release: 0.05,
  }).connect(volume);
  const osc = new Tone.Oscillator({ type: "square", frequency: 420 }).connect(envelope);
  osc.start();
  return {
    trigger(time) {
      const t = time ?? Tone.now();
      for (let i = 0; i < STABS; i++) {
        envelope.triggerAttack(t + i * GAP);
        envelope.triggerRelease(t + i * GAP + DECAY);
      }
    },
    dispose() { osc.dispose(); envelope.dispose(); volume.dispose(); },
  };
}

/**
 * 플랜저: 화이트 노이즈를 페이저에 통과시켜 제트기 울음 같은 "쉬이이" 전환 음색을 만든다.
 * 빌드업에서 드롭으로 넘어가는 순간의 공간감 연출에 사용한다.
 */
function createPhaserSweepPad(output: Tone.ToneAudioNode): FxPadVoice {
  const DUR = 2.0;
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB - 2).connect(output);
  const phaser = new Tone.Phaser({ frequency: 0.4, octaves: 10, baseFrequency: 200 }).connect(volume);
  const envelope = new Tone.AmplitudeEnvelope({
    attack: 0.15, decay: DUR - 0.15, sustain: 0, release: 0.4,
  }).connect(phaser);
  const noise = new Tone.Noise("white").connect(envelope);
  noise.start();
  return {
    trigger(time) {
      envelope.triggerAttackRelease(DUR, time ?? Tone.now());
    },
    dispose() { noise.dispose(); envelope.dispose(); phaser.dispose(); volume.dispose(); },
  };
}

/**
 * 리코셋: 만화 총알 바운싱 — 1800 Hz에서 350 Hz까지 6단계 피치 다운이 빠르게 반복된다.
 * 짧은 코믹 어택이나 브레이크 강조에 사용한다.
 */
function createRicochetPad(output: Tone.ToneAudioNode): FxPadVoice {
  const FREQS = [1800, 1300, 940, 680, 490, 350];
  const GAP = 0.09;
  const DECAY = 0.06;
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB).connect(output);
  const envelope = new Tone.AmplitudeEnvelope({
    attack: 0.001, decay: DECAY, sustain: 0, release: 0.01,
  }).connect(volume);
  const osc = new Tone.Oscillator({ type: "sine", frequency: FREQS[0] }).connect(envelope);
  osc.start();
  return {
    trigger(time) {
      const t = time ?? Tone.now();
      for (let i = 0; i < FREQS.length; i++) {
        const hitTime = t + i * GAP;
        osc.frequency.setValueAtTime(FREQS[i], hitTime);
        envelope.triggerAttack(hitTime);
        envelope.triggerRelease(hitTime + DECAY);
      }
    },
    dispose() { osc.dispose(); envelope.dispose(); volume.dispose(); },
  };
}

/**
 * 역킥: 역방향 서브킥 — 사인파가 조용하게 시작해 빠르게 부풀어 오른다.
 * 드롭 직전 0.5~1초 긴장 축적에 사용한다.
 */
function createReverseKickPad(output: Tone.ToneAudioNode): FxPadVoice {
  const DUR = 1.2;
  const volume = new Tone.Volume(FX_PAD_VOLUME_DB - 2).connect(output);
  const envelope = new Tone.AmplitudeEnvelope({
    attack: DUR - 0.05, decay: 0.05, sustain: 0, release: 0.1,
  }).connect(volume);
  const osc = new Tone.Oscillator({ type: "sine", frequency: 50 }).connect(envelope);
  osc.start();
  return {
    trigger(time) {
      const t = time ?? Tone.now();
      osc.frequency.cancelScheduledValues(t);
      osc.frequency.setValueAtTime(30, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + DUR);
      envelope.triggerAttackRelease(DUR, t);
    },
    dispose() { osc.dispose(); envelope.dispose(); volume.dispose(); },
  };
}

/**
 * 클럽 DJ FX 패드 20종.
 * destination(마스터 버스)에 직접 연결되어 크로스페이더 위치와 무관하게 들린다.
 */
export function createFxPadKit(destination: Tone.ToneAudioNode): FxPadKit {
  const pads: Record<DjFxPadId, FxPadVoice> = {
    // 원래 4종
    airhorn:       createAirhornPad(destination),
    siren:         createSirenPad(destination),
    riser:         createRiserPad(destination),
    impact:        createImpactPad(destination),
    // 신규 8종
    spinback:      createSpinbackPad(destination),
    reversecymbal: createReverseCymbalPad(destination),
    stutter:       createStutterPad(destination),
    bassroar:      createBassRoarPad(destination),
    foghorn:       createFoghornPad(destination),
    scratch:       createScratchPad(destination),
    laser:         createLaserPad(destination),
    explosion:     createExplosionPad(destination),
    // 추가 8종
    snareroll:     createSnareRollPad(destination),
    downsweep:     createDownSweepPad(destination),
    wobble:        createWobblePad(destination),
    clapbomb:      createClapBombPad(destination),
    ravehorn:      createRaveHornPad(destination),
    phasersweep:   createPhaserSweepPad(destination),
    ricochet:      createRicochetPad(destination),
    reversekick:   createReverseKickPad(destination),
  };

  return {
    trigger(id, time) { pads[id].trigger(time); },
    dispose() {
      for (const pad of Object.values(pads)) pad.dispose();
    },
  };
}
