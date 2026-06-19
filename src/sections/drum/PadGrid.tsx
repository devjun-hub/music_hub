"use client";

import { DRUM_SOUNDS, type DrumSoundId } from "@/lib/constants";
import { usePadFlash } from "./usePadFlash";

interface PadGridProps {
  hitCounts: Record<DrumSoundId, number>;
  onTrigger: (id: DrumSoundId) => void;
  selectedSoundId: DrumSoundId;
}

interface PadProps {
  sound: (typeof DRUM_SOUNDS)[number];
  hitCount: number;
  onTrigger: (id: DrumSoundId) => void;
  isSelected: boolean;
}

/**
 * 사운드별 플래시 색상 (border + background).
 * Tailwind 퍼지를 위해 전체 클래스명 정적 작성.
 */
const PAD_FLASH_CLASSES: Record<DrumSoundId, string> = {
  // 원래 16개
  kick:        "border-blue-400    bg-blue-500/25",
  snare:       "border-amber-400   bg-amber-500/25",
  hihatClosed: "border-teal-400    bg-teal-500/25",
  hihatOpen:   "border-cyan-400    bg-cyan-500/25",
  tomLow:      "border-violet-400  bg-violet-500/25",
  tomMid:      "border-purple-400  bg-purple-500/25",
  tomHigh:     "border-fuchsia-400 bg-fuchsia-500/25",
  crash:       "border-red-400     bg-red-500/25",
  ride:        "border-orange-400  bg-orange-500/25",
  clap:        "border-pink-400    bg-pink-500/25",
  rimshot:     "border-yellow-400  bg-yellow-500/25",
  cowbell:     "border-lime-400    bg-lime-500/25",
  shaker:      "border-emerald-400 bg-emerald-500/25",
  conga:       "border-sky-400     bg-sky-500/25",
  bongo:       "border-rose-400    bg-rose-500/25",
  perc:        "border-indigo-400  bg-indigo-500/25",
  // EDM 16개
  kickEdm:     "border-blue-400    bg-blue-500/25",
  snareEdm:    "border-amber-400   bg-amber-500/25",
  clapEdm:     "border-pink-400    bg-pink-500/25",
  crashEdm:    "border-red-400     bg-red-500/25",
  synthPluck:  "border-violet-400  bg-violet-500/25",
  synthLead:   "border-purple-400  bg-purple-500/25",
  bassDrop:    "border-indigo-400  bg-indigo-500/25",
  fxLaser:     "border-teal-400    bg-teal-500/25",
  fxUplifter:  "border-cyan-400    bg-cyan-500/25",
  fxDownlifter:"border-sky-400     bg-sky-500/25",
  vocalHey:    "border-yellow-400  bg-yellow-500/25",
  vocalGo:     "border-orange-400  bg-orange-500/25",
  rimEdm:      "border-lime-400    bg-lime-500/25",
  congaHigh:   "border-emerald-400 bg-emerald-500/25",
  cowbellEdm:  "border-rose-400    bg-rose-500/25",
  fxScream:    "border-fuchsia-400 bg-fuchsia-500/25",
};

/** flash 시 box-shadow glow (각 패드 색에 맞춤) */
const PAD_GLOW_SHADOW: Record<DrumSoundId, string> = {
  kick:        "0 0 14px rgba(96,165,250,0.55)",
  snare:       "0 0 14px rgba(251,191,36,0.55)",
  hihatClosed: "0 0 14px rgba(45,212,191,0.55)",
  hihatOpen:   "0 0 14px rgba(34,211,238,0.55)",
  tomLow:      "0 0 14px rgba(167,139,250,0.55)",
  tomMid:      "0 0 14px rgba(192,132,252,0.55)",
  tomHigh:     "0 0 14px rgba(232,121,249,0.55)",
  crash:       "0 0 14px rgba(248,113,113,0.55)",
  ride:        "0 0 14px rgba(251,146,60,0.55)",
  clap:        "0 0 14px rgba(244,114,182,0.55)",
  rimshot:     "0 0 14px rgba(250,204,21,0.55)",
  cowbell:     "0 0 14px rgba(163,230,53,0.55)",
  shaker:      "0 0 14px rgba(52,211,153,0.55)",
  conga:       "0 0 14px rgba(56,189,248,0.55)",
  bongo:       "0 0 14px rgba(251,113,133,0.55)",
  perc:        "0 0 14px rgba(129,140,248,0.55)",
  // EDM 16개
  kickEdm:     "0 0 14px rgba(96,165,250,0.55)",
  snareEdm:    "0 0 14px rgba(251,191,36,0.55)",
  clapEdm:     "0 0 14px rgba(244,114,182,0.55)",
  crashEdm:    "0 0 14px rgba(248,113,113,0.55)",
  synthPluck:  "0 0 14px rgba(167,139,250,0.55)",
  synthLead:   "0 0 14px rgba(192,132,252,0.55)",
  bassDrop:    "0 0 14px rgba(129,140,248,0.55)",
  fxLaser:     "0 0 14px rgba(45,212,191,0.55)",
  fxUplifter:  "0 0 14px rgba(34,211,238,0.55)",
  fxDownlifter:"0 0 14px rgba(56,189,248,0.55)",
  vocalHey:    "0 0 14px rgba(250,204,21,0.55)",
  vocalGo:     "0 0 14px rgba(251,146,60,0.55)",
  rimEdm:      "0 0 14px rgba(163,230,53,0.55)",
  congaHigh:   "0 0 14px rgba(52,211,153,0.55)",
  cowbellEdm:  "0 0 14px rgba(251,113,133,0.55)",
  fxScream:    "0 0 14px rgba(232,121,249,0.55)",
};

