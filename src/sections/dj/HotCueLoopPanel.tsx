"use client";

import { useState } from "react";
import { DJ_HOT_CUE_COUNT, DJ_LOOP_BEAT_OPTIONS, type DeckId } from "@/lib/constants";
import type { DeckControls } from "./useDjEngine";

interface HotCueLoopPanelProps {
  deckId: DeckId;
  deck: DeckControls;
}

const HOT_CUE_INDICES = Array.from({ length: DJ_HOT_CUE_COUNT }, (_, index) => index);

/** 덱별 핫큐(4슬롯) + 비트 루프(1/2/4/8비트) 컨트롤. */
export function HotCueLoopPanel({ deckId, deck }: HotCueLoopPanelProps) {
  const [clearMode, setClearMode] = useState(false);
  const hasTrack = deck.trackName !== null;

  const handleCuePress = (index: number) => {
    if (clearMode) {
      deck.clearHotCue(index);
      return;
    }
    if (deck.hotCues[index] === null) {
      deck.setHotCue(index);
    } else {
      deck.triggerHotCue(index);
    }
  };

  return (
    <div
      className="space-y-2 rounded-lg border p-2"
      style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground-muted">핫큐</span>
        <button
          type="button"
          aria-pressed={clearMode}
          onClick={() => setClearMode((prev) => !prev)}
          className={`min-h-7 rounded-full px-3 text-xs font-semibold transition-colors ${
            clearMode
              ? "bg-accent-record text-black"
              : "border border-surface-border text-foreground-muted hover:text-foreground"
          }`}
        >
          지우기
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {HOT_CUE_INDICES.map((index) => {
          const isSet = deck.hotCues[index] !== null;
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleCuePress(index)}
              disabled={!hasTrack && !isSet}
              aria-label={`덱 ${deckId} 핫큐 ${index + 1}${isSet ? " (설정됨)" : " (비어있음)"}`}
              className={`min-h-11 rounded-lg text-sm font-bold transition-all disabled:opacity-40 ${
                isSet
                  ? clearMode
                    ? "border-2 border-accent-record text-accent-record"
                    : "border-2 border-accent-active text-accent-active"
                  : "border-2 border-dashed border-surface-border text-foreground-muted hover:text-foreground"
              }`}
              style={isSet && !clearMode ? { boxShadow: "0 0 8px var(--primary-glow)" } : {}}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-surface-border pt-2">
        <span className="text-xs font-semibold text-foreground-muted">비트 루프</span>
        <div className="flex items-center gap-2">
          <div role="group" aria-label={`덱 ${deckId} 루프 길이 선택`} className="flex gap-1">
            {DJ_LOOP_BEAT_OPTIONS.map((beats) => (
              <button
                key={beats}
                type="button"
                aria-pressed={deck.loopBeats === beats}
                onClick={() => deck.setLoopBeats(beats)}
                className={`min-h-7 rounded px-2 text-xs font-medium transition-colors ${
                  deck.loopBeats === beats
                    ? "bg-accent-active text-black"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                {beats}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={deck.toggleLoop}
            disabled={!hasTrack}
            aria-pressed={deck.loopActive}
            className={`min-h-7 rounded-full px-3 text-xs font-semibold transition-all disabled:opacity-40 ${
              deck.loopActive
                ? "bg-accent-active text-black"
                : "border border-surface-border text-foreground-muted hover:text-foreground"
            }`}
            style={deck.loopActive ? { boxShadow: "0 0 10px var(--primary-glow)" } : {}}
          >
            {deck.loopActive ? "LOOP ON" : "LOOP"}
          </button>
        </div>
      </div>
    </div>
  );
}
