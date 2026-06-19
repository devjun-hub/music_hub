"use client";

import { useState } from "react";
import { decodeAudioFile } from "@/audio/decodeAudioFile";
import { FileDropZone } from "@/components/FileDropZone";
import { MixRecordPanel } from "@/components/MixRecordPanel";
import { TransportBar } from "@/components/TransportBar";
import { AddCellPanel } from "./AddCellPanel";
import { CellRow } from "./CellRow";
import { useRecordEngine } from "./useRecordEngine";

const DROP_DECODE_ERROR_MESSAGE =
  "이 파일은 불러올 수 없습니다. 지원되지 않는 형식이거나 손상된 파일일 수 있습니다.";

export function RecordSection() {
  const engine = useRecordEngine();
  const [dropError, setDropError] = useState<string | null>(null);
  const isRecordingMix = engine.mixRecording.status === "recording";
  const vocalCount = engine.cells.filter((cell) => cell.kind === "vocal").length;

  const handleDroppedFiles = async (files: File[]) => {
    setDropError(null);
    for (const file of files) {
      try {
        const buffer = await decodeAudioFile(file);
        engine.addCell(file.name, "source", buffer);
      } catch {
        setDropError(DROP_DECODE_ERROR_MESSAGE);
      }
    }
  };

  return (
    <FileDropZone
      onFiles={(files) => void handleDroppedFiles(files)}
      onRejected={setDropError}
      disabled={isRecordingMix}
      className="mx-auto flex h-full w-full flex-col gap-3 p-3 overflow-hidden lg:max-w-none"
    >
      <div>
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--primary)", textShadow: "0 0 12px var(--primary-glow)" }}
        >
          녹음
        </h1>
        <p className="mt-1 text-sm text-foreground-muted landscape:max-md:hidden">
          음원을 불러오고 보컬을 녹음한 뒤, 파형을 보며 에코·리버브·오토튠을 적용해 하나의 믹스로
          내려받으세요.
        </p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-3 lg:flex-row overflow-hidden">
        <div className="flex flex-col gap-3 lg:flex-1 overflow-hidden min-h-0">
          <TransportBar
            isPlaying={engine.isPlaying}
            position={engine.position}
            totalDuration={engine.totalDuration}
            onTogglePlay={engine.togglePlay}
            disabled={isRecordingMix}
          />

          {engine.cells.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-4 rounded-xl border px-6 py-8 text-center flex-1"
              style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)", borderStyle: "dashed" }}
            >
              <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--foreground-muted)", opacity: 0.4 }}>
                <rect x="8" y="14" width="32" height="24" rx="3" />
                <path d="M20 22v8M28 22v8" />
                <path d="M16 30l8-8 8 8" />
              </svg>
              <div>
                <p className="text-sm font-medium text-foreground">음악을 시작해보세요</p>
                <p className="mt-1 text-xs text-foreground-muted">
                  오디오 파일을 드래그하거나, 오른쪽 패널에서 녹음·샘플을 추가하세요
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground-muted/60">
                <span className="rounded px-1.5 py-0.5" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>MP3</span>
                <span className="rounded px-1.5 py-0.5" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>WAV</span>
                <span className="rounded px-1.5 py-0.5" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>FLAC</span>
                <span className="rounded px-1.5 py-0.5" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>M4A</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-2">
              {engine.cells.map((cell) => (
                <CellRow
                  key={cell.id}
                  cell={cell}
                  position={engine.position}
                  onVolumeChange={(value) => engine.setCellVolume(cell.id, value)}
                  onEchoChange={(enabled, wet) => engine.setCellEcho(cell.id, enabled, wet)}
                  onReverbChange={(enabled, wet) => engine.setCellReverb(cell.id, enabled, wet)}
                  onAutotuneChange={(update) => engine.setCellAutotune(cell.id, update)}
                  onRemove={() => engine.removeCell(cell.id)}
                  disabled={isRecordingMix}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 lg:w-80 overflow-y-auto lg:overflow-y-initial pr-1 flex-none">
          <AddCellPanel onAddCell={engine.addCell} vocalCount={vocalCount} disabled={isRecordingMix} />
          {dropError && (
            <p role="alert" className="text-sm text-accent-record">
              {dropError}
            </p>
          )}
          <MixRecordPanel
            mixRecording={engine.mixRecording}
            canRecord={engine.totalDuration > 0}
            onStart={engine.startMixRecording}
            onStop={engine.stopMixRecording}
            onReset={engine.resetMixRecording}
          />
        </div>
      </div>
    </FileDropZone>
  );
}
