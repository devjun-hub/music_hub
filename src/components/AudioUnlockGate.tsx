"use client";

import { useAudioEngine } from "@/audio/AudioEngineProvider";

/**
 * AudioContext는 사용자 제스처 이후에만 시작할 수 있다.
 * 언락 전까지 화면을 덮어 첫 클릭/터치를 받아 unlock()을 호출한다.
 */
export function AudioUnlockGate() {
  const { isUnlocked, unlock } = useAudioEngine();

  if (isUnlocked) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Music Hub</h1>
        <p className="text-foreground-muted">
          오디오를 사용하려면 화면을 눌러 시작하세요.
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          void unlock();
        }}
        className="min-h-11 min-w-44 rounded-full bg-accent-active px-8 py-3 text-lg font-semibold text-black transition-transform active:scale-95"
      >
        시작하기
      </button>
    </div>
  );
}
