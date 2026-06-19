"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAudioEngine } from "@/audio/AudioEngineProvider";
import { MAX_BPM, MIN_BPM, SECTIONS } from "@/lib/constants";
import { ThemeDialog } from "@/components/ThemeDialog";

function VolumeIcon({ level }: { level: number }) {
  if (level === 0) {
    return (
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    );
  }
  if (level < 0.5) {
    return (
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

const TAP_BUFFER_SIZE = 4;
const TAP_RESET_MS = 2000;

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="9" y1="21" x2="15" y2="21" />
    </svg>
  );
}

function WaveIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12c1.5-3 3-4.5 4.5-4.5S9 9 10.5 12s3 4.5 4.5 4.5S18 15 19.5 12 21 7.5 22 7.5" />
    </svg>
  );
}

function DrumIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </svg>
  );
}

function HeadphonesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z" />
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z" />
    </svg>
  );
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  record:  <MicIcon />,
  remix:   <WaveIcon />,
  drum:    <DrumIcon />,
  dj:      <HeadphonesIcon />,
};

/** 공통 헤더 — glass morphism, BPM/볼륨 전역 컨트롤, 테마 설정 버튼 */
export function Header() {
  const { isUnlocked, bpm, setBpm, masterVolume, setMasterVolume } = useAudioEngine();
  const tapTimes = useRef<number[]>([]);
  const tapResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [themeOpen, setThemeOpen] = useState(false);
  const [volOpen, setVolOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const volRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (volRef.current && !volRef.current.contains(e.target as Node)) {
        setVolOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const clampBpm = (value: number) => Math.min(MAX_BPM, Math.max(MIN_BPM, value));

  const handleBpmInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!Number.isNaN(value)) setBpm(clampBpm(value));
  };

  const adjustBpm = (delta: number) => setBpm(clampBpm(bpm + delta));

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (tapResetTimer.current) clearTimeout(tapResetTimer.current);
    tapResetTimer.current = setTimeout(() => {
      tapTimes.current = [];
    }, TAP_RESET_MS);

    tapTimes.current.push(now);
    if (tapTimes.current.length > TAP_BUFFER_SIZE) tapTimes.current.shift();

    const times = tapTimes.current;
    if (times.length >= 2) {
      const intervals = times.slice(1).map((t, i) => t - times[i]);
      const avg = intervals.reduce((a, b) => a + b) / intervals.length;
      setBpm(clampBpm(Math.round(60000 / avg)));
    }
  }, [setBpm]);

  return (
    <>
      <header
        className="sticky top-0 z-30 flex h-14 items-center gap-3 px-4"
        style={{
          background: "rgba(9,9,11,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Logo + unlock status */}
        <div className="flex items-center gap-2.5">
          <span
            className="text-sm font-semibold tracking-wide"
            style={{ color: "var(--primary)", textShadow: "0 0 12px var(--primary-glow)" }}
          >
            Music Hub
          </span>
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                isUnlocked
                  ? "dot-unlocked"
                  : "bg-foreground-muted/30"
              }`}
              style={isUnlocked ? { background: "var(--primary)" } : {}}
            />
            <span className="hidden text-[11px] text-foreground-muted sm:block">
              {isUnlocked ? "준비됨" : "잠금"}
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* BPM 컨트롤 */}
        <div
          className="flex items-center gap-1 rounded-lg px-2 py-1"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          role="group"
          aria-label="BPM 조절"
        >
          <span className="hidden text-[11px] font-medium tracking-wider text-foreground-muted sm:block">
            BPM
          </span>
          <button
            type="button"
            onClick={() => adjustBpm(-1)}
            aria-label="BPM 1 감소"
            className="flex h-6 w-6 items-center justify-center rounded text-sm text-foreground-muted transition-colors hover:bg-surface-border hover:text-foreground active:scale-95"
          >
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={handleBpmInput}
            aria-label="BPM 값"
            className="w-12 bg-transparent px-1 py-0.5 text-center font-mono text-sm tabular-nums outline-none transition-colors"
            style={{
              color: bpm <= MIN_BPM || bpm >= MAX_BPM ? "var(--accent-record)" : "var(--foreground)",
            }}
          />
          <button
            type="button"
            onClick={() => adjustBpm(1)}
            aria-label="BPM 1 증가"
            className="flex h-6 w-6 items-center justify-center rounded text-sm text-foreground-muted transition-colors hover:bg-surface-border hover:text-foreground active:scale-95"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleTap}
            aria-label="탭으로 BPM 측정"
            className="ml-0.5 rounded px-2 py-0.5 text-[11px] font-bold tracking-wider text-foreground-muted transition-all hover:bg-surface-border hover:text-foreground active:scale-95"
          >
            TAP
          </button>
        </div>

        {/* 마스터 볼륨 — 데스크탑: 슬라이더 인라인 / 모바일: 아이콘 버튼 + 팝오버 */}
        <label className="hidden items-center gap-2 sm:flex" aria-label="마스터 볼륨">
          <span className="text-[11px] font-medium text-foreground-muted">VOL</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={masterVolume}
            onChange={(e) => setMasterVolume(Number(e.target.value))}
            className="w-20"
            aria-label="마스터 볼륨 슬라이더"
          />
          <span className="w-8 text-right font-mono text-[11px] tabular-nums text-foreground-muted">
            {Math.round(masterVolume * 100)}%
          </span>
        </label>

        {/* 모바일 볼륨 컨트롤 */}
        <div ref={volRef} className="relative sm:hidden">
          <button
            type="button"
            onClick={() => setVolOpen((v) => !v)}
            aria-label={`마스터 볼륨 ${Math.round(masterVolume * 100)}%`}
            aria-expanded={volOpen}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-all hover:text-foreground active:scale-95"
            style={{
              background: volOpen ? "var(--primary-dim)" : "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: volOpen ? "var(--primary)" : undefined,
            }}
          >
            <VolumeIcon level={masterVolume} />
          </button>
          {volOpen && (
            <div
              className="absolute right-0 top-10 z-50 flex flex-col gap-2 rounded-xl p-3"
              style={{
                background: "rgba(9,9,11,0.95)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.1)",
                width: "160px",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-foreground-muted">마스터 볼륨</span>
                <span className="font-mono text-[11px] tabular-nums text-foreground-muted">
                  {Math.round(masterVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={masterVolume}
                onChange={(e) => setMasterVolume(Number(e.target.value))}
                className="w-full"
                aria-label="마스터 볼륨 슬라이더"
              />
            </div>
          )}
        </div>

        {/* 테마 설정 버튼 */}
        <button
          type="button"
          onClick={() => setThemeOpen(true)}
          aria-label="테마 설정"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-all hover:text-foreground active:scale-95 flex-none"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <GearIcon />
        </button>

        {/* 메뉴 햄버거 버튼 */}
        <div ref={menuRef} className="relative flex-none">
          <button
            type="button"
            onClick={() => setMenuOpen((m) => !m)}
            aria-label="메뉴 선택"
            aria-expanded={menuOpen}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-all hover:text-foreground active:scale-95"
            style={{
              background: menuOpen ? "var(--primary-dim)" : "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: menuOpen ? "var(--primary)" : undefined,
            }}
          >
            <MenuIcon />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-10 z-50 flex flex-col gap-1 rounded-xl p-2 shadow-2xl"
              style={{
                background: "rgba(9,9,11,0.95)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.1)",
                minWidth: "150px",
              }}
            >
              {SECTIONS.map((section) => {
                const isActive = pathname.startsWith(section.href);
                return (
                  <Link
                    key={section.id}
                    href={section.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all"
                    style={{
                      color: isActive ? "var(--primary)" : "var(--foreground-muted)",
                      background: isActive ? "var(--primary-dim)" : "transparent",
                    }}
                  >
                    <span className="flex-none">{SECTION_ICONS[section.id]}</span>
                    <span>{section.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <ThemeDialog open={themeOpen} onClose={() => setThemeOpen(false)} />
    </>
  );
}
