"use client";

import { useState } from "react";
import { renderSample } from "@/audio/sampleLibrary";
import { SAMPLE_LIBRARY, type SampleId } from "@/lib/constants";
import { barsToMs, formatDuration } from "@/lib/format";
import { SAMPLE_RENDER_ERROR_MESSAGE } from "@/lib/messages";

interface SamplePickerProps {
  onSelect: (name: string, buffer: AudioBuffer) => void;
  disabled?: boolean;
}

/** 내장 무료 샘플 목록을 펼쳐 보여주고, 선택 시 오프라인 렌더링해 전달한다. */
export function SamplePicker({ onSelect, disabled }: SamplePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<SampleId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (id: SampleId, name: string) => {
    setError(null);
    setLoadingId(id);
    try {
      const buffer = await renderSample(id);
      onSelect(name, buffer);
      setIsOpen(false);
    } catch {
      setError(SAMPLE_RENDER_ERROR_MESSAGE);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-expanded={isOpen}
        className="min-h-11 w-full rounded-full border border-dashed border-surface-border text-sm text-foreground-muted transition-colors hover:border-foreground-muted hover:text-foreground disabled:opacity-50"
      >
        무료 샘플 {isOpen ? "닫기" : "둘러보기"}
      </button>
      {isOpen && (
        <div className="space-y-1 rounded-lg border border-surface-border p-2">
          {SAMPLE_LIBRARY.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => void handleSelect(sample.id, sample.name)}
              disabled={loadingId !== null}
              className="flex min-h-11 w-full flex-col items-start rounded px-2 py-1 text-left transition-colors hover:bg-surface-border disabled:opacity-50"
            >
              <span className="text-sm font-medium text-foreground">{sample.name}</span>
              <span className="text-xs text-foreground-muted">
                {loadingId === sample.id ? (
                  "렌더링 중…"
                ) : (
                  <>
                    {sample.description} ·{" "}
                    <span className="font-mono tabular-nums">{sample.bpm} BPM</span> ·{" "}
                    <span className="font-mono tabular-nums">
                      {formatDuration(barsToMs(sample.bpm, sample.bars))}
                    </span>
                  </>
                )}
              </span>
            </button>
          ))}
          {error && (
            <p role="alert" className="text-sm text-accent-record">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