/** 상시 표시 도트 색상 */
const PAD_DOT_CLASSES: Record<DrumSoundId, string> = {
  kick:        "bg-blue-500",
  snare:       "bg-amber-500",
  hihatClosed: "bg-teal-500",
  hihatOpen:   "bg-cyan-500",
  tomLow:      "bg-violet-500",
  tomMid:      "bg-purple-500",
  tomHigh:     "bg-fuchsia-500",
  crash:       "bg-red-500",
  ride:        "bg-orange-500",
  clap:        "bg-pink-500",
  rimshot:     "bg-yellow-500",
  cowbell:     "bg-lime-500",
  shaker:      "bg-emerald-500",
  conga:       "bg-sky-500",
  bongo:       "bg-rose-500",
  perc:        "bg-indigo-500",
  // EDM 16개
  kickEdm:     "bg-blue-500",
  snareEdm:    "bg-amber-500",
  clapEdm:     "bg-pink-500",
  crashEdm:    "bg-red-500",
  synthPluck:  "bg-violet-500",
  synthLead:   "bg-purple-500",
  bassDrop:    "bg-indigo-500",
  fxLaser:     "bg-teal-500",
  fxUplifter:  "bg-cyan-500",
  fxDownlifter:"bg-sky-500",
  vocalHey:    "bg-yellow-500",
  vocalGo:     "bg-orange-500",
  rimEdm:      "bg-lime-500",
  congaHigh:   "bg-emerald-500",
  cowbellEdm:  "bg-rose-500",
  fxScream:    "bg-fuchsia-500",
};

const SOUND_PAD_NUMBERS: Record<DrumSoundId, string> = {
  kick: "A01", snare: "A02", hihatClosed: "A03", hihatOpen: "A04",
  tomLow: "A05", tomMid: "A06", tomHigh: "A07", crash: "A08",
  ride: "A09", clap: "A10", rimshot: "A11", cowbell: "A12",
  shaker: "A13", conga: "A14", bongo: "A15", perc: "A16",

  kickEdm: "B01", snareEdm: "B02", clapEdm: "B03", crashEdm: "B04",
  synthPluck: "B05", synthLead: "B06", bassDrop: "B07", fxLaser: "B08",
  fxUplifter: "B09", fxDownlifter: "B10", vocalHey: "B11", vocalGo: "B12",
  rimEdm: "B13", congaHigh: "B14", cowbellEdm: "B15", fxScream: "B16"
};

