"use client";

import {
  DEFAULT_CROSSFADER,
  DJ_EQ_MAX_DB,
  DJ_EQ_MIN_DB,
  DJ_FILTER_MAX,
  DJ_FILTER_MIN,
  DJ_FILTER_STEP,
} from "@/lib/constants";
import { MasterMeter } from "./MasterMeter";
import type { DeckControls } from "./useDjEngine";

interface MixerPanelProps {
  crossfade: number;
  onCrossfadeChange: (value: number) => void;
  getMasterLevel: () => number;
  deckA: DeckControls;
  deckB: DeckControls;
}

const EQ_BANDS = [
  { id: "high", label: "HI" },
  { id: "mid", label: "MID" },
  { id: "low", label: "LOW" },
] as const;

function formatSigned(value: number, unit: string): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(0)}${unit}`;
}

export function MixerPanel({
  crossfade,
  onCrossfadeChange,
  getMasterLevel,
  deckA,
  deckB,
}: MixerPanelProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl border p-3 bg-zinc-950/90 border-zinc-800 shadow-2xl min-h-full flex-none justify-between select-none"
    >
      <h2 className="text-center text-xs font-bold text-zinc-500 uppercase tracking-widest flex-none">MIXER</h2>

      {/* 채널 스트립 영역 */}
      <div className="flex gap-2.5 items-stretch justify-center flex-1 min-h-0 py-1">
        {/* 채널 A */}
        <div className="flex flex-col items-center justify-between bg-black/40 border border-zinc-800/40 p-2 rounded-lg w-24">
          <span className="text-[10px] font-bold text-primary">CH A</span>

          {/* EQ 단 */}
          <div className="space-y-2 w-full mt-2">
            {EQ_BANDS.map((band) => (
              <div key={band.id} className="flex flex-col gap-0.5">
                <div className="flex justify-between text-[8px] font-semibold text-zinc-500">
                  <span>{band.label}</span>
                  <span className="font-mono text-zinc-400">{formatSigned(deckA.eq[band.id], "")}</span>
                </div>
                <input
                  type="range"
                  min={DJ_EQ_MIN_DB}
                  max={DJ_EQ_MAX_DB}
                  step={0.5}
                  value={deckA.eq[band.id]}
                  onChange={(e) => deckA.setEq(band.id, Number(e.target.value))}
                  className="w-full accent-primary h-1 cursor-pointer"
                />
              </div>
            ))}
            
            {/* Filter 단 */}
            <div className="flex flex-col gap-0.5 border-t border-zinc-800/50 pt-1.5 mt-1">
              <div className="flex justify-between text-[8px] font-semibold text-zinc-500">
                <span>FILTER</span>
                <span className="font-mono text-zinc-400">
                  {deckA.filter === 0 ? "0" : deckA.filter < 0 ? `L${Math.round(-deckA.filter * 10)}` : `H${Math.round(deckA.filter * 10)}`}
                </span>
              </div>
              <input
                type="range"
                min={DJ_FILTER_MIN}
                max={DJ_FILTER_MAX}
                step={DJ_FILTER_STEP}
                value={deckA.filter}
                onChange={(e) => deckA.setFilter(Number(e.target.value))}
                className="w-full accent-primary h-1 cursor-pointer"
              />
            </div>
          </div>

          {/* Volume fader */}
          <div className="flex flex-col items-center gap-1 mt-3 w-full">
            <input
              type="range"
              {...({ orient: "vertical" } as Record<string, string>)}
              min={0}
              max={1}
              step={0.01}
              value={deckA.volume}
              onChange={(e) => deckA.setVolume(Number(e.target.value))}
              className="h-20 w-1 cursor-pointer"
              style={{ WebkitAppearance: "slider-vertical" }}
            />
            <span className="text-[8px] font-mono text-zinc-500 font-bold">FADER A</span>
          </div>
        </div>

        {/* 마스터 미터 */}
        <div className="flex flex-col items-center justify-between py-2.5 w-8">
          <span className="text-[8px] font-extrabold text-zinc-600 tracking-wider">LEVEL</span>
          <MasterMeter getLevel={getMasterLevel} />
          <span className="text-[8px] font-extrabold text-zinc-600 tracking-wider">METER</span>
        </div>

        {/* 채널 B */}
        <div className="flex flex-col items-center justify-between bg-black/40 border border-zinc-800/40 p-2 rounded-lg w-24">
          <span className="text-[10px] font-bold text-primary">CH B</span>

          {/* EQ 단 */}
          <div className="space-y-2 w-full mt-2">
            {EQ_BANDS.map((band) => (
              <div key={band.id} className="flex flex-col gap-0.5">
                <div className="flex justify-between text-[8px] font-semibold text-zinc-500">
                  <span>{band.label}</span>
                  <span className="font-mono text-zinc-400">{formatSigned(deckB.eq[band.id], "")}</span>
                </div>
                <input
                  type="range"
                  min={DJ_EQ_MIN_DB}
                  max={DJ_EQ_MAX_DB}
                  step={0.5}
                  value={deckB.eq[band.id]}
                  onChange={(e) => deckB.setEq(band.id, Number(e.target.value))}
                  className="w-full accent-primary h-1 cursor-pointer"
                />
              </div>
            ))}
            
            {/* Filter 단 */}
            <div className="flex flex-col gap-0.5 border-t border-zinc-800/50 pt-1.5 mt-1">
              <div className="flex justify-between text-[8px] font-semibold text-zinc-500">
                <span>FILTER</span>
                <span className="font-mono text-zinc-400">
                  {deckB.filter === 0 ? "0" : deckB.filter < 0 ? `L${Math.round(-deckB.filter * 10)}` : `H${Math.round(deckB.filter * 10)}`}
                </span>
              </div>
              <input
                type="range"
                min={DJ_FILTER_MIN}
                max={DJ_FILTER_MAX}
                step={DJ_FILTER_STEP}
                value={deckB.filter}
                onChange={(e) => deckB.setFilter(Number(e.target.value))}
                className="w-full accent-primary h-1 cursor-pointer"
              />
            </div>
          </div>

          {/* Volume fader */}
          <div className="flex flex-col items-center gap-1 mt-3 w-full">
            <input
              type="range"
              {...({ orient: "vertical" } as Record<string, string>)}
              min={0}
              max={1}
              step={0.01}
              value={deckB.volume}
              onChange={(e) => deckB.setVolume(Number(e.target.value))}
              className="h-20 w-1 cursor-pointer"
              style={{ WebkitAppearance: "slider-vertical" }}
            />
            <span className="text-[8px] font-mono text-zinc-500 font-bold">FADER B</span>
          </div>
        </div>
      </div>

      {/* 크로스페이더 단 */}
      <div className="space-y-1 border-t border-zinc-900 pt-2 flex-none">
        <div className="flex items-center justify-between text-[9px] font-bold text-zinc-500 px-1">
          <span style={{ color: crossfade < 0.4 ? "var(--primary)" : undefined }}>A</span>
          <span>X-FADER</span>
          <span style={{ color: crossfade > 0.6 ? "var(--primary)" : undefined }}>B</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={crossfade}
          onChange={(event) => onCrossfadeChange(Number(event.target.value))}
          aria-label="크로스페이더"
          className="h-5 w-full accent-accent-active cursor-pointer"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="font-mono text-[9px] tabular-nums text-zinc-500">
            {crossfade < 0.4 ? `A ${Math.round((1 - crossfade * 2) * 100)}%` : crossfade > 0.6 ? `B ${Math.round((crossfade * 2 - 1) * 100)}%` : "MID"}
          </span>
          <button
            type="button"
            onClick={() => onCrossfadeChange(DEFAULT_CROSSFADER)}
            className="rounded border border-zinc-800 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400 hover:text-foreground transition-colors active:scale-95 animate-none"
          >
            RESET
          </button>
        </div>
      </div>
    </div>
  );
}
