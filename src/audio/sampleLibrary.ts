import * as Tone from "tone";
import { SAMPLE_LIBRARY, type SampleId } from "@/lib/constants";
import { createDrumKit } from "./drumKit";

/** 렌더링한 루프 끝에 더하는 잔향용 여유 시간(초). release 테일이 잘리지 않게 한다. */
const LOOP_TAIL_SECONDS = 1.2;

function barsToSeconds(bpm: number, bars: number): number {
  return ((60 / bpm) * 4) * bars;
}

/** EDM Festival Anthem: 웅장한 코드 패드, 하이햇 빌드업, 화려한 EDM 리드 아르페지오 및 보컬 챈트 */
async function renderEdmAnthem(bpm: number, bars: number): Promise<AudioBuffer> {
  const barSeconds = barsToSeconds(bpm, 1);
  const totalSeconds = barSeconds * bars;
  const sectionBars = Math.floor(bars / 4); // 16마디씩 4구간
  const introEnd = sectionBars * barSeconds;
  const buildEnd = sectionBars * 2 * barSeconds;
  const mainEnd = sectionBars * 3 * barSeconds;

  const rendered = await Tone.Offline(({ transport }) => {
    transport.bpm.value = bpm;

    const padFilter = new Tone.Filter(300, "lowpass").toDestination();
    const pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.5, decay: 0.2, sustain: 0.7, release: 1.2 },
    }).connect(padFilter);
    pad.volume.value = -12;

    const bass = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.05, decay: 0.5, sustain: 0.6, release: 0.8 }
    }).toDestination();
    bass.volume.value = -4;

    const leadDelay = new Tone.FeedbackDelay({
      delayTime: (60 / bpm) / 2,
      feedback: 0.3,
      wet: 0.25,
    }).toDestination();
    const lead = new Tone.Synth({
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.005, decay: 0.15, sustain: 0.2, release: 0.3 }
    }).connect(leadDelay);
    lead.volume.value = -12;

    const kit = createDrumKit();

    const chords = [
      ["A3", "C4", "E4", "G4"],
      ["F3", "A3", "C4", "E4"],
      ["C4", "E4", "G4", "B4"],
      ["G3", "B3", "D4", "F4"],
    ];

    // Pads
    for (let bar = 0; bar < bars; bar++) {
      const chord = chords[bar % chords.length];
      transport.schedule((time) => {
        pad.triggerAttackRelease(chord, barSeconds * 0.95, time);
      }, bar * barSeconds);
    }

    // Filter sweeps
    transport.schedule((time) => {
      padFilter.frequency.setValueAtTime(300, time);
      padFilter.frequency.linearRampTo(3000, introEnd, time);
    }, 0);
    transport.schedule((time) => {
      padFilter.frequency.linearRampTo(8000, buildEnd - introEnd, time);
    }, introEnd);
    transport.schedule((time) => {
      padFilter.frequency.linearRampTo(300, totalSeconds - mainEnd, time);
    }, mainEnd);

    const sequence = new Tone.Sequence<number>(
      (time, step) => {
        const bar = Math.floor(step / 16);
        const local = step % 16;
        const isOffbeat = local === 2 || local === 6 || local === 10 || local === 14;
        const note = chords[bar % chords.length][0];
        const bassNote = Tone.Frequency(note).transpose(-12).toNote();

        if (bar < sectionBars) {
          // 인트로: 가벼운 하이햇 비트
          if (isOffbeat) kit.trigger("hihatClosed", time);
        } else if (bar < sectionBars * 2) {
          // 빌드업: EDM 정박 킥 + 스네어 롤 고조
          const kickTrigger = local % 4 === 0;
          if (kickTrigger) kit.trigger("kickEdm", time);
          if (isOffbeat) kit.trigger("hihatClosed", time);

          if (bar >= sectionBars * 2 - 4) {
            const snareTrigger = bar === sectionBars * 2 - 1 ? (local % 2 === 0) : (local === 8 || local === 12);
            if (snareTrigger) kit.trigger("snareEdm", time);
          }
        } else if (bar < sectionBars * 3) {
          // 메인 드랍: 풀 파워 EDM 비트
          if (local === 0 && bar === sectionBars * 2) kit.trigger("crashEdm", time);

          if (local === 0 || local === 8) {
            kit.trigger("kickEdm", time);
            bass.triggerAttackRelease(bassNote, "4n", time);
          }
          if (local === 4 || local === 12) kit.trigger("clapEdm", time);
          if (isOffbeat) kit.trigger("hihatClosed", time);

          // 테크노 아르페지오 신스
          const leadPattern = ["A4", "C5", "E5", "A5", "E5", "C5", "G4", "B4"];
          lead.triggerAttackRelease(leadPattern[step % leadPattern.length], "16n", time);

          // 보컬 HEY 찬트
          if (local === 3 || local === 11) kit.trigger("vocalHey", time);
        } else {
          // 아웃트로
          if (local === 0) {
            kit.trigger("kickEdm", time);
            bass.triggerAttackRelease(bassNote, "4n", time);
          }
          if (isOffbeat) kit.trigger("hihatClosed", time);
        }
      },
      Array.from({ length: 16 * bars }, (_, i) => i),
      "16n",
    );
    sequence.start(0);
    transport.start();
  }, totalSeconds + LOOP_TAIL_SECONDS);

  const buffer = rendered.get();
  if (!buffer) throw new Error("EDM Anthem 렌더링 실패");
  return buffer;
}

