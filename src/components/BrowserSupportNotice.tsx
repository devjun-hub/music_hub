"use client";

import { useSyncExternalStore } from "react";

function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): boolean {
  const hasAudioContext = "AudioContext" in window || "webkitAudioContext" in window;
  const hasMediaDevices = Boolean(navigator.mediaDevices?.getUserMedia);
  return !hasAudioContext || !hasMediaDevices;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * AudioContext / getUserMedia를 지원하지 않는 브라우저에서
 * 차단 화면 대신 안내 배너를 보여준다.
 */
export function BrowserSupportNotice() {
  const isUnsupported = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!isUnsupported) return null;

  return (
    <div
      role="alert"
      className="border-b border-accent-record/40 bg-accent-record/10 px-4 py-2 text-center text-sm text-accent-record"
    >
      이 브라우저는 일부 오디오 기능을 지원하지 않을 수 있습니다. 최신 Chrome 또는 Safari 사용을
      권장합니다.
    </div>
  );
}
