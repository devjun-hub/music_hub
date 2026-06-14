"use client";

import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { isAudioFile } from "@/audio/decodeAudioFile";
import { AUDIO_FILE_REJECTED_MESSAGE } from "@/lib/messages";

interface FileDropZoneProps {
  /** 오디오 파일로 판별된 드롭 파일 목록 */
  onFiles: (files: File[]) => void;
  /** 드롭된 파일 중 오디오로 판별된 것이 하나도 없을 때 */
  onRejected?: (message: string) => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * 자식 영역 전체를 드롭 대상으로 만든다. 드래그 중에는 점선 테두리 오버레이로
 * 즉시 피드백을 주고, 드롭된 파일을 오디오 여부로 1차 필터링해 전달한다.
 */
export function FileDropZone({ onFiles, onRejected, disabled, className, children }: FileDropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    dragCounter.current += 1;
    setIsDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setIsDragActive(false);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    dragCounter.current = 0;
    setIsDragActive(false);

    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;

    const audioFiles = files.filter(isAudioFile);
    if (audioFiles.length === 0) {
      onRejected?.(AUDIO_FILE_REJECTED_MESSAGE);
      return;
    }
    onFiles(audioFiles);
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative ${className ?? ""}`}
    >
      {children}
      {isDragActive && !disabled && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center rounded-xl border-2 border-dashed border-accent-active bg-background/80">
          <p className="text-sm font-semibold text-accent-active">여기에 파일을 놓으세요</p>
        </div>
      )}
    </div>
  );
}
