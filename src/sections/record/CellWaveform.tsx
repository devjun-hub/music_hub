"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

interface CellWaveformProps {
  url: string;
  /** 전역 Transport 재생 위치 (초) */
  position: number;
  duration: number;
}

/**
 * 셀의 파형을 표시한다. 자체 재생 버튼은 없으며,
 * 전역 Transport 위치(position)에 맞춰 진행 커서만 동기화한다.
 */
export function CellWaveform({ url, position, duration }: CellWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const wavesurfer = WaveSurfer.create({
      container,
      url,
      height: 64,
      waveColor: "#52525b",
      progressColor: "#22c55e",
      cursorColor: "#f4f4f5",
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      interact: false,
    });

    wavesurferRef.current = wavesurfer;
    setIsReady(false);
    wavesurfer.on("ready", () => setIsReady(true));

    return () => {
      wavesurfer.destroy();
      wavesurferRef.current = null;
    };
  }, [url]);

  useEffect(() => {
    if (!isReady) return;
    wavesurferRef.current?.setTime(Math.min(position, duration));
  }, [isReady, position, duration]);

  return (
    <div className="overflow-hidden rounded-md border border-surface-border bg-surface">
      <div ref={containerRef} />
    </div>
  );
}
