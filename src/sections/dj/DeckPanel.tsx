"use client";

import { useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { SamplePicker } from "@/components/SamplePicker";
import { DJ_PITCH_RANGE_OPTIONS, type DeckId } from "@/lib/constants";
import { formatDuration } from "@/lib/format";
import { FxPanel } from "./FxPanel";
import { HotCueLoopPanel } from "./HotCueLoopPanel";
import { JogWheel } from "./JogWheel";
import type { DeckControls } from "./useDjEngine";

interface DeckPanelProps {
  deckId: DeckId;
  deck: DeckControls;
}

function formatSigned(value: number, unit: string, digits = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}${unit}`;
}

export function DeckPanel({ deckId, deck }: DeckPanelProps) {
  const hasTrack = deck.trackName !== null;
  const [activeTab, setActiveTab] = useState<"cues" | "fx">("cues");
  const [dropError, setDropError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void deck.loadFile(file);
  };

  const handleDroppedFiles = (files: File[]) => {
    setDropError(null);
    void deck.loadFile(files[0]);
  };

  return (
    <FileDropZone
      onFiles={handleDroppedFiles}
      onRejected={setDropError}
      className="flex flex-col gap-3 rounded-xl border p-3 transition-all duration-300 min-h-full justify-between select-none"
      style={{
        background: "var(--glass-bg)",
        borderColor: deck.isPlaying ? "var(--primary-glow)" : "var(--glass-border)",
        boxShadow: deck.isPlaying
          ? "0 0 24px var(--primary-glow), inset 0 0 16px rgba(0,0,0,0.2)"
          : "none",
      }}
    >
      <div className="flex items-stretch gap-3 w-full h-full">
        {/* 플레이어 메인 영역 (왼쪽) */}
        <div className="flex-1 flex flex-col gap-2.5 min-h-0">
          <div className="flex items-center justify-between gap-2 flex-none">
            <span
              className={`text-base font-bold transition-colors ${
                deck.isPlaying ? "text-accent-active" : "text-foreground"
              }`}
            >
              DECK {deckId}
            </span>
            <label className="flex h-8 cursor-pointer items-center justify-center rounded-full border border-surface-border px-2.5 text-xs font-semibold text-foreground-muted transition-colors hover:text-foreground">
              파일 선택
              <input type="file" accept="audio/*" className="sr-only" onChange={handleFileChange} />
            </label>
          </div>

          <p className="truncate text-xs text-foreground-muted flex-none font-medium" title={deck.trackName ?? undefined}>
            {deck.trackName ?? "트랙을 불러오세요"}
          </p>
          {deck.loadError && <p className="text-xs text-accent-record flex-none">{deck.loadError}</p>}
          {dropError && <p className="text-xs text-accent-record flex-none">{dropError}</p>}

          <div className="flex-none">
            <SamplePicker onSelect={(name, buffer) => deck.loadBuffer(name, buffer)} />
          </div>

          {/* 조그 휠 */}
          <div className="mx-auto w-full max-w-[38dvh] max-h-[38dvh] aspect-square flex-1 flex items-center justify-center min-h-[80px] min-w-[80px]">
            <JogWheel
              isPlaying={deck.isPlaying}
              position={deck.position}
              duration={deck.duration}
              effectiveBpm={deck.effectiveBpm}
              trackName={deck.trackName}
              onSeek={deck.seek}
              disabled={!hasTrack}
            />
          </div>

          {/* 시크 바 */}
          <div className="space-y-1 flex-none">
            <input
              type="range"
              min={0}
              max={deck.duration || 1}
              step={0.01}
              value={deck.position}
              disabled={!hasTrack}
              onChange={(event) => deck.seek(Number(event.target.value))}
              aria-label={`덱 ${deckId} 재생 위치`}
              className="h-5 w-full accent-accent-active disabled:opacity-40"
            />
            <div className="flex justify-between font-mono text-[10px] tabular-nums text-foreground-muted">
              <span>{formatDuration(deck.position * 1000)}</span>
              <span>{formatDuration(deck.duration * 1000)}</span>
            </div>
          </div>

          {/* 재생 제어 단 */}
          <div className="flex items-center gap-1.5 flex-none">
            <button
              type="button"
              onClick={deck.togglePlay}
              disabled={!hasTrack}
              aria-pressed={deck.isPlaying}
              className={`min-h-10 flex-1 rounded-xl text-xs font-semibold transition-all duration-150 disabled:opacity-40 ${
                deck.isPlaying
                  ? "bg-accent-active text-black"
                  : "border border-surface-border text-foreground hover:border-foreground-muted"
              }`}
              style={deck.isPlaying ? { boxShadow: "0 0 16px var(--primary-glow)" } : {}}
            >
              {deck.isPlaying ? "PAUSE" : "PLAY"}
            </button>
            <button
              type="button"
              onClick={deck.cue}
              disabled={!hasTrack}
              className="min-h-10 min-w-12 rounded-xl border border-surface-border text-xs font-semibold text-foreground-muted transition-colors hover:text-foreground disabled:opacity-40"
            >
              CUE
            </button>
            <button
              type="button"
              onPointerDown={() => deck.nudge(-1, true)}
              onPointerUp={() => deck.nudge(-1, false)}
              onPointerLeave={() => deck.nudge(-1, false)}
              onPointerCancel={() => deck.nudge(-1, false)}
              disabled={!hasTrack}
              aria-label={`덱 ${deckId} 너지 마이너스`}
              className="min-h-10 min-w-10 touch-none rounded-xl border border-surface-border text-sm text-foreground-muted transition-colors select-none hover:text-foreground active:bg-surface-border disabled:opacity-40 flex items-center justify-center"
            >
              ◀
            </button>
            <button
              type="button"
              onPointerDown={() => deck.nudge(1, true)}
              onPointerUp={() => deck.nudge(1, false)}
              onPointerLeave={() => deck.nudge(1, false)}
              onPointerCancel={() => deck.nudge(1, false)}
              disabled={!hasTrack}
              aria-label={`덱 ${deckId} 너지 플러스`}
              className="min-h-10 min-w-10 touch-none rounded-xl border border-surface-border text-sm text-foreground-muted transition-colors select-none hover:text-foreground active:bg-surface-border disabled:opacity-40 flex items-center justify-center"
            >
              ▶
            </button>
          </div>

          {/* 핫큐/FX 탭 헤더 */}
          <div className="flex border-b border-zinc-800 flex-none text-[10px] gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("cues")}
              className={`flex-1 py-1 font-bold transition-all text-center rounded-t-lg ${
                activeTab === "cues"
                  ? "text-accent-active bg-black/40 border-b border-accent-active"
                  : "text-zinc-500 hover:text-foreground"
              }`}
            >
              HOT CUE / LOOP
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("fx")}
              className={`flex-1 py-1 font-bold transition-all text-center rounded-t-lg ${
                activeTab === "fx"
                  ? "text-accent-active bg-black/40 border-b border-accent-active"
                  : "text-zinc-500 hover:text-foreground"
              }`}
            >
              EFFECTS
            </button>
          </div>

          <div className="flex-none">
            {activeTab === "cues" ? (
              <HotCueLoopPanel deckId={deckId} deck={deck} />
            ) : (
              <FxPanel deckId={deckId} deck={deck} />
            )}
          </div>
        </div>

        {/* 피치 슬라이더 영역 (오른쪽 세로 배치) */}
        <div className="w-12 bg-black/40 border border-zinc-800/40 p-2 rounded-xl flex flex-col items-center justify-between py-3 flex-none h-full">
          <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">TEMPO</span>

          <div role="group" aria-label={`덱 ${deckId} 피치 범위`} className="flex flex-col gap-0.5 w-full">
            {DJ_PITCH_RANGE_OPTIONS.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => deck.setPitchRange(range)}
                className={`h-4 w-full rounded text-[8px] font-bold transition-colors ${
                  deck.pitchRange === range
                    ? "bg-accent-active text-black font-extrabold"
                    : "text-zinc-500 hover:text-foreground"
                }`}
              >
                ±{range}%
              </button>
            ))}
          </div>

          <div className="flex-1 flex items-center justify-center py-4 w-full">
            <input
              type="range"
              {...({ orient: "vertical" } as Record<string, string>)}
              min={-deck.pitchRange}
              max={deck.pitchRange}
              step={0.1}
              value={deck.pitchPercent}
              onChange={(e) => deck.setPitch(Number(e.target.value))}
              className="h-full w-1 cursor-pointer accent-accent-active"
              style={{ WebkitAppearance: "slider-vertical" }}
            />
          </div>

          <div className="flex flex-col items-center gap-1.5 w-full">
            <span className="text-[8px] font-mono text-zinc-500 font-bold">{deck.effectiveBpm.toFixed(1)} BPM</span>
            <div className="flex items-center gap-1 w-full justify-center">
              <button
                type="button"
                onClick={deck.matchBpm}
                className="rounded border border-zinc-800 px-1 py-0.5 text-[8px] font-bold text-zinc-400 hover:text-foreground transition-colors active:scale-95"
              >
                SYNC
              </button>
              <button
                type="button"
                onClick={() => deck.setPitch(0)}
                className="rounded border border-zinc-800 px-1 py-0.5 text-[8px] font-bold text-zinc-400 hover:text-foreground transition-colors active:scale-95"
              >
                RST
              </button>
            </div>
            <span className="text-[8px] font-mono text-zinc-500 font-bold">{formatSigned(deck.pitchPercent, "%")}</span>
          </div>
        </div>
      </div>
    </FileDropZone>
  );
}
