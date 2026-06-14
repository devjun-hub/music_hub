"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { getAudioContext } from "@/audio/context";
import { pickRecorderMimeType } from "@/audio/recorder";
import { createMixBus, type MixBus } from "@/audio/remix/mixBus";
import { createTrackEngine, type TrackEngine } from "@/audio/remix/trackEngine";
import { DEFAULT_TRACK_PAN, DEFAULT_TRACK_VOLUME } from "@/lib/constants";
import type { MixRecordingState } from "@/lib/types";

export type TrackSourceKind = "recording" | "upload" | "drumLoop" | "sample";

export interface RemixTrack {
  id: string;
  name: string;
  sourceKind: TrackSourceKind;
  duration: number;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
}

const INITIAL_MIX_RECORDING: MixRecordingState = {
  status: "idle",
  elapsedMs: 0,
  audioBuffer: null,
  errorMessage: null,
};

/** 믹스 녹음 경과 시간 표시 갱신 주기 */
const MIX_RECORDING_TICK_MS = 100;

const MIX_RECORDING_ERROR_MESSAGE = "믹스를 녹음하는 중 오류가 발생했습니다. 다시 시도해주세요.";

export interface RemixEngine {
  tracks: RemixTrack[];
  isPlaying: boolean;
  /** 전체 재생 위치 (초, Transport 기준) */
  position: number;
  /** 가장 긴 트랙의 길이 (초) */
  totalDuration: number;
  addTrack(name: string, sourceKind: TrackSourceKind, buffer: AudioBuffer): void;
  removeTrack(id: string): void;
  setTrackVolume(id: string, value: number): void;
  setTrackPan(id: string, value: number): void;
  toggleMute(id: string): void;
  toggleSolo(id: string): void;
  togglePlay(): void;
  mixRecording: MixRecordingState;
  startMixRecording(): void;
  stopMixRecording(): void;
  resetMixRecording(): void;
}

/** 솔로된 트랙이 있으면 솔로된 트랙만, 없으면 뮤트되지 않은 트랙만 들리게 한다. */
function isTrackActive(track: RemixTrack, anySolo: boolean): boolean {
  if (track.muted) return false;
  return anySolo ? track.solo : true;
}

/**
 * 리믹스 섹션 오디오 엔진(마스터 믹스 버스 + 트랙별 엔진)을 생성/정리하고,
 * 트랙 목록 상태, 동시 재생(Transport), 믹스 녹음을 위한 컨트롤을 반환한다.
 * 오디오 노드 생성/연결/해제는 이 훅 안에서만 다룬다.
 */