function Pad({ sound, hitCount, onTrigger, isSelected }: PadProps) {
  const isFlashing = usePadFlash(hitCount);
  const padNumber = SOUND_PAD_NUMBERS[sound.id];

  return (
    <button
      type="button"
      onClick={() => onTrigger(sound.id)}
      aria-label={`${sound.label} 패드 ${padNumber} (단축키 ${sound.key})`}
      className={`relative flex aspect-square w-full h-full touch-manipulation flex-col items-between justify-between p-1.5 sm:p-2.5 rounded-lg border-2 transition-all duration-75 active:translate-y-0.5 active:shadow-none ${
        isFlashing
          ? `${PAD_FLASH_CLASSES[sound.id]} border-t-white/30 border-b-black/60`
          : isSelected
            ? "border-cyan-400/80 bg-cyan-950/20 shadow-[0_2px_0_#06b6d4,inset_0_1px_0_rgba(255,255,255,0.1)]"
            : "border-zinc-700/60 bg-zinc-900 shadow-[0_3px_0_#18181b,inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-zinc-500"
      }`}
      style={{
        boxShadow: isFlashing
          ? PAD_GLOW_SHADOW[sound.id]
          : isSelected
            ? "0 0 12px rgba(6,182,212,0.4), inset 0 0 8px rgba(6,182,212,0.1)"
            : undefined,
      }}
    >
      {/* 상단 라벨 영역: 패드 번호 및 단축키 */}
      <div className="flex w-full justify-between items-center text-[7px] sm:text-[8px] font-mono text-zinc-500 select-none">
        <span className={isFlashing || isSelected ? "text-cyan-400 font-bold" : ""}>
          {padNumber}
        </span>
        <span className="bg-black/40 px-1 py-0.2 rounded text-[7px] text-zinc-400">
          {sound.key.toUpperCase()}
        </span>
      </div>

      {/* 중앙 사운드 이름 */}
      <span className={`text-[8px] sm:text-[10px] font-black tracking-wider leading-none select-none my-auto ${
        isFlashing ? "text-white" : isSelected ? "text-cyan-200" : "text-zinc-300"
      }`}>
        {sound.shortLabel}
      </span>

      {/* 하단 LED 인디케이터 도트 */}
      <div className="w-full flex justify-center items-center h-1 select-none">
        <span
          className={`h-1 w-1 rounded-full transition-all duration-75 ${
            isFlashing 
              ? PAD_DOT_CLASSES[sound.id]
              : isSelected 
                ? "bg-cyan-400 shadow-[0_0_4px_#06b6d4]" 
                : "bg-zinc-700"
          }`}
        />
      </div>
    </button>
  );
}

/** MPC 스타일 32패드 (16패드 2개 가로/세로 배치). 사운드별 색상 플래시로 타격을 표시한다. */
export function PadGrid({ hitCounts, onTrigger, selectedSoundId }: PadGridProps) {
  // MPC 패드 배치 순서대로 (A13~A16이 맨 위, A01~A04가 맨 아래)
  const bankASounds = [
    DRUM_SOUNDS.slice(12, 16),
    DRUM_SOUNDS.slice(8, 12),
    DRUM_SOUNDS.slice(4, 8),
    DRUM_SOUNDS.slice(0, 4)
  ].flat();

  // B13~B16이 맨 위, B01~B04가 맨 아래
  const bankBSounds = [
    DRUM_SOUNDS.slice(28, 32),
    DRUM_SOUNDS.slice(24, 28),
    DRUM_SOUNDS.slice(20, 24),
    DRUM_SOUNDS.slice(16, 20)
  ].flat();

  return (
    <div className="flex flex-col lg:flex-row gap-4 justify-center items-center w-full">
      {/* 뱅크 A 컨트롤러 (왼쪽) */}
      <div
        className="rounded-2xl border-4 p-3 sm:p-4 w-full aspect-square max-h-[38dvh] max-w-[38dvh] flex flex-col justify-between"
        style={{
          background: "linear-gradient(135deg, #18181b 0%, #09090b 100%)",
          borderColor: "#27272a",
          boxShadow: "inset 0 1px 3px rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.6)"
        }}
      >
        <div className="flex justify-between items-center text-[8px] font-mono font-bold tracking-widest text-zinc-500 mb-1.5 px-1 select-none">
          <span>MPC-16 BANK A (ORIGINAL)</span>
          <span className="text-cyan-500/60 font-black">RGB SILICONE PADS</span>
        </div>

        <div className="grid grid-cols-4 gap-2 flex-1">
          {bankASounds.map((sound) => (
            <Pad
              key={sound.id}
              sound={sound}
              hitCount={hitCounts[sound.id]}
              onTrigger={onTrigger}
              isSelected={sound.id === selectedSoundId}
            />
          ))}
        </div>
      </div>

      {/* 뱅크 B 컨트롤러 (오른쪽) */}
      <div
        className="rounded-2xl border-4 p-3 sm:p-4 w-full aspect-square max-h-[38dvh] max-w-[38dvh] flex flex-col justify-between"
        style={{
          background: "linear-gradient(135deg, #18181b 0%, #09090b 100%)",
          borderColor: "#27272a",
          boxShadow: "inset 0 1px 3px rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.6)"
        }}
      >
        <div className="flex justify-between items-center text-[8px] font-mono font-bold tracking-widest text-zinc-500 mb-1.5 px-1 select-none">
          <span>MPC-16 BANK B (EDM FESTIVAL)</span>
          <span className="text-cyan-500/60 font-black">RGB SILICONE PADS</span>
        </div>

        <div className="grid grid-cols-4 gap-2 flex-1">
          {bankBSounds.map((sound) => (
            <Pad
              key={sound.id}
              sound={sound}
              hitCount={hitCounts[sound.id]}
              onTrigger={onTrigger}
              isSelected={sound.id === selectedSoundId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