/** Melodic Future Bass: 감성적인 코드 진행, 격렬한 스네어 빌드업, 거대한 LFO 코드 & 서브 베이스 드랍 */
async function renderFutureBass(bpm: number, bars: number): Promise<AudioBuffer> {
  const barSeconds = barsToSeconds(bpm, 1);
  const totalSeconds = barSeconds * bars;
  const sectionBars = Math.floor(bars / 4);
  const introEnd = sectionBars * barSeconds;
  const buildEnd = sectionBars * 2 * barSeconds;
  const mainEnd = sectionBars * 3 * barSeconds;

  const rendered = await Tone.Offline(({ transport }) => {
    transport.bpm.value = bpm;

    const sawFilter = new Tone.Filter(800, "lowpass").toDestination();
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sawtooth8" }, // 슈퍼소우
      envelope: { attack: 0.1, decay: 0.3, sustain: 0.7, release: 0.8 },
    }).connect(sawFilter);
    synth.volume.value = -12;

    const bass = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.05, decay: 0.8, sustain: 0, release: 1.0 }
    }).toDestination();
    bass.volume.value = -2;

    const kit = createDrumKit();

    const chords = [
      ["F3", "A3", "C4", "E4"],
      ["G3", "B3", "D4", "F4"],
      ["E3", "G3", "B3", "D4"],
      ["A3", "C4", "E4", "G4"],
    ];

    // Chords
    for (let bar = 0; bar < bars; bar++) {
      const chord = chords[bar % chords.length];
      transport.schedule((time) => {
        synth.triggerAttackRelease(chord, barSeconds * 0.9, time);
      }, bar * barSeconds);
    }

    // Filter sweeps
    transport.schedule((time) => {
      sawFilter.frequency.setValueAtTime(500, time);
      sawFilter.frequency.linearRampTo(2000, buildEnd, time);
    }, 0);
    transport.schedule((time) => {
      sawFilter.frequency.setValueAtTime(8000, time);
    }, buildEnd);

    const sequence = new Tone.Sequence<number>(
      (time, step) => {
        const bar = Math.floor(step / 16);
        const local = step % 16;
        const note = chords[bar % chords.length][0];
        const bassNote = Tone.Frequency(note).transpose(-12).toNote();

        if (bar < sectionBars) {
          // 인트로: 아름다운 코드 패드 진행
        } else if (bar < sectionBars * 2) {
          // 빌드업: 스네어 빌드업 롤
          if (local === 8 || local === 12) kit.trigger("snareEdm", time);
          if (bar >= sectionBars * 2 - 2 && local % 2 === 0) kit.trigger("snareEdm", time);
        } else if (bar < sectionBars * 3) {
          // 메인 드랍: 미래형 하프타임 비트
          if (local === 0 || local === 10 || local === 14) {
            kit.trigger("kickEdm", time);
            bass.triggerAttackRelease(bassNote, "2n", time);
          }
          if (local === 4 || local === 12) {
            kit.trigger("clapEdm", time);
          }
          if (local === 2 || local === 6 || local === 10) {
            kit.trigger("hihatOpen", time);
          }
          if (local === 15) kit.trigger("fxLaser", time);
        } else {
          // 아웃트로
          if (local === 0) {
            kit.trigger("kickEdm", time);
            bass.triggerAttackRelease(bassNote, "2n", time);
          }
          if (local === 4 || local === 12) kit.trigger("clapEdm", time);
        }
      },
      Array.from({ length: 16 * bars }, (_, i) => i),
      "16n",
    );
    sequence.start(0);
    transport.start();
  }, totalSeconds + LOOP_TAIL_SECONDS);

  const buffer = rendered.get();
  if (!buffer) throw new Error("Future Bass 렌더링 실패");
  return buffer;
}

