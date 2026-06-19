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
        bar.style.height = `${level * 100}%`;
        bar.style.backgroundColor = colorForLevel(level, redFrom);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [getLevel, redFrom]);

  return (
    <div className="flex flex-col items-center gap-1.5 h-full">
      <div className="relative w-2.5 h-28 overflow-hidden rounded bg-black/60 border border-surface-border/50 flex flex-col justify-end">
        <div ref={barRef} className="w-full absolute bottom-0 left-0 right-0 transition-[height,background-color] duration-75" />
        <div
          className="absolute inset-x-0 h-0.5 bg-red-500 opacity-60"
          style={{ bottom: `${redFrom * 100}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
