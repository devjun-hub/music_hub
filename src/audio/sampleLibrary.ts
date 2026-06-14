import * as Tone from "tone";
import { SAMPLE_LIBRARY, type SampleId } from "@/lib/constants";
import { createDrumKit } from "./drumKit";

/** 렌더링한 루프 끝에 더하는 잔향용 여유 시간(초). release 테일이 잘리지 않게 한다. */
const LOOP_TAIL_SECONDS = 1.2;

function barsToSeconds(bpm: number, bars: number): number {
  return ((60 / bpm) * 4) * bars;
}

/** Lo-fi 코드 루프: PolySynth + 로우패스 필터로 따뜻한 패드 코드 진행을 연주한다. */
async function renderLofiChords(bpm: number, bars: number): Promise<AudioBuffer> {
  const barSeconds = barsToSeconds(bpm, 1);
  const totalSeconds = barSeconds * bars;

  const rendered = await Tone.Offline(({ transport }) => {
    transport.bpm.value = bpm;

    const filter = new Tone.Filter(1200, "lowpass").toDestination();
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.4, decay: 0.3, sustain: 0.6, release: 1.5 },
    }).connect(filter);
    synth.volume.value = -8;

    const progression: string[][] = [
      ["A3", "C4", "E4", "G4"],
      ["F3", "A3", "C4", "E4"],
      ["C4", "E4", "G4", "B4"],
      ["G3", "B3", "D4", "F4"],
    ];

    for (let bar = 0; bar < bars; bar++) {
      const chord = progression[bar % progression.length];
      transport.schedule((time) => {
        synth.triggerAttackRelease(chord, barSeconds * 0.95, time);
      }, bar * barSeconds);
    }

    transport.start();
  }, totalSeconds + LOOP_TAIL_SECONDS);

  const buffer = rendered.get();
  if (!buffer) throw new Error("샘플을 렌더링하지 못했습니다.");
  return buffer;
}

/** 신스 아르페지오: 톱니파 신스 + 딜레이로 16비트 아르페지오 패턴을 연주한다. */
async function renderSynthArp(bpm: number, bars: number): Promise<AudioBuffer> {
  const totalSeconds = barsToSeconds(bpm, bars);

  const rendered = await Tone.Offline(({ transport }) => {
    transport.bpm.value = bpm;

    const delay = new Tone.FeedbackDelay({
      delayTime: (60 / bpm) / 2,
      feedback: 0.25,
      wet: 0.25,
    }).toDestination();
    const synth = new Tone.Synth({
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.005, decay: 0.15, sustain: 0.1, release: 0.2 },
    }).connect(delay);
    synth.volume.value = -10;

    const pattern = ["A3", "C4", "E4", "A4", "C5", "A4", "E4", "C4"];
    const steps = Array.from({ length: 16 * bars }, (_, i) => pattern[i % pattern.length]);

    const sequence = new Tone.Sequence<string>(
      (time, note) => {
        synth.triggerAttackRelease(note, "16n", time);
      },
      steps,
      "16n",
    );
    sequence.start(0);
    transport.start();
  }, totalSeconds + LOOP_TAIL_SECONDS);

  const buffer = rendered.get();
  if (!buffer) throw new Error("샘플을 렌더링하지 못했습니다.");
  return buffer;
}

/** 베이스 그루브: 신스 베이스(싱코페이션 패턴) + 드럼 키트 킥을 함께 연주한다. */
async function renderBassGroove(bpm: number, bars: number): Promise<AudioBuffer> {
  const totalSeconds = barsToSeconds(bpm, bars);

  const rendered = await Tone.Offline(({ transport }) => {
    transport.bpm.value = bpm;

    const bass = new Tone.MonoSynth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.3 },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.5,
        release: 0.3,
        baseFrequency: 200,
        octaves: 2,
      },
    }).toDestination();
    bass.volume.value = -4;

    const kit = createDrumKit();

    const bassSteps = new Set([0, 3, 6, 8, 11, 14]);
    const kickSteps = new Set([0, 8]);

    const sequence = new Tone.Sequence<number>(
      (time, step) => {
        const local = step % 16;
        if (bassSteps.has(local)) {
          bass.triggerAttackRelease(local === 8 ? "C3" : "C2", "8n", time);
        }
        if (kickSteps.has(local)) {
          kit.trigger("kick", time);
        }
      },
      Array.from({ length: 16 * bars }, (_, i) => i),
      "16n",
    );
    sequence.start(0);
    transport.start();
  }, totalSeconds + LOOP_TAIL_SECONDS);

  const buffer = rendered.get();
  if (!buffer) throw new Error("샘플을 렌더링하지 못했습니다.");
  return buffer;
}

const RENDERERS: Record<SampleId, (bpm: number, bars: number) => Promise<AudioBuffer>> = {
  lofiChords: renderLofiChords,
  synthArp: renderSynthArp,
  bassGroove: renderBassGroove,
};

/** 내장 무료 샘플 라이브러리에서 id에 해당하는 루프를 오프라인 렌더링한다. */
export async function renderSample(id: SampleId): Promise<AudioBuffer> {
  const definition = SAMPLE_LIBRARY.find((sample) => sample.id === id);
  if (!definition) throw new Error(`알 수 없는 샘플: ${id}`);
  return RENDERERS[id](definition.bpm, definition.bars);
}