/** Electro House: 강렬한 일렉트로 하우스 킥 비트, 테크노 리드 스탭, 레이저 폭발 */
async function renderElectroHouse(bpm: number, bars: number): Promise<AudioBuffer> {
  const barSeconds = barsToSeconds(bpm, 1);
  const totalSeconds = barSeconds * bars;
  const sectionBars = Math.floor(bars / 4);
  const introEnd = sectionBars * barSeconds;
  const buildEnd = sectionBars * 2 * barSeconds;
  const mainEnd = sectionBars * 3 * barSeconds;

  const rendered = await Tone.Offline(({ transport }) => {
    transport.bpm.value = bpm;

    const bass = new Tone.Synth({
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.2 }
    }).toDestination();
    bass.volume.value = -8;

    const leadDelay = new Tone.FeedbackDelay({
      delayTime: (60 / bpm) / 4,
      feedback: 0.2,
      wet: 0.15,
    }).toDestination();
    const lead = new Tone.Synth({
      oscillator: { type: "square8" }, // 두꺼운 스퀘어 리드
      envelope: { attack: 0.005, decay: 0.18, sustain: 0, release: 0.2 }
    }).connect(leadDelay);
    lead.volume.value = -12;

    const kit = createDrumKit();

    const sequence = new Tone.Sequence<number>(
      (time, step) => {
        const bar = Math.floor(step / 16);
        const local = step % 16;
        const isOffbeat = local === 2 || local === 6 || local === 10 || local === 14;

        if (bar < sectionBars) {
          // 인트로
          if (local % 4 === 0) kit.trigger("kickEdm", time);
          if (isOffbeat) kit.trigger("hihatClosed", time);
          if (local === 6 || local === 14) kit.trigger("rimEdm", time);
        } else if (bar < sectionBars * 2) {
          // 빌드업
          if (local === 0 && bar === sectionBars) kit.trigger("fxDownlifter", time);
          if (local % 4 === 0) kit.trigger("kickEdm", time);
          if (local === 8 || local === 12 || local === 14) kit.trigger("snareEdm", time);
          if (bar >= sectionBars * 2 - 2 && local % 2 === 0) kit.trigger("snareEdm", time);
        } else if (bar < sectionBars * 3) {
          // 피크 메인 드랍
          if (local === 0 && bar === sectionBars * 2) kit.trigger("crashEdm", time);
          
          if (local % 4 === 0) {
            kit.trigger("kickEdm", time);
          }
          if (local === 4 || local === 12) kit.trigger("clapEdm", time);
          if (isOffbeat) kit.trigger("hihatOpen", time);

          const bassNotes = ["C2", "D#2", "F2", "A#2"];
          const currentBassNote = bassNotes[Math.floor(bar / 2) % bassNotes.length];
          
          if (local === 2 || local === 6 || local === 10 || local === 14) {
            bass.triggerAttackRelease(currentBassNote, "8n", time);
          }

          if (local === 0 || local === 3 || local === 8 || local === 11) {
            lead.triggerAttackRelease("C4", "16n", time);
          }
          if (local === 15) kit.trigger("fxLaser", time);
        } else {
          // 아웃트로
          if (local % 4 === 0) kit.trigger("kickEdm", time);
          if (isOffbeat) kit.trigger("hihatClosed", time);
        }
      },
      Array.from({ length: 16 * bars }, (_, i) => i),
      "16n",
    );
    sequence.start(0);
    transport.start();
  }, totalSeconds + LOOP_TAIL_SECONDS);

  const buffer = rendered.get();
  if (!buffer) throw new Error("Electro House 렌더링 실패");
  return buffer;
}

const RENDERERS: Record<SampleId, (bpm: number, bars: number) => Promise<AudioBuffer>> = {
  edmAnthem: renderEdmAnthem,
  futureBass: renderFutureBass,
  electroHouse: renderElectroHouse,
};

/** 내장 무료 샘플 라이브러리에서 id에 해당하는 루프를 오프라인 렌더링한다. */
export async function renderSample(id: SampleId): Promise<AudioBuffer> {
  const definition = SAMPLE_LIBRARY.find((sample) => sample.id === id);
  if (!definition) throw new Error(`알 수 없는 샘플: ${id}`);
  return RENDERERS[id](definition.bpm, definition.bars);
}
