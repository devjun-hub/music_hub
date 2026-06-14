"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { getAudioContext } from "@/audio/context";
import { createMixBus, type MixBus } from "@/audio/record/mixBus";
import { createCellEngine, type CellEngine } from "@/audio/record/trackEngine";
import { pickRecorderMimeType } from "@/audio/recorder";
import { audioBufferToWavBlob } from "@/audio/wav";
import {
  DEFAULT_AUTOTUNE_RETUNE,
  DEFAULT_AUTOTUNE_SCALE,
  DEFAULT_CELL_VOLUME,
  DEFAULT_ECHO_WET,
  DEFAULT_REVERB_WET,
  type AutotuneScaleId,
} from "@/lib/constants";
import type { MixRecordingState } from "@/lib/types";

export type CellKind = "source" | "vocal" | "sample";

export interface RecordCell {
  id: string;
  name: string;
  kind: CellKind;
  duration: number;
  /** 파형 표시용 오브젝트 URL (디코딩된 AudioBuffer를 WAV로 변환해 생성) */
  waveformUrl: string;
  volume: number;
  echoEnabled: boolean;
  echoWet: number;
  reverbEnabled: boolean;
  reverbWet: number;
  autotuneEnabled: boolean;
  autotuneScale: AutotuneScaleId;
  autotuneRetune: number;
}

