"use client";

import { useEffect, useRef } from "react";
import { DJ_MASTER_LIMITER_THRESHOLD_DB } from "@/lib/constants";

interface MasterMeterProps {
  getLevel: () => number;
  /** 리미터가 걸리는 임계값(dB). 미터에 기준선으로 표시한다. */
  thresholdDb?: number;
}

/** 0~1 정규화 레벨에서 초록 구간이 끝나는 지점 */
const GREEN_MAX = 0.7;

function dbToNormal(db: number): number {
  return Math.pow(10, db / 20);
}

function colorForLevel(level: number, redFrom: number): string {
  if (level >= redFrom) return "var(--color-accent-record)";
  if (level >= GREEN_MAX) return "#facc15";
  return "var(--color-accent-active)";
}

/**
 * 마스터 출력 레벨미터. 자체 requestAnimationFrame 루프로 getLevel()(0~1)을 읽어
 * ref의 style에 직접 반영한다(React state 미사용 → 매 프레임 리렌더 방지).
 * 레벨에 따라 초록/노랑/빨강으로 색상이 바뀌고, 리미터 임계값을 기준선으로 표시한다.
 */
export function MasterMeter({
  getLevel,
  thresholdDb = DJ_MASTER_LIMITER_THRESHOLD_DB,
}: MasterMeterProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const redFrom = dbToNormal(thresholdDb);

  useEffect(() => {
    let frame: number;
    const tick = () => {
      const level = Math.min(Math.max(getLevel(), 0), 1);
      const bar = barRef.current;
      if (bar) {
        bar.style.width = `${level * 100}%`;
        bar.style.backgroundColor = colorForLevel(level, redFrom);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [getLevel, redFrom]);

  return (
    <div className="space-y-1">
      <span className="text-xs font-semibold text-foreground-muted">마스터 레벨</span>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-background">
        <div ref={barRef} className="h-full w-0" />
        <div
          className="absolute inset-y-0 w-px bg-foreground-muted"
          style={{ left: `${redFrom * 100}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
