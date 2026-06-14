"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS } from "@/lib/constants";

/** 4개 섹션 네비게이션. 모바일은 하단 탭바, 데스크탑은 헤더 아래 상단 바. */
export function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="섹션 네비게이션"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-surface-border bg-surface md:static md:border-t-0 md:border-b"
    >
      {SECTIONS.map((section) => {
        const isActive = pathname.startsWith(section.href);
        return (
          <Link
            key={section.id}
            href={section.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex min-h-11 flex-1 items-center justify-center px-2 py-2 text-sm font-medium transition-colors md:flex-none md:px-6 ${
              isActive ? "text-foreground" : "text-foreground-muted hover:text-foreground"
            }`}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
