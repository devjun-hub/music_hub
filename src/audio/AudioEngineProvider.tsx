"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { setGlobalBpm, setMasterVolume, unlockAudioContext } from "./context";
import { DEFAULT_BPM, DEFAULT_MASTER_VOLUME } from "@/lib/constants";

interface AudioEngineContextValue {
  /** AudioContext가 사용자 제스처로 언락되었는지 여부 */
  isUnlocked: boolean;
  /** 사용자 제스처 핸들러 안에서 호출해 AudioContext를 언락한다 */
  unlock: () => Promise<void>;
  /** 전역 BPM (드럼/DJ 등 Transport 사용 섹션이 공유) */
  bpm: number;
  setBpm: (bpm: number) => void;
  /** 0~1 정규화된 마스터 볼륨 */
  masterVolume: number;
  setMasterVolume: (volume: number) => void;
}

const AudioEngineContext = createContext<AudioEngineContextValue | null>(null);

export function AudioEngineProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [bpm, setBpmState] = useState(DEFAULT_BPM);
  const [masterVolume, setMasterVolumeState] = useState(DEFAULT_MASTER_VOLUME);

  const unlock = useCallback(async () => {
    await unlockAudioContext();
    setGlobalBpm(DEFAULT_BPM);
    setMasterVolume(DEFAULT_MASTER_VOLUME);
    setIsUnlocked(true);
  }, []);

  const setBpm = useCallback((value: number) => {
    setBpmState(value);
    setGlobalBpm(value);
  }, []);

  const setVolume = useCallback((value: number) => {
    setMasterVolumeState(value);
    setMasterVolume(value);
  }, []);

  return (
    <AudioEngineContext.Provider
      value={{
        isUnlocked,
        unlock,
        bpm,
        setBpm,
        masterVolume,
        setMasterVolume: setVolume,
      }}
    >
      {children}
    </AudioEngineContext.Provider>
  );
}

export function useAudioEngine(): AudioEngineContextValue {
  const context = useContext(AudioEngineContext);
  if (!context) {
    throw new Error("useAudioEngine must be used within AudioEngineProvider");
  }
  return context;
}
