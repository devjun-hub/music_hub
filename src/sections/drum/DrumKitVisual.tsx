"use client";

import { DRUM_SOUNDS, type DrumSoundId } from "@/lib/constants";
import { usePadFlash } from "./usePadFlash";

interface DrumKitVisualProps {
  hitCounts: Record<DrumSoundId, number>;
  onTrigger: (id: DrumSoundId) => void;
}

type KitPieceLayout =
  | { id: DrumSoundId; shape: "circle"; cx: number; cy: number; r: number }
  | { id: DrumSoundId; shape: "ellipse"; cx: number; cy: number; rx: number; ry: number };

/** 연주자 시점에서 본 드럼 키트 배치. 좌표는 viewBox(0 0 360 340) 기준. */
const KIT_LAYOUT: KitPieceLayout[] = [
  { id: "hihatOpen", shape: "ellipse", cx: 52, cy: 50, rx: 46, ry: 23 },
  { id: "hihatClosed", shape: "ellipse", cx: 52, cy: 112, rx: 44, ry: 22 },
  { id: "tomHigh", shape: "circle", cx: 152, cy: 48, r: 34 },
  { id: "tomMid", shape: "circle", cx: 228, cy: 54, r: 38 },
  { id: "crash", shape: "ellipse", cx: 312, cy: 46, rx: 42, ry: 22 },
  { id: "snare", shape: "circle", cx: 138, cy: 178, r: 44 },
  { id: "tomLow", shape: "circle", cx: 268, cy: 168, r: 48 },
  { id: "kick", shape: "circle", cx: 198, cy: 268, r: 58 },
];

interface KitPieceProps {
  layout: KitPieceLayout;
  label: string;
  shortcutKey: string;
  hitCount: number;
  onTrigger: (id: DrumSoundId) => void;
}

function KitPiece({ layout, label, shortcutKey, hitCount, onTrigger }: KitPieceProps) {
  const isFlashing = usePadFlash(hitCount);
  const fillClass = isFlashing
    ? "fill-accent-active/40 stroke-accent-active"
    : "fill-background stroke-surface-border";

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${label} (단축키 ${shortcutKey})`}
      onClick={() => onTrigger(layout.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onTrigger(layout.id);
        }
      }}
      className="cursor-pointer touch-manipulation outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      {layout.shape === "circle" ? (
        <circle
          cx={layout.cx}
          cy={layout.cy}
          r={layout.r}
          strokeWidth={2}
          className={`transition-colors ${fillClass}`}
        />
      ) : (
        <ellipse
          cx={layout.cx}
          cy={layout.cy}
          rx={layout.rx}
          ry={layout.ry}
          strokeWidth={2}
          className={`transition-colors ${fillClass}`}
        />
      )}
      <text
        x={layout.cx}
        y={layout.cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={13}
        className="pointer-events-none fill-foreground font-medium select-none"
      >
        {label}
      </text>
    </g>
  );
}

/** 실제 드럼 세트와 비슷한 배치의 SVG 모형. 각 부위를 누르면 해당 사운드가 재생된다. */
export function DrumKitVisual({ hitCounts, onTrigger }: DrumKitVisualProps) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface p-3">
      <svg
        viewBox="0 0 360 340"
        role="group"
        aria-label="드럼 키트 모형"
        className="mx-auto h-auto w-full max-w-md"
      >
        {KIT_LAYOUT.map((layout) => {
          const sound = DRUM_SOUNDS.find((item) => item.id === layout.id);
          if (!sound) return null;
          return (
            <KitPiece
              key={layout.id}
              layout={layout}
              label={sound.shortLabel}
              shortcutKey={sound.key}
              hitCount={hitCounts[layout.id]}
              onTrigger={onTrigger}
            />
          );
        })}
      </svg>
    </div>
  );
}
