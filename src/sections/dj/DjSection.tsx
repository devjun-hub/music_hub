"use client";

import { useEffect, useState } from "react";
import { DeckPanel } from "./DeckPanel";
import { MixerPanel } from "./MixerPanel";
import { useDjEngine } from "./useDjEngine";

type DjPanelId = "deckA" | "mixer" | "deckB";

const DJ_PANELS: ReadonlyArray<{ id: DjPanelId; label: string }> = [
  { id: "deckA", label: "덱 A" },
  { id: "mixer", label: "믹서" },
  { id: "deckB", label: "덱 B" },
];

/** 클럽 부스 믹서를 옆에서 본 배치: 덱 A | 믹서(크로스페이더) | 덱 B */
export function DjSection() {
  const { deckA, deckB, crossfade, setCrossfade } = useDjEngine();
  const [activePanel, setActivePanel] = useState<DjPanelId>("deckA");
  const [showOrientationBanner, setShowOrientationBanner] = useState(true);

  // 덱 A: A(재생/일시정지) S(큐) · 덱 B: K(재생/일시정지) L(큐) — 드럼 섹션의 1~8과 충돌 없음
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      switch (event.key.toLowerCase()) {
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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deckA, deckB]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-semibold">DJ</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          두 덱에 트랙을 불러와 크로스페이더로 믹스해보세요. 단축키 — 덱 A: A(재생) S(큐), 덱 B:
          K(재생) L(큐)
        </p>
      </div>

      {showOrientationBanner && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-foreground-muted lg:hidden">
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
        className="inline-flex self-start rounded-full border border-surface-border bg-surface p-1 lg:hidden"
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

      <div className="lg:hidden">
        {activePanel === "deckA" && <DeckPanel deckId="A" deck={deckA} />}
        {activePanel === "mixer" && (
          <MixerPanel crossfade={crossfade} onCrossfadeChange={setCrossfade} />
        )}
        {activePanel === "deckB" && <DeckPanel deckId="B" deck={deckB} />}
      </div>

      <div className="hidden gap-4 lg:grid lg:grid-cols-[1fr_16rem_1fr] lg:items-start">
        <DeckPanel deckId="A" deck={deckA} />
        <MixerPanel crossfade={crossfade} onCrossfadeChange={setCrossfade} />
        <DeckPanel deckId="B" deck={deckB} />
      </div>
    </div>
  );
}
