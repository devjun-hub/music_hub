"use client";

import { useState } from "react";
import { LabeledSlider } from "@/components/LabeledSlider";
import {
  DJ_ECHO_DIVISIONS,
  DJ_FILTER_MAX,
  DJ_FILTER_MIN,
  DJ_FILTER_STEP,
  ECHO_WET_MAX,
  ECHO_WET_MIN,
  ECHO_WET_STEP,
  REVERB_WET_MAX,
  REVERB_WET_MIN,
  REVERB_WET_STEP,
  type DeckId,
} from "@/lib/constants";
import type { DeckControls } from "./useDjEngine";

interface FxPanelProps {
  deckId: DeckId;
  deck: DeckControls;
}

function formatFilter(value: number): string {
  if (value === 0) return "OFF";
  if (value < 0) return `LP ${Math.round(-value * 100)}%`;
  return `HP ${Math.round(value * 100)}%`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** 덱별 FX 유닛: 필터 스윕 + BPM 동기 에코 + 리버브. DrumMixerPanel과 동일한 접이식 패턴. */
export function FxPanel({ deckId, deck }: FxPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="min-h-11 w-full rounded-full border border-dashed border-surface-border text-sm text-foreground-muted transition-colors hover:border-foreground-muted hover:text-foreground"
      >
        FX {isOpen ? "닫기" : "펼치기"}
      </button>
      {isOpen && (
        <div className="space-y-3 rounded-xl border border-surface-border bg-surface p-3">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-foreground-muted">필터</span>
            <LabeledSlider
              label=""
              min={DJ_FILTER_MIN}
              max={DJ_FILTER_MAX}
              step={DJ_FILTER_STEP}
              value={deck.filter}
              onChange={deck.setFilter}
              formatValue={formatFilter}
              ariaLabel={`덱 ${deckId} 필터`}
            />
          </div>

          <div className="space-y-1.5 border-t border-surface-border pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground-muted">에코</span>
              <div className="flex items-center gap-2">
                <div role="group" aria-label={`덱 ${deckId} 에코 분음 선택`} className="flex gap-1">
                  {DJ_ECHO_DIVISIONS.map((division) => (
                    <button
                      key={division}
                      type="button"
                      aria-pressed={deck.echoDivision === division}
                      onClick={() => deck.setEchoDivision(division)}
                      className={`min-h-7 rounded px-2 text-xs font-medium transition-colors ${
                        deck.echoDivision === division
                          ? "bg-accent-active text-black"
                          : "text-foreground-muted hover:text-foreground"
                      }`}
                    >
                      1/{division}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  aria-pressed={deck.echoEnabled}
                  onClick={() => deck.setEchoEnabled(!deck.echoEnabled)}
                  className={`min-h-7 rounded-full px-3 text-xs font-semibold transition-colors ${
                    deck.echoEnabled
                      ? "bg-accent-active text-black"
                      : "border border-surface-border text-foreground-muted hover:text-foreground"
                  }`}
                >
                  {deck.echoEnabled ? "ON" : "OFF"}
                </button>
              </div>
            </div>
            <LabeledSlider
              label="Wet"
              min={ECHO_WET_MIN}
              max={ECHO_WET_MAX}
              step={ECHO_WET_STEP}
              value={deck.echoWet}
              onChange={deck.setEchoWet}
              formatValue={formatPercent}
              ariaLabel={`덱 ${deckId} 에코 강도`}
            />
          </div>

          <div className="space-y-1.5 border-t border-surface-border pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground-muted">리버브</span>
              <button
                type="button"
                aria-pressed={deck.reverbEnabled}
                onClick={() => deck.setReverbEnabled(!deck.reverbEnabled)}
                className={`min-h-7 rounded-full px-3 text-xs font-semibold transition-colors ${
                  deck.reverbEnabled
                    ? "bg-accent-active text-black"
                    : "border border-surface-border text-foreground-muted hover:text-foreground"
                }`}
              >
                {deck.reverbEnabled ? "ON" : "OFF"}
              </button>
            </div>
            <LabeledSlider
              label="Wet"
              min={REVERB_WET_MIN}
              max={REVERB_WET_MAX}
              step={REVERB_WET_STEP}
              value={deck.reverbWet}
              onChange={deck.setReverbWet}
              formatValue={formatPercent}
              ariaLabel={`덱 ${deckId} 리버브 강도`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
