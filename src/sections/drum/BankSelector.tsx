"use client";

import { hasActiveStep, type Pattern } from "@/audio/drumLoop";
import { DRUM_BANK_IDS, type DrumBankId } from "@/lib/constants";

interface BankSelectorProps {
  banks: Record<DrumBankId, Pattern>;
  activeBank: DrumBankId;
  onChange: (bank: DrumBankId) => void;
}

/** 4개의 패턴 뱅크(A~D)를 전환하는 세그먼트 컨트롤. 내용이 있는 뱅크는 작은 점으로 표시한다. */
export function BankSelector({ banks, activeBank, onChange }: BankSelectorProps) {
  return (
    <div
      role="group"
      aria-label="패턴 뱅크 선택"
      className="inline-flex rounded-full border p-1"
      style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}
    >
      {DRUM_BANK_IDS.map((id) => {
        const isActive = id === activeBank;
        const hasContent = hasActiveStep(banks[id]);
        return (
          <button
            key={id}
            type="button"
            aria-pressed={isActive}
            aria-label={`패턴 뱅크 ${id}${hasContent ? " (내용 있음)" : ""}`}
            onClick={() => onChange(id)}
            className={`relative min-h-9 min-w-11 rounded-full px-3 text-sm font-semibold transition-all ${
              isActive
                ? "bg-accent-active text-black"
                : "text-foreground-muted hover:text-foreground"
            }`}
            style={isActive ? { boxShadow: "0 0 10px var(--primary-glow)" } : {}}
          >
            {id}
            {hasContent && (
              <span
                aria-hidden
                className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${
                  isActive ? "bg-black/50" : "bg-accent-active"
                }`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
