"use client";

import { useEffect, useRef, useState } from "react";

/** FX 패드 타격 플래시 지속 시간(ms) */
const FLASH_DURATION_MS = 120;

/**
 * hitCount가 증가할 때마다 일정 시간 동안 true를 반환한다.
 * 클릭/터치와 키보드 단축키 입력 모두에서 동일한 시각 피드백을 주기 위해 사용한다.
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