export interface AutotuneUpdate {
  enabled?: boolean;
  scale?: AutotuneScaleId;
  retune?: number;
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

export interface RecordEngine {
  cells: RecordCell[];
  isPlaying: boolean;
  /** 전체 재생 위치 (초, Transport 기준) */
  position: number;
  /** 가장 긴 셀의 길이 (초) */
  totalDuration: number;
  addCell(name: string, kind: CellKind, buffer: AudioBuffer): void;
  removeCell(id: string): void;
  setCellVolume(id: string, value: number): void;
  setCellEcho(id: string, enabled: boolean, wet?: number): void;
  setCellReverb(id: string, enabled: boolean, wet?: number): void;
  setCellAutotune(id: string, update: AutotuneUpdate): void;
  togglePlay(): void;
  stopPlayback(): void;
  mixRecording: MixRecordingState;
  startMixRecording(): void;
  stopMixRecording(): void;
  resetMixRecording(): void;
}

/**
 * 녹음 섹션(멀티트랙 에디터) 오디오 엔진(마스터 믹스 버스 + 셀별 엔진)을 생성/정리하고,
 * 셀 목록 상태, 동시 재생(Transport), 믹스 녹음을 위한 컨트롤을 반환한다.
 * 오디오 노드 생성/연결/해제는 이 훅 안에서만 다룬다.
 */
export function useRecordEngine(): RecordEngine {
  const [cells, setCells] = useState<RecordCell[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [mixRecording, setMixRecording] = useState<MixRecordingState>(INITIAL_MIX_RECORDING);

  const mixBusRef = useRef<MixBus | null>(null);
  const engineMapRef = useRef<Map<string, CellEngine>>(new Map());
  const cellsRef = useRef<RecordCell[]>(cells);
  const isPlayingRef = useRef(isPlaying);
  const totalDuration = cells.reduce((max, cell) => Math.max(max, cell.duration), 0);
  const totalDurationRef = useRef(totalDuration);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const mimeTypeRef = useRef<string>("audio/webm");
  const recordingStartRef = useRef(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 렌더 중 ref 갱신은 react-hooks/refs에서 금지하므로 effect에서 매 렌더 후 동기화한다.
  useEffect(() => {
    cellsRef.current = cells;
    isPlayingRef.current = isPlaying;
    totalDurationRef.current = totalDuration;
  });

  // 마운트 시 마스터 믹스 버스 생성, 언마운트 시 모든 셀/버스/파형 URL 정리 + Transport 정지
  useEffect(() => {
    mixBusRef.current = createMixBus();
    const engineMap = engineMapRef.current;
    return () => {
      engineMap.forEach((engine) => engine.dispose());
      engineMap.clear();
      cellsRef.current.forEach((cell) => URL.revokeObjectURL(cell.waveformUrl));
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

  // 재생 위치를 매 프레임 갱신하고, 가장 긴 셀 끝(또는 셀이 없어짐)에 도달하면
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

  const addCell = useCallback<RecordEngine["addCell"]>((name, kind, buffer) => {
    const mixBus = mixBusRef.current;
    if (!mixBus) return;

    const id = crypto.randomUUID();
    const engine = createCellEngine();
    engine.connect(mixBus.input);
    engine.load(buffer);
    engine.setVolume(DEFAULT_CELL_VOLUME);
    engineMapRef.current.set(id, engine);

    const waveformUrl = URL.createObjectURL(audioBufferToWavBlob(buffer));

    const next: RecordCell[] = [
      ...cellsRef.current,
      {
        id,
        name,
        kind,
        duration: buffer.duration,
        waveformUrl,
        volume: DEFAULT_CELL_VOLUME,
        echoEnabled: false,
        echoWet: DEFAULT_ECHO_WET,
        reverbEnabled: false,
        reverbWet: DEFAULT_REVERB_WET,
        autotuneEnabled: false,
        autotuneScale: DEFAULT_AUTOTUNE_SCALE,
        autotuneRetune: DEFAULT_AUTOTUNE_RETUNE,
      },
    ];
    setCells(next);
  }, []);

  const removeCell = useCallback((id: string) => {
    engineMapRef.current.get(id)?.dispose();
    engineMapRef.current.delete(id);
    const target = cellsRef.current.find((cell) => cell.id === id);
    if (target) URL.revokeObjectURL(target.waveformUrl);
    setCells(cellsRef.current.filter((cell) => cell.id !== id));
  }, []);

  const setCellVolume = useCallback((id: string, value: number) => {
    engineMapRef.current.get(id)?.setVolume(value);
    setCells(cellsRef.current.map((cell) => (cell.id === id ? { ...cell, volume: value } : cell)));
  }, []);

  const setCellEcho = useCallback((id: string, enabled: boolean, wet?: number) => {
    const engine = engineMapRef.current.get(id);
    if (wet !== undefined) engine?.setEchoWet(wet);
    engine?.setEchoEnabled(enabled);
    setCells(
      cellsRef.current.map((cell) =>
        cell.id === id ? { ...cell, echoEnabled: enabled, echoWet: wet ?? cell.echoWet } : cell,
      ),
    );
  }, []);

  const setCellReverb = useCallback((id: string, enabled: boolean, wet?: number) => {
    const engine = engineMapRef.current.get(id);
    if (wet !== undefined) engine?.setReverbWet(wet);
    engine?.setReverbEnabled(enabled);
    setCells(
      cellsRef.current.map((cell) =>
        cell.id === id ? { ...cell, reverbEnabled: enabled, reverbWet: wet ?? cell.reverbWet } : cell,
      ),
    );
  }, []);

  const setCellAutotune = useCallback((id: string, update: AutotuneUpdate) => {
    const engine = engineMapRef.current.get(id);
    if (update.scale !== undefined) engine?.setAutotuneScale(update.scale);
    if (update.retune !== undefined) engine?.setAutotuneRetune(update.retune);
    if (update.enabled !== undefined) engine?.setAutotuneEnabled(update.enabled);
    setCells(
      cellsRef.current.map((cell) =>
        cell.id === id
          ? {
              ...cell,
              autotuneEnabled: update.enabled ?? cell.autotuneEnabled,
              autotuneScale: update.scale ?? cell.autotuneScale,
              autotuneRetune: update.retune ?? cell.autotuneRetune,
            }
          : cell,
      ),
    );
  }, []);

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
    cells,
    isPlaying,
    position,
    totalDuration,
    addCell,
    removeCell,
    setCellVolume,
    setCellEcho,
    setCellReverb,
    setCellAutotune,
    togglePlay,
    stopPlayback,
    mixRecording,
    startMixRecording,
    stopMixRecording,
    resetMixRecording,
  };
}
