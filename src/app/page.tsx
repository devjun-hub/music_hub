"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** 루트 진입 시 우선순위가 가장 높은 녹음 섹션으로 이동한다. */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/record");
  }, [router]);

  return null;
}
