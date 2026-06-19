"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS } from "@/lib/constants";

/* ── Section icons (inline SVG) ─────────────────── */
function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="9" y1="21" x2="15" y2="21" />
    </svg>
  );
}

function WaveIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12c1.5-3 3-4.5 4.5-4.5S9 9 10.5 12s3 4.5 4.5 4.5S18 15 19.5 12 21 7.5 22 7.5" />
    </svg>
  );
}

function DrumIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </svg>
  );
}

function HeadphonesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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

/** 4개 섹션 네비게이션 — glass morphism, 아이콘 + 라벨, glow 액티브 인디케이터 */
export function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="섹션 네비게이션"
      className="z-30 flex w-full flex-none border-t border-white/[0.07] order-2 md:order-none md:static md:border-t-0 md:border-b"
      style={{
        background: "rgba(9,9,11,0.9)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {SECTIONS.map((section) => {
        const isActive = pathname.startsWith(section.href);
        return (
          <Link
            key={section.id}
            href={section.href}
            aria-current={isActive ? "page" : undefined}
            className="relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded px-2 py-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 md:min-h-[44px] md:flex-row md:gap-2 md:px-6"
            style={{
              color: isActive ? "var(--primary)" : "var(--foreground-muted)",
              background: isActive ? "var(--primary-dim)" : "transparent",
              "--tw-ring-color": "var(--primary)",
              "--tw-ring-offset-color": "var(--background)",
            } as React.CSSProperties}
          >
            {/* Active glow indicator — top on mobile (bottom bar), bottom on desktop (top bar) */}
            {isActive && (
              <span
                aria-hidden
                className="absolute inset-x-4 top-0 h-[2px] rounded-b-full md:top-auto md:bottom-0 md:rounded-b-none md:rounded-t-full"
                style={{
                  background: "var(--primary)",
                  boxShadow: "0 0 8px var(--primary-glow), 0 0 16px var(--primary-glow)",
                }}
              />
            )}

            {/* Icon */}
            <span
              className="transition-all duration-200"
              style={
                isActive
                  ? { filter: "drop-shadow(0 0 6px var(--primary-glow))" }
                  : {}
              }
            >
              {SECTION_ICONS[section.id]}
            </span>

            {/* Label */}
            <span className="text-xs font-medium md:text-sm landscape:max-md:hidden">
              {section.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
