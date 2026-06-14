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
      className="mx-auto flex max-w-xl flex-col gap-4 p-4"
    >
      <div>
        <h1 className="text-xl font-semibold">녹음</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          음원을 불러오고 보컬을 녹음한 뒤, 파형을 보며 에코·리버브·오토튠을 적용해 하나의 믹스로
          내려받으세요.
        </p>
      </div>

      <TransportBar
        isPlaying={engine.isPlaying}
        position={engine.position}
        totalDuration={engine.totalDuration}
        onTogglePlay={engine.togglePlay}
        disabled={isRecordingMix}
      />

      {engine.cells.length === 0 ? (
        <p className="rounded-lg border border-surface-border bg-surface p-4 text-center text-sm text-foreground-muted">
          아직 셀이 없습니다. 음원을 불러오거나 보컬을 녹음해보세요.
        </p>
      ) : (
        <div className="space-y-2">
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
    </FileDropZone>
  );
}
