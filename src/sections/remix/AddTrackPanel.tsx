"use client";

import type { ChangeEvent } from "react";
import { useState, useSyncExternalStore } from "react";
import { getGlobalBpm } from "@/audio/context";
import { AUDIO_FILE_ACCEPT, decodeAudioFile } from "@/audio/decodeAudioFile";
import {
  getDrumPatternSnapshot,
  getEmptyDrumPattern,
  hasActiveStep,
  renderDrumLoopToBuffer,
  subscribeDrumPattern,
} from "@/audio/drumLoop";
import { SamplePicker } from "@/components/SamplePicker";
import { formatDuration } from "@/lib/format";
import { useTrackRecorder } from "./useTrackRecorder";
import type { TrackSourceKind } from "./useRemixEngine";

interface AddTrackPanelProps {
  onAddTrack: (name: string, sourceKind: TrackSourceKind, buffer: AudioBuffer) => void;
  /** 다음 녹음 트랙에 붙일 번호(현재 "녹음" 트랙 개수). */
  recordingCount: number;
  /** 다음 드럼 루프 트랙에 붙일 번호(현재 "드럼 루프" 트랙 개수). */
  drumLoopCount: number;
  disabled?: boolean;
}

const FILE_DECODE_ERROR_MESSAGE =
  "이 파일은 불러올 수 없습니다. 지원되지 않는 형식이거나 손상된 파일일 수 있습니다.";

const DRUM_LOOP_RENDER_ERROR_MESSAGE =
  "드럼 루프를 만드는 중 오류가 발생했습니다. 다시 시도해주세요.";

/** 마이크 녹음, 오디오 파일, 또는 드럼 섹션의 현재 패턴으로 새 트랙을 추가한다. */
export function AddTrackPanel({
  onAddTrack,
  recordingCount,
  drumLoopCount,
  disabled,
}: AddTrackPanelProps) {
  const [fileError, setFileError] = useState<string | null>(null);
  const [isRenderingDrumLoop, setIsRenderingDrumLoop] = useState(false);
  const [drumLoopError, setDrumLoopError] = useState<string | null>(null);

  const drumPattern = useSyncExternalStore(
    subscribeDrumPattern,
    getDrumPatternSnapshot,
    getEmptyDrumPattern,
  );
  const canAddDrumLoop = hasActiveStep(drumPattern);

  const recorder = useTrackRecorder((buffer) => {
    onAddTrack(`녹음 ${recordingCount + 1}`, "recording", buffer);
  });

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    setFileError(null);

    for (const file of files) {
      try {
        const audioBuffer = await decodeAudioFile(file);
        onAddTrack(file.name, "upload", audioBuffer);
      } catch {
        setFileError(FILE_DECODE_ERROR_MESSAGE);
      }
    }
  };

  const handleAddDrumLoop = async () => {
    setDrumLoopError(null);
    setIsRenderingDrumLoop(true);
    try {
      const buffer = await renderDrumLoopToBuffer(getDrumPatternSnapshot(), getGlobalBpm());
      onAddTrack(`드럼 루프 ${drumLoopCount + 1}`, "drumLoop", buffer);
    } catch {
      setDrumLoopError(DRUM_LOOP_RENDER_ERROR_MESSAGE);
    } finally {
      setIsRenderingDrumLoop(false);
    }
  };

  const { status, elapsedMs, errorMessage } = recorder.state;
  const isRecording = status === "recording";
  const isBusy = status === "requesting-permission" || status === "processing";

  const recordLabel = (() => {
    if (isRecording) return `녹음 중지 · ${formatDuration(elapsedMs)}`;
    if (status === "requesting-permission") return "권한 요청 중…";
    if (status === "processing") return "처리 중…";
    return "마이크로 녹음 추가";
  })();

  return (
    <div className="space-y-2 rounded-lg border border-surface-border bg-surface p-3">
      <h2 className="text-sm font-semibold text-foreground-muted">트랙 추가</h2>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => (isRecording ? recorder.stop() : void recorder.start())}
          disabled={disabled || isBusy}
          aria-pressed={isRecording}
          className={`min-h-11 flex-1 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 ${
            isRecording
              ? "animate-pulse bg-accent-record text-white"
              : "border border-surface-border text-foreground hover:border-foreground-muted"
          }`}
        >
          {recordLabel}
        </button>
        <label
          className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-full border border-surface-border text-sm font-semibold text-foreground transition-colors hover:border-foreground-muted ${
            disabled ? "pointer-events-none opacity-50" : ""
          }`}
        >
          오디오 파일 추가
          <input
            type="file"
            accept={AUDIO_FILE_ACCEPT}
            multiple
            disabled={disabled}
            onChange={(event) => void handleFileChange(event)}
            className="sr-only"
          />
        </label>
        <button
          type="button"
          onClick={() => void handleAddDrumLoop()}
          disabled={disabled || !canAddDrumLoop || isRenderingDrumLoop}
          className="min-h-11 flex-1 rounded-full border border-surface-border text-sm font-semibold text-foreground transition-colors hover:border-foreground-muted disabled:opacity-50"
        >
          {isRenderingDrumLoop ? "렌더링 중…" : "드럼 루프 추가"}
        </button>
      </div>
      {status === "error" && errorMessage && (
        <p role="alert" className="text-sm text-accent-record">
          {errorMessage}
        </p>
      )}
      {fileError && (
        <p role="alert" className="text-sm text-accent-record">
          {fileError}
        </p>
      )}
      {drumLoopError && (
        <p role="alert" className="text-sm text-accent-record">
          {drumLoopError}
        </p>
      )}
      {!canAddDrumLoop && !disabled && (
        <p className="text-sm text-foreground-muted">
          드럼 섹션에서 패턴을 만들면 여기서 루프로 추가할 수 있습니다.
        </p>
      )}
      <SamplePicker
        onSelect={(name, buffer) => onAddTrack(name, "sample", buffer)}
        disabled={disabled}
      />
    </div>
  );
}
