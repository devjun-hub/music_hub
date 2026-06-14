"use client";

import { useEffect, useRef, useState } from "react";

/** 패드 타격 플래시 지속 시간(ms) */
const FLASH_DURATION_MS = 120;

/**
 * hitCount가 증가할 때마다 일정 시간 동안 true를 반환한다.
 * 패드 그리드 / 드럼 키트 모형의 타격 시각 피드백에 사용한다.
 */
export function usePadFlash(hitCount: number): boolean {
  const [isFlashing, setIsFlashing] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setIsFlashing(true);
    const timeout = setTimeout(() => setIsFlashing(false), FLASH_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [hitCount]);

  return isFlashing;
}
