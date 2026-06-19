"use client";

import { useCallback, useEffect, useState } from "react";
import { DJ_FX_PADS, type DjFxPadId } from "@/lib/constants";
import { DeckPanel } from "./DeckPanel";
import { FxPadBank } from "./FxPadBank";
import { MixerPanel } from "./MixerPanel";
import { useDjEngine } from "./useDjEngine";

type DjPanelId = "deckA" | "mixer" | "deckB";

const DJ_PANELS: ReadonlyArray<{ id: DjPanelId; label: string }> = [
  { id: "deckA", label: "덱 A" },
  { id: "mixer", label: "믹서" },
  { id: "deckB", label: "덱 B" },
];

/** FX 패드 키보드 단축키(z/x/c/v) → 패드 ID */
const FX_PAD_KEY_TO_ID = new Map<string, DjFxPadId>(DJ_FX_PADS.map((pad) => [pad.key, pad.id]));

const INITIAL_FX_HIT_COUNTS = Object.fromEntries(
  DJ_FX_PADS.map((pad) => [pad.id, 0]),
) as Record<DjFxPadId, number>;

/** 클럽 부스 믹서를 옆에서 본 배치: 덱 A | 믹서(크로스페이더) | 덱 B */
export function DjSection() {
  const [mounted, setMounted] = useState(false);
  const { deckA, deckB, crossfade, setCrossfade, triggerFxPad, getMasterLevel } = useDjEngine();
  const [activePanel, setActivePanel] = useState<DjPanelId>("deckA");
  const [showOrientationBanner, setShowOrientationBanner] = useState(true);
  const [fxHitCounts, setFxHitCounts] =
    useState<Record<DjFxPadId, number>>(INITIAL_FX_HIT_COUNTS);
  const [fxOpen, setFxOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFxPad = useCallback(
    (id: DjFxPadId) => {
      triggerFxPad(id);
      setFxHitCounts((prev) => ({ ...prev, [id]: prev[id] + 1 }));
    },
    [triggerFxPad],
  );

  // 덱 A: A(재생/일시정지) S(큐) · 덱 B: K(재생/일시정지) L(큐) · FX 패드: Z/X/C/V — 1~8과 충돌 없음
  useEffect(() => {
    if (!mounted) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      const key = event.key.toLowerCase();
      switch (key) {
        case "a":
          deckA.togglePlay();
          break;
        case "s":
          deckA.cue();
          break;
        case "k":
          deckB.togglePlay();
          break;
        case "l":
          deckB.cue();
          break;
        default: {
          const fxId = FX_PAD_KEY_TO_ID.get(key);
          if (fxId) handleFxPad(fxId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deckA, deckB, handleFxPad, mounted]);

  if (!mounted) {
    return (
      <div className="mx-auto flex h-full w-full items-center justify-center p-8 text-foreground-muted font-semibold">
        DJ 모듈 로딩 중...
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full flex-col gap-3 p-3 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 flex-none">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--primary)", textShadow: "0 0 12px var(--primary-glow)" }}
          >
            DJ
          </h1>
          <p className="mt-1 text-sm text-foreground-muted landscape:max-md:hidden">
            두 덱에 트랙을 불러와 크로스페이더로 믹스해보세요.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-foreground-muted/70 landscape:max-md:hidden">
          <span>
            <kbd className="rounded border border-surface-border px-1 font-mono">A</kbd>{" "}
            <kbd className="rounded border border-surface-border px-1 font-mono">S</kbd> 덱 A 재생/큐
          </span>
          <span>
            <kbd className="rounded border border-surface-border px-1 font-mono">K</kbd>{" "}
            <kbd className="rounded border border-surface-border px-1 font-mono">L</kbd> 덱 B 재생/큐
          </span>
        </div>
      </div>

      {showOrientationBanner && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-foreground-muted landscape:hidden lg:hidden flex-none">
          <span>가로 모드에서 더 편하게 사용할 수 있어요.</span>
          <button
            type="button"
            onClick={() => setShowOrientationBanner(false)}
            aria-label="안내 닫기"
            className="shrink-0 rounded-full px-2 text-base text-foreground-muted transition-colors hover:text-foreground"
          >
            ×
          </button>
        </div>
      )}

      <div
        role="group"
        aria-label="DJ 패널 선택"
        className="inline-flex self-start rounded-full border border-surface-border bg-surface p-1 landscape:hidden lg:hidden flex-none"
      >
        {DJ_PANELS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={activePanel === id}
            onClick={() => setActivePanel(id)}
            className={`min-h-9 rounded-full px-4 text-sm font-medium transition-colors ${
              activePanel === id
                ? "bg-accent-active text-black"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 모바일 세로 모드 */}
      <div className="flex-1 overflow-y-auto pr-1 landscape:hidden lg:hidden">
        {activePanel === "deckA" && <DeckPanel deckId="A" deck={deckA} />}
        {activePanel === "mixer" && (
          <MixerPanel
            crossfade={crossfade}
            onCrossfadeChange={setCrossfade}
            getMasterLevel={getMasterLevel}
            deckA={deckA}
            deckB={deckB}
          />
        )}
        {activePanel === "deckB" && <DeckPanel deckId="B" deck={deckB} />}
      </div>

      {/* 가로 모드 및 데스크탑 3컬럼 */}
      <div className="hidden landscape:grid lg:grid grid-cols-[1fr_12.5rem_1fr] lg:grid-cols-[1fr_16rem_1fr] gap-3 items-stretch flex-1 min-h-0 overflow-hidden">
        <div className="overflow-y-auto h-full pr-1 min-h-0">
          <DeckPanel deckId="A" deck={deckA} />
        </div>
        <div className="overflow-y-auto h-full pr-1 min-h-0">
          <MixerPanel
            crossfade={crossfade}
            onCrossfadeChange={setCrossfade}
            getMasterLevel={getMasterLevel}
            deckA={deckA}
            deckB={deckB}
          />
        </div>
        <div className="overflow-y-auto h-full pr-1 min-h-0">
          <DeckPanel deckId="B" deck={deckB} />
        </div>
      </div>

      {/* FX 패드 뱅크 토글 */}
      <div className="flex-none mt-1">
        <button
          type="button"
          onClick={() => setFxOpen(!fxOpen)}
          aria-expanded={fxOpen}
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-surface-border text-xs font-semibold text-foreground-muted transition-colors hover:border-foreground-muted hover:text-foreground"
        >
          <span>FX 패드 {fxOpen ? "닫기" : "열기"}</span>
        </button>
        {fxOpen && (
          <div className="mt-2 overflow-y-auto max-h-[160px] pr-1">
            <FxPadBank hitCounts={fxHitCounts} onTrigger={handleFxPad} />
          </div>
        )}
      </div>
    </div>
  );
}
