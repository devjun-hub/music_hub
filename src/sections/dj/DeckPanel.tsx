"use client";

import { useState } from "react";
import type { DeckEqBand } from "@/audio/dj/deckEngine";
import { FileDropZone } from "@/components/FileDropZone";
import { LabeledSlider } from "@/components/LabeledSlider";
import { SamplePicker } from "@/components/SamplePicker";
import { DJ_EQ_MAX_DB, DJ_EQ_MIN_DB, DJ_PITCH_RANGE_OPTIONS, type DeckId } from "@/lib/constants";
import { formatDuration } from "@/lib/format";
import { FxPanel } from "./FxPanel";
import { HotCueLoopPanel } from "./HotCueLoopPanel";
import type { DeckControls } from "./useDjEngine";

interface DeckPanelProps {
  deckId: DeckId;
  deck: DeckControls;
}

/** EQ 슬라이더 표시 순서 (믹서 채널 스트립 관례를 따라 위에서부터 High → Low) */
const EQ_BANDS: ReadonlyArray<{ id: DeckEqBand; label: string }> = [
  { id: "high", label: "High" },
  { id: "mid", label: "Mid" },
  { id: "low", label: "Low" },
];

function formatSigned(value: number, unit: string, digits = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}${unit}`;
}

/** 덱 1개 분량의 컨트롤: 트랙 로드, 시크, 재생/큐, 너지, 피치, BPM, EQ, 볼륨 */
export function DeckPanel({ deckId, deck }: DeckPanelProps) {
  const hasTrack = deck.trackName !== null;
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

  const resetEq = () => {
    for (const band of EQ_BANDS) {
      deck.setEq(band.id, 0);
    }
  };

  return (
    <FileDropZone
      onFiles={handleDroppedFiles}
      onRejected={setDropError}
      className="flex flex-col gap-3 rounded-xl border border-surface-border bg-surface p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-lg font-bold transition-colors ${
            deck.isPlaying ? "text-accent-active" : "text-foreground"
          }`}
        >
          덱 {deckId}
        </span>
        <label className="flex min-h-9 cursor-pointer items-center justify-center rounded-full border border-surface-border px-3 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground">
          파일 선택
          <input type="file" accept="audio/*" className="sr-only" onChange={handleFileChange} />
        </label>
      </div>

      <p className="truncate text-sm text-foreground-muted" title={deck.trackName ?? undefined}>
        {deck.trackName ?? "트랙을 불러오세요"}
      </p>
      {deck.loadError && <p className="text-sm text-accent-record">{deck.loadError}</p>}
      {dropError && <p className="text-sm text-accent-record">{dropError}</p>}

      <SamplePicker onSelect={(name, buffer) => deck.loadBuffer(name, buffer)} />

      <div className="space-y-1">
        <input
          type="range"
          min={0}
          max={deck.duration || 1}
          step={0.01}
          value={deck.position}
          disabled={!hasTrack}
          onChange={(event) => deck.seek(Number(event.target.value))}
          aria-label={`덱 ${deckId} 재생 위치`}
          className="h-6 w-full accent-accent-active disabled:opacity-40"
        />
        <div className="flex justify-between font-mono text-xs tabular-nums text-foreground-muted">
          <span>{formatDuration(deck.position * 1000)}</span>
          <span>{formatDuration(deck.duration * 1000)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={deck.togglePlay}
          disabled={!hasTrack}
          aria-pressed={deck.isPlaying}
          className={`min-h-14 flex-1 rounded-xl text-base font-semibold transition-colors disabled:opacity-40 ${
            deck.isPlaying
              ? "bg-accent-active text-black"
              : "border border-surface-border text-foreground hover:border-foreground-muted"
          }`}
        >
          {deck.isPlaying ? "일시정지" : "재생"}
        </button>
        <button
          type="button"
          onClick={deck.cue}
          disabled={!hasTrack}
          className="min-h-14 min-w-16 rounded-xl border border-surface-border text-sm font-semibold text-foreground-muted transition-colors hover:text-foreground disabled:opacity-40"
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
          aria-label={`덱 ${deckId} 너지 마이너스 (누르고 있는 동안 적용)`}
          className="min-h-14 min-w-12 touch-none rounded-xl border border-surface-border text-lg text-foreground-muted transition-colors select-none hover:text-foreground active:bg-surface-border disabled:opacity-40"
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
          aria-label={`덱 ${deckId} 너지 플러스 (누르고 있는 동안 적용)`}
          className="min-h-14 min-w-12 touch-none rounded-xl border border-surface-border text-lg text-foreground-muted transition-colors select-none hover:text-foreground active:bg-surface-border disabled:opacity-40"
        >
          ▶
        </button>
      </div>

      <HotCueLoopPanel deckId={deckId} deck={deck} />

      <div className="space-y-2 rounded-lg border border-surface-border p-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground-muted">피치</span>
          <div role="group" aria-label={`덱 ${deckId} 피치 범위 선택`} className="flex gap-1">
            {DJ_PITCH_RANGE_OPTIONS.map((range) => (
              <button
                key={range}
                type="button"
                aria-pressed={deck.pitchRange === range}
                onClick={() => deck.setPitchRange(range)}
                className={`min-h-7 rounded px-2 text-xs font-medium transition-colors ${
                  deck.pitchRange === range
                    ? "bg-accent-active text-black"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                ±{range}%
              </button>
            ))}
          </div>
        </div>
        <LabeledSlider
          label=""
          min={-deck.pitchRange}
          max={deck.pitchRange}
          step={0.1}
          value={deck.pitchPercent}
          onChange={deck.setPitch}
          formatValue={(value) => formatSigned(value, "%")}
          ariaLabel={`덱 ${deckId} 피치`}
        />
        <div className="flex items-center justify-between font-mono text-xs tabular-nums text-foreground-muted">
          <span>{deck.effectiveBpm.toFixed(1)} BPM</span>
          <button
            type="button"
            onClick={() => deck.setPitch(0)}
            className="font-sans text-xs font-medium tracking-normal text-foreground-muted normal-case transition-colors hover:text-foreground"
          >
            리셋
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <label className="flex flex-1 items-center gap-2">
          <span className="text-foreground-muted">BPM</span>
          <input
            type="number"
            inputMode="decimal"
            min={1}
            step={0.1}
            value={deck.bpm}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (!Number.isNaN(value)) deck.setBpm(value);
            }}
            className="w-20 rounded border border-surface-border bg-background px-2 py-1 font-mono tabular-nums"
            aria-label={`덱 ${deckId} 기준 BPM`}
          />
        </label>
        <button
          type="button"
          onClick={deck.matchBpm}
          className="min-h-9 rounded-full border border-surface-border px-4 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
        >
          매치
        </button>
      </div>

      <div className="space-y-2 rounded-lg border border-surface-border p-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground-muted">EQ</span>
          <button
            type="button"
            onClick={resetEq}
            className="text-xs font-medium text-foreground-muted transition-colors hover:text-foreground"
          >
            리셋
          </button>
        </div>
        {EQ_BANDS.map((band) => (
          <LabeledSlider
            key={band.id}
            label={band.label}
            min={DJ_EQ_MIN_DB}
            max={DJ_EQ_MAX_DB}
            step={0.5}
            value={deck.eq[band.id]}
            onChange={(value) => deck.setEq(band.id, value)}
            formatValue={(value) => formatSigned(value, "dB")}
            ariaLabel={`덱 ${deckId} ${band.label} EQ`}
          />
        ))}
      </div>

      <FxPanel deckId={deckId} deck={deck} />

      <LabeledSlider
        label="볼륨"
        min={0}
        max={1}
        step={0.01}
        value={deck.volume}
        onChange={deck.setVolume}
        formatValue={(value) => `${Math.round(value * 100)}%`}
        ariaLabel={`덱 ${deckId} 채널 볼륨`}
      />
    </FileDropZone>
  );
}
