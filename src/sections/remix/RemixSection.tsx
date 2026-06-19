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
      className="mx-auto flex h-full w-full flex-col gap-3 p-3 overflow-hidden lg:max-w-none"
    >
      <div>
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--primary)", textShadow: "0 0 12px var(--primary-glow)" }}
        >
          리믹스
        </h1>
        <p className="mt-1 text-sm text-foreground-muted landscape:max-md:hidden">
          여러 트랙을 겹쳐 볼륨/팬을 조절하고, 결과를 하나의 믹스로 녹음해보세요.
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

          {engine.tracks.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-4 rounded-xl border px-6 py-8 text-center flex-1"
              style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)", borderStyle: "dashed" }}
            >
              <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--foreground-muted)", opacity: 0.4 }}>
                <path d="M6 12c2-2 4.5-3.5 7.5-3.5S19 10.5 21 14s4.5 5.5 7.5 5.5 5.5-1.5 7.5-4.5 2.5-5.5 4-5.5" />
                <line x1="6" y1="36" x2="42" y2="36" />
                <line x1="6" y1="28" x2="42" y2="28" />
              </svg>
              <div>
                <p className="text-sm font-medium text-foreground">트랙을 쌓아 믹스를 만들어보세요</p>
                <p className="mt-1 text-xs text-foreground-muted">
                  오디오 파일을 드래그하거나, 오른쪽 패널에서 녹음·드럼 루프·샘플을 추가하세요
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-foreground-muted/60">
                <span className="rounded px-1.5 py-0.5" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>마이크 녹음</span>
                <span className="rounded px-1.5 py-0.5" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>오디오 파일</span>
                <span className="rounded px-1.5 py-0.5" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>드럼 루프</span>
                <span className="rounded px-1.5 py-0.5" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>샘플</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-2">
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
        </div>

        <div className="flex flex-col gap-3 lg:w-80 overflow-y-auto lg:overflow-y-initial pr-1 flex-none">
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
        </div>
      </div>
    </FileDropZone>
  );
}
