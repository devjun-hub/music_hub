"use client";

import { useState } from "react";
import { decodeAudioFile } from "@/audio/decodeAudioFile";
import { FileDropZone } from "@/components/FileDropZone";
import { MixRecordPanel } from "@/components/MixRecordPanel";
import { TransportBar } from "@/components/TransportBar";
import { AddTrackPanel } from "./AddTrackPanel";
import { TrackRow } from "./TrackRow";
import { useRemixEngine } from "./useRemixEngine";

const DROP_DECODE_ERROR_MESSAGE =
  "이 파일은 불러올 수 없습니다. 지원되지 않는 형식이거나 손상된 파일일 수 있습니다.";

export function RemixSection() {
  const engine = useRemixEngine();
  const [dropError, setDropError] = useState<string | null>(null);
  const isRecordingMix = engine.mixRecording.status === "recording";
  const recordingCount = engine.tracks.filter((track) => track.sourceKind === "recording").length;
  const drumLoopCount = engine.tracks.filter((track) => track.sourceKind === "drumLoop").length;

  const handleDroppedFiles = async (files: File[]) => {
    setDropError(null);
    for (const file of files) {
      try {
        const buffer = await decodeAudioFile(file);
        engine.addTrack(file.name, "upload", buffer);
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
        <h1 className="text-xl font-semibold">리믹스</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          여러 트랙을 겹쳐 볼륨/팬을 조절하고, 결과를 하나의 믹스로 녹음해보세요.
        </p>
      </div>

      <TransportBar
        isPlaying={engine.isPlaying}
        position={engine.position}
        totalDuration={engine.totalDuration}
        onTogglePlay={engine.togglePlay}
        disabled={isRecordingMix}
      />

      {engine.tracks.length === 0 ? (
        <p className="rounded-lg border border-surface-border bg-surface p-4 text-center text-sm text-foreground-muted">
          아직 트랙이 없습니다. 마이크로 녹음하거나 오디오 파일을 추가해보세요.
        </p>
      ) : (
        <div className="space-y-2">
          {engine.tracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              onVolumeChange={(value) => engine.setTrackVolume(track.id, value)}
              onPanChange={(value) => engine.setTrackPan(track.id, value)}
              onToggleMute={() => engine.toggleMute(track.id)}
              onToggleSolo={() => engine.toggleSolo(track.id)}
              onRemove={() => engine.removeTrack(track.id)}
              disabled={isRecordingMix}
            />
          ))}
        </div>
      )}

      <AddTrackPanel
        onAddTrack={engine.addTrack}
        recordingCount={recordingCount}
        drumLoopCount={drumLoopCount}
        disabled={isRecordingMix}
      />
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