export function useRemixEngine(): RemixEngine {
  const [tracks, setTracks] = useState<RemixTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [mixRecording, setMixRecording] = useState<MixRecordingState>(INITIAL_MIX_RECORDING);

  const mixBusRef = useRef<MixBus | null>(null);
  const engineMapRef = useRef<Map<string, TrackEngine>>(new Map());
  const tracksRef = useRef<RemixTrack[]>(tracks);
  const isPlayingRef = useRef(isPlaying);
  const totalDuration = tracks.reduce((max, track) => Math.max(max, track.duration), 0);
  const totalDurationRef = useRef(totalDuration);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const mimeTypeRef = useRef<string>("audio/webm");
  const recordingStartRef = useRef(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 렌더 중 ref 갱신은 react-hooks/refs에서 금지하므로 effect에서 매 렌더 후 동기화한다.
  useEffect(() => {
    tracksRef.current = tracks;
    isPlayingRef.current = isPlaying;
    totalDurationRef.current = totalDuration;
  });

  // 마운트 시 마스터 믹스 버스 생성, 언마운트 시 모든 트랙/버스 정리 + Transport 정지
  useEffect(() => {
    mixBusRef.current = createMixBus();
    const engineMap = engineMapRef.current;
    return () => {
      engineMap.forEach((engine) => engine.dispose());
      engineMap.clear();
      mixBusRef.current?.dispose();
      mixBusRef.current = null;
      Tone.getTransport().stop();
    };
  }, []);

  const clearRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current !== null) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const handleMixRecordingStop = useCallback(async () => {
    clearRecordingTimer();
    const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
    chunksRef.current = [];

    setMixRecording((prev) => ({ ...prev, status: "processing" }));

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await getAudioContext().decodeAudioData(arrayBuffer);
      setMixRecording((prev) => ({ ...prev, status: "ready", audioBuffer, errorMessage: null }));
    } catch {
      setMixRecording((prev) => ({
        ...prev,
        status: "error",
        errorMessage: MIX_RECORDING_ERROR_MESSAGE,
      }));
    }
  }, [clearRecordingTimer]);

  // 재생 위치를 매 프레임 갱신하고, 가장 긴 트랙 끝(또는 트랙이 없어짐)에 도달하면
  // 재생/믹스 녹음을 자동으로 정지한다.
  useEffect(() => {
    let frame: number;

    const tick = () => {
      if (isPlayingRef.current) {
        const transport = Tone.getTransport();
        const seconds = transport.seconds;
        const total = totalDurationRef.current;
        if (total <= 0 || seconds >= total) {
          transport.stop();
          setIsPlaying(false);
          setPosition(0);
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
          }
        } else {
          setPosition(seconds);
        }
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => clearRecordingTimer, [clearRecordingTimer]);

  const recomputeActive = useCallback((nextTracks: RemixTrack[]) => {
    const anySolo = nextTracks.some((track) => track.solo);
    for (const track of nextTracks) {
      engineMapRef.current.get(track.id)?.setActive(isTrackActive(track, anySolo));
    }
  }, []);

  const addTrack = useCallback<RemixEngine["addTrack"]>(
    (name, sourceKind, buffer) => {
      const mixBus = mixBusRef.current;
      if (!mixBus) return;

      const id = crypto.randomUUID();
      const engine = createTrackEngine();
      engine.connect(mixBus.input);
      engine.load(buffer);
      engine.setVolume(DEFAULT_TRACK_VOLUME);
      engine.setPan(DEFAULT_TRACK_PAN);
      engineMapRef.current.set(id, engine);

      const next: RemixTrack[] = [
        ...tracksRef.current,
        {
          id,
          name,
          sourceKind,
          duration: buffer.duration,
          volume: DEFAULT_TRACK_VOLUME,
          pan: DEFAULT_TRACK_PAN,
          muted: false,
          solo: false,
        },
      ];
      recomputeActive(next);
      setTracks(next);
    },
    [recomputeActive],
  );

  const removeTrack = useCallback(
    (id: string) => {
      engineMapRef.current.get(id)?.dispose();
      engineMapRef.current.delete(id);
      const next = tracksRef.current.filter((track) => track.id !== id);
      recomputeActive(next);
      setTracks(next);
    },
    [recomputeActive],
  );

  const setTrackVolume = useCallback((id: string, value: number) => {
    engineMapRef.current.get(id)?.setVolume(value);
    setTracks(
      tracksRef.current.map((track) => (track.id === id ? { ...track, volume: value } : track)),
    );
  }, []);

  const setTrackPan = useCallback((id: string, value: number) => {
    engineMapRef.current.get(id)?.setPan(value);
    setTracks(tracksRef.current.map((track) => (track.id === id ? { ...track, pan: value } : track)));
  }, []);

  const toggleMute = useCallback(
    (id: string) => {
      const next = tracksRef.current.map((track) =>
        track.id === id ? { ...track, muted: !track.muted } : track,
      );
      recomputeActive(next);
      setTracks(next);
    },
    [recomputeActive],
  );

  const toggleSolo = useCallback(
    (id: string) => {
      const next = tracksRef.current.map((track) =>
        track.id === id ? { ...track, solo: !track.solo } : track,
      );
      recomputeActive(next);
      setTracks(next);
    },
    [recomputeActive],
  );

  const togglePlay = useCallback(() => {
    if (totalDurationRef.current <= 0) return;
    const transport = Tone.getTransport();
    if (isPlayingRef.current) {
      transport.stop();
      setIsPlaying(false);
      setPosition(0);
    } else {
      transport.start();
      setIsPlaying(true);
    }
  }, []);

  const stopPlayback = useCallback(() => {
    Tone.getTransport().stop();
    setIsPlaying(false);
    setPosition(0);
  }, []);

  const startMixRecording = useCallback(() => {
    const mixBus = mixBusRef.current;
    if (!mixBus || totalDurationRef.current <= 0) return;
    if (isPlayingRef.current) {
      Tone.getTransport().stop();
    }

    const mimeType = pickRecorderMimeType();
    mimeTypeRef.current = mimeType ?? "audio/webm";
    const recorder = mimeType
      ? new MediaRecorder(mixBus.stream, { mimeType })
      : new MediaRecorder(mixBus.stream);
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      void handleMixRecordingStop();
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    Tone.getTransport().start();

    recordingStartRef.current = Date.now();
    setIsPlaying(true);
    setPosition(0);
    setMixRecording({ status: "recording", elapsedMs: 0, audioBuffer: null, errorMessage: null });
    recordingTimerRef.current = setInterval(() => {
      setMixRecording((prev) => ({ ...prev, elapsedMs: Date.now() - recordingStartRef.current }));
    }, MIX_RECORDING_TICK_MS);
  }, [handleMixRecordingStop]);

  const stopMixRecording = useCallback(() => {
    clearRecordingTimer();
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    stopPlayback();
  }, [clearRecordingTimer, stopPlayback]);

  const resetMixRecording = useCallback(() => {
    setMixRecording(INITIAL_MIX_RECORDING);
  }, []);

  return {
    tracks,
    isPlaying,
    position,
    totalDuration,
    addTrack,
    removeTrack,
    setTrackVolume,
    setTrackPan,
    toggleMute,
    toggleSolo,
    togglePlay,
    mixRecording,
    startMixRecording,
    stopMixRecording,
    resetMixRecording,
  };
}
