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

const FX_PAD_GROUPS: ReadonlyArray<{
  label: string;
  ids: readonly DjFxPadId[];
}> = [
  { label: "즉각 효과", ids: ["airhorn", "siren", "riser", "impact"] },
  { label: "텍스처 빌드", ids: ["spinback", "reversecymbal", "stutter", "bassroar"] },
  { label: "드롭 분위기", ids: ["foghorn", "scratch", "laser", "explosion"] },
  { label: "빌드업 전환", ids: ["snareroll", "downsweep", "wobble", "clapbomb"] },
  { label: "퍼포먼스", ids: ["ravehorn", "phasersweep", "ricochet", "reversekick"] },
];

function Pad({ pad, hitCount, onTrigger }: PadProps) {
  const isFlashing = usePadFlash(hitCount);

  return (
    <button
      type="button"
      onClick={() => onTrigger(pad.id)}
      aria-label={`${pad.label} 드롭 FX (단축키 ${pad.key.toUpperCase()})`}
      className="flex min-h-14 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-xl border-2 transition-all duration-75 active:scale-95"
      style={{
        borderColor: isFlashing ? "var(--accent-active)" : "var(--glass-border)",
        background: isFlashing ? "var(--primary-dim)" : "var(--glass-bg)",
        boxShadow: isFlashing ? "0 0 16px var(--primary-glow)" : "none",
        transform: isFlashing ? "scale(0.96)" : undefined,
      }}
    >
      <span className="text-sm font-semibold">{pad.label}</span>
      <span className="font-mono text-xs uppercase text-foreground-muted">{pad.key}</span>
    </button>
  );
}

const FX_PAD_MAP = new Map(DJ_FX_PADS.map((p) => [p.id, p]));

/** 클럽 DJ FX 패드 20종 — 카테고리별 그룹으로 표시, 마스터 버스에 직접 적용된다. */
export function FxPadBank({ hitCounts, onTrigger }: FxPadBankProps) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}
    >
      <h2 className="mb-3 text-sm font-semibold text-foreground-muted">FX 패드</h2>
      <div className="space-y-3">
        {FX_PAD_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground-muted/50">
              {group.label}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {group.ids.map((id) => {
                const pad = FX_PAD_MAP.get(id);
                if (!pad) return null;
                return (
                  <Pad key={pad.id} pad={pad} hitCount={hitCounts[pad.id]} onTrigger={onTrigger} />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
