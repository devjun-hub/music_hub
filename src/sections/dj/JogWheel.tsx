"use client";

import { useRef } from "react";

interface JogWheelProps {
  isPlaying: boolean;
  position: number;
  duration: number;
  effectiveBpm: number;
  trackName: string | null;
  onSeek: (seconds: number) => void;
  disabled: boolean;
}

/** 각도를 [-180, 180] 범위로 정규화한다. */
function normalizeAngle(deg: number): number {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

/**
 * CDJ 스타일 조그 휠.
 * - 재생 중 플래터가 BPM 속도로 회전한다 (위치 기반).
 * - 드래그로 스크래치·시크 가능 (4비트 = 1회전 기준).
 * - 가운데 레이블에 트랙명과 BPM 표시.
 */
export function JogWheel({
  isPlaying,
  position,
  duration,
  effectiveBpm,
  trackName,
  onSeek,
  disabled,
}: JogWheelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const scratchRef = useRef<{ startAngle: number; startPos: number } | null>(null);

  // 위치 → 회전각: 1비트 = 1회전 (effectiveBpm 기준)
  const bps = Math.max(effectiveBpm, 1) / 60;
  const rawDeg = position * bps * 360;
  const rotation = ((rawDeg % 360) + 360) % 360;

  const getAngle = (e: React.PointerEvent<SVGSVGElement>): number => {
    const rect = svgRef.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    scratchRef.current = { startAngle: getAngle(e), startPos: position };
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!scratchRef.current) return;
    const angleDelta = normalizeAngle(getAngle(e) - scratchRef.current.startAngle);
    // 4비트(1회전)가 얼마나 많은 초인지 계산
    const secsPerRev = (4 * 60) / Math.max(effectiveBpm, 1);
    const secsDelta = (angleDelta / 360) * secsPerRev;
    const next = Math.max(0, Math.min(duration, scratchRef.current.startPos + secsDelta));
    onSeek(next);
  };

  const handlePointerUp = () => {
    scratchRef.current = null;
  };

  const shortName = trackName
    ? trackName.replace(/\.(mp3|wav|ogg|flac|aac|m4a)$/i, "").slice(0, 18)
    : null;

  const indicatorFill = isPlaying ? "var(--accent-active)" : "#4b5563";

  // 그립 링 눈금 (24개 방사형 선) — 좌표를 정수 반올림해 SSR/client 불일치 방지
  const gripTicks = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * 360) / 24;
    const rad = (angle * Math.PI) / 180;
    const r1 = 100;
    const r2 = 108;
    const round = (n: number) => Math.round(n * 100) / 100;
    return {
      x1: round(112 + r1 * Math.sin(rad)),
      y1: round(112 - r1 * Math.cos(rad)),
      x2: round(112 + r2 * Math.sin(rad)),
      y2: round(112 - r2 * Math.cos(rad)),
    };
  });

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 224 224"
      suppressHydrationWarning
      className={`w-full touch-none select-none ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="slider"
      aria-label="조그 휠 — 드래그로 스크래치/시크"
      aria-valuenow={Math.round(position)}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
    >
      <defs>
        <radialGradient id="platGrad" cx="38%" cy="38%">
          <stop offset="0%" stopColor="#2e2e2e" />
          <stop offset="100%" stopColor="#141414" />
        </radialGradient>
        <radialGradient id="labelGrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#272727" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </radialGradient>
      </defs>

      {/* 외부 고무 그립 링 */}
      <circle cx="112" cy="112" r="111" fill="#0d0d0d" />
      <circle cx="112" cy="112" r="111" fill="none" stroke="#222" strokeWidth="1" />

      {/* 그립 눈금 */}
      {gripTicks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="#1d1d1d" strokeWidth="2.5" strokeLinecap="round" />
      ))}

      {/* 회전하는 플래터 그룹 */}
      <g transform={`rotate(${rotation} 112 112)`}>
        {/* 플래터 표면 */}
        <circle cx="112" cy="112" r="98" fill="url(#platGrad)" />

        {/* 바이닐 그루브 (동심원) */}
        {[90, 82, 74, 66, 58, 50, 42].map((r) => (
          <circle key={r} cx="112" cy="112" r={r} fill="none" stroke="#252525" strokeWidth="0.8" />
        ))}

        {/* 위치 인디케이터 도트 */}
        <circle cx="112" cy="16" r="5.5" style={{ fill: indicatorFill }} />
        {/* 인디케이터 글로우 */}
        {isPlaying && <circle cx="112" cy="16" r="8" style={{ fill: "var(--primary-glow)" }} />}

        {/* 중앙 레이블 영역 */}
        <circle cx="112" cy="112" r="36" fill="url(#labelGrad)" />
        <circle cx="112" cy="112" r="36" fill="none" stroke="#333" strokeWidth="0.5" />

        {/* 스핀들 */}
        <circle cx="112" cy="112" r="5" fill="#3a3a3a" />
        <circle cx="112" cy="112" r="2.5" fill="#222" />
      </g>

      {/* 레이블 텍스트 — 정적 (회전하지 않음) */}
      {shortName ? (
        <>
          <text x="112" y="107" textAnchor="middle" fill="#9ca3af" fontSize="8" fontFamily="system-ui, sans-serif" className="pointer-events-none">
            {shortName}
          </text>
          <text
            x="112"
            y="120"
            textAnchor="middle"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="600"
            style={{ fill: indicatorFill }}
            className="pointer-events-none"
          >
            {effectiveBpm.toFixed(1)}
          </text>
        </>
      ) : (
        <text x="112" y="115" textAnchor="middle" fill="#374151" fontSize="9" fontFamily="system-ui, sans-serif" letterSpacing="0.05em" className="pointer-events-none">
          NO TRACK
        </text>
      )}

      {/* 12시 방향 기준선 (정적) */}
      <line x1="112" y1="4" x2="112" y2="12" stroke="#333" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
