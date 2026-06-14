"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";
import { AUDIO_FILE_ACCEPT, decodeAudioFile } from "@/audio/decodeAudioFile";
import { SamplePicker } from "@/components/SamplePicker";
import { formatDuration } from "@/lib/format";
import { useVocalRecorder } from "./useVocalRecorder";
import type { CellKind } from "./useRecordEngine";

interface AddCellPanelProps {
  onAddCell: (name: string, kind: CellKind, buffer: AudioBuffer) => void;
  /** 다음 보컬 셀에 붙일 번호(현재 보컬 셀 개수). */
  vocalCount: number;
  disabled?: boolean;
}

const FILE_DECODE_ERROR_MESSAGE =
  "이 파일은 불러올 수 없습니다. 지원되지 않는 형식이거나 손상된 파일일 수 있습니다.";

/** 음원 파일 업로드/무료 샘플(음원 셀) 또는 마이크 녹음(보컬 셀)으로 새 셀을 추가한다. */
export function AddCellPanel({ onAddCell, vocalCount, disabled }: AddCellPanelProps) {
  const [fileError, setFileError] = useState<string | null>(null);

  const recorder = useVocalRecorder((buffer) => {
    onAddCell(`보컬 ${vocalCount + 1}`, "vocal", buffer);
  });

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    setFileError(null);

    for (const file of files) {
      try {
        const audioBuffer = await decodeAudioFile(file);
        onAddCell(file.name, "source", audioBuffer);
      } catch {
        setFileError(FILE_DECODE_ERROR_MESSAGE);
      }
    }
  };

  const { status, elapsedMs, errorMessage } = recorder.state;
  const isRecording = status === "recording";
  const isBusy = status === "requesting-permission" || status === "processing";

  const recordLabel = (() => {
    if (isRecording) return `보컬 녹음 중지 · ${formatDuration(elapsedMs)}`;
    if (status === "requesting-permission") return "권한 요청 중…";
    if (status === "processing") return "처리 중…";
    return "보컬 녹음";
  })();

  return (
    <div className="space-y-2 rounded-lg border border-surface-border bg-surface p-3">
      <h2 className="text-sm font-semibold text-foreground-muted">셀 추가</h2>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label
          className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-full border border-surface-border text-sm font-semibold text-foreground transition-colors hover:border-foreground-muted ${
            disabled ? "pointer-events-none opacity-50" : ""
          }`}
        >
          음원 불러오기
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
      <SamplePicker
        onSelect={(name, buffer) => onAddCell(name, "sample", buffer)}
        disabled={disabled}
      />
    </div>
  );
}
