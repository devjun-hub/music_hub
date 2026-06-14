"use client";

import { useState } from "react";
import { encodeAudioBufferToMp3 } from "@/audio/mp3Encoder";
import { audioBufferToWavBlob } from "@/audio/wav";

interface DownloadPanelProps {
  audioBuffer: AudioBuffer;
  /** 다운로드 파일명 접두사 (예: "recording", "mix") */
  filenamePrefix?: string;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** 오디오 결과를 MP3(워커 인코딩, 진행률 표시) 또는 WAV로 내려받는다. */
export function DownloadPanel({ audioBuffer, filenamePrefix = "recording" }: DownloadPanelProps) {
  const [isEncoding, setIsEncoding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleMp3Download = async () => {
    setIsEncoding(true);
    setProgress(0);
    setError(null);
    try {
      const blob = await encodeAudioBufferToMp3(audioBuffer, setProgress);
      downloadBlob(blob, `${filenamePrefix}.mp3`);
    } catch {
      setError("MP3 변환에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsEncoding(false);
    }
  };

  const handleWavDownload = () => {
    downloadBlob(audioBufferToWavBlob(audioBuffer), `${filenamePrefix}.wav`);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => void handleMp3Download()}
          disabled={isEncoding}
          className="min-h-11 flex-1 rounded-full bg-accent-active px-6 text-sm font-semibold text-black transition-opacity disabled:opacity-60"
        >
          {isEncoding ? `MP3 변환 중… ${Math.round(progress * 100)}%` : "MP3 다운로드"}
        </button>
        <button
          type="button"
          onClick={handleWavDownload}
          className="min-h-11 flex-1 rounded-full border border-surface-border px-6 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
        >
          WAV 다운로드
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-accent-record">
          {error}
        </p>
      )}
    </div>
  );
}
