"use client";

import { DJ_FX_PADS, type DjFxPadId } from "@/lib/constants";
import { usePadFlash } from "./usePadFlash";

interface FxPadBankProps {
  hitCounts: Record<DjFxPadId, number>;
  onTrigger: (id: DjFxPadId) => void;
}

interface PadProps {
  pad: (typeof DJ_FX_PADS)[number];
  hitCount: number;
  onTrigger: (id: DjFxPadId) => void;
}

function Pad({ pad, hitCount, onTrigger }: PadProps) {
  const isFlashing = usePadFlash(hitCount);

  return (
    <button
      type="button"
      onClick={() => onTrigger(pad.id)}
      aria-label={`${pad.label} 드롭 FX (단축키 ${pad.key.toUpperCase()})`}
      className={`flex min-h-14 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-xl border-2 transition active:scale-95 ${
        isFlashing
          ? "border-accent-active bg-accent-active/30"
          : "border-surface-border bg-background hover:border-foreground-muted"
      }`}
    >
      <span className="text-sm font-semibold">{pad.label}</span>
      <span className="font-mono text-xs uppercase text-foreground-muted">{pad.key}</span>
    </button>
  );
}

/** 페스티벌 드롭 FX 패드 4종 — 크로스페이더 위치와 무관하게 마스터 버스에 직접 들린다. */
export function FxPadBank({ hitCounts, onTrigger }: FxPadBankProps) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface p-3">
      <h2 className="mb-2 text-sm font-semibold text-foreground-muted">FX 패드</h2>
      <div className="grid grid-cols-4 gap-2">
        {DJ_FX_PADS.map((pad) => (
          <Pad key={pad.id} pad={pad} hitCount={hitCounts[pad.id]} onTrigger={onTrigger} />
        ))}
      </div>
    </div>
  );
}
