"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { createDrumKit, type DrumKit } from "@/audio/drumKit";
import { DRUM_SOUNDS, type DrumSoundId } from "@/lib/constants";

type HitCounts = Record<DrumSoundId, number>;

function createInitialHitCounts(): HitCounts {
  return Object.fromEntries(DRUM_SOUNDS.map((sound) => [sound.id, 0])) as HitCounts;
}

/**
 * Tone.js 신스 기반 드럼 키트를 생성/정리하고, 패드·시퀀서에서 공용으로 쓰는
 * trigger 함수와 히트 카운터(시각 피드백용)를 제공한다.
 */
export function useDrumKit() {
  const kitRef = useRef<DrumKit | null>(null);
  const [hitCounts, setHitCounts] = useState<HitCounts>(createInitialHitCounts);

  useEffect(() => {
    const kit = createDrumKit();
    kitRef.current = kit;
    return () => {
      kit.dispose();
      kitRef.current = null;
    };
  }, []);

  /**
   * 사운드를 재생한다. time이 주어지면(시퀀서 재생) 시각 피드백도
   * Tone.Draw로 같은 오디오 시각에 맞춰 갱신한다. 없으면(라이브 연주) 즉시 갱신한다.
   */
  const trigger = useCallback((id: DrumSoundId, time?: number) => {
    kitRef.current?.trigger(id, time);

    const flash = () => setHitCounts((prev) => ({ ...prev, [id]: prev[id] + 1 }));
    if (time === undefined) {
      flash();
    } else {
      Tone.getDraw().schedule(flash, time);
    }
  }, []);

  return { trigger, hitCounts };
}
