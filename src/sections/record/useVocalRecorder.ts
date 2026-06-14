"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAudioContext } from "@/audio/context";
import {
  classifyMicError,
  MIC_ERROR_MESSAGES,
  pickRecorderMimeType,
  requestMicStream,
  stopMediaStream,
} from "@/audio/recorder";

export type VocalRecorderStatus =
  | "idle"
  | "requesting-permission"
  | "recording"
  | "processing"
  | "error";

export interface VocalRecorderState {
  status: VocalRecorderStatus;
  elapsedMs: number;
  errorMessage: string | null;
}

const INITIAL_STATE: VocalRecorderState = {
  status: "idle",
  elapsedMs: 0,
  errorMessage: null,
};

/** 녹음 경과 시간 표시 갱신 주기 */
const ELAPSED_TICK_MS = 100;

/**
 * 보컬 녹음 셀용 마이크 녹음.
 * 다른 셀이 재생되는 동안에도 시작할 수 있어 오버더빙처럼 동작한다
 * (재생 시작/정지는 호출 측이 별도로 제어한다).
 * 녹음을 마치면 디코딩된 AudioBuffer를 onComplete로 전달하고 idle 상태로 돌아간다.
 */
export function useVocalRecorder(onComplete: (buffer: AudioBuffer) => void) {
  const [state, setState] = useState<VocalRecorderState>(INITIAL_STATE);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const mimeTypeRef = useRef<string>("audio/webm");
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleStop = useCallback(async () => {
    clearTimer();
    stopMediaStream(streamRef.current);
    streamRef.current = null;

    const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
    chunksRef.current = [];

    setState((prev) => ({ ...prev, status: "processing" }));

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await getAudioContext().decodeAudioData(arrayBuffer);
      onCompleteRef.current(audioBuffer);
      setState(INITIAL_STATE);
    } catch {
      setState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: "녹음을 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.",
      }));
    }
  }, [clearTimer]);

  /** 마이크 권한을 요청하고 녹음을 시작한다. 녹음 시도 시점에만 권한을 요청한다. */
  const start = useCallback(async () => {
    setState((prev) => ({ ...prev, status: "requesting-permission", errorMessage: null }));

    let stream: MediaStream;
    try {
      stream = await requestMicStream();
    } catch (error) {
      const kind = classifyMicError(error);
      setState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: MIC_ERROR_MESSAGES[kind],
      }));
      return;
    }

    streamRef.current = stream;
    const mimeType = pickRecorderMimeType();
    mimeTypeRef.current = mimeType ?? "audio/webm";

    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      void handleStop();
    };

    mediaRecorderRef.current = recorder;
    recorder.start();

    startTimeRef.current = Date.now();
    setState((prev) => ({ ...prev, status: "recording", elapsedMs: 0 }));
    timerRef.current = setInterval(() => {
      setState((prev) => ({ ...prev, elapsedMs: Date.now() - startTimeRef.current }));
    }, ELAPSED_TICK_MS);
  }, [handleStop]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }
      stopMediaStream(streamRef.current);
    };
  }, [clearTimer]);

  return { state, start, stop };
}
