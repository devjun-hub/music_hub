"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAudioContext } from "@/audio/context";
import { pickRecorderMimeType } from "@/audio/recorder";
import type { MixRecordingState } from "@/lib/types";

const INITIAL_STATE: MixRecordingState = {
  status: "idle",
  elapsedMs: 0,
  audioBuffer: null,
  errorMessage: null,
};

const DRUM_RECORDING_ERROR_MESSAGE = "녹음을 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.";

/** 녹음 경과 시간 표시 갱신 주기 */
const ELAPSED_TICK_MS = 100;

/**
 * 드럼 키트 믹스 버스 출력을 MediaRecorder로 캡처한다.
 * 마이크 권한이 필요 없고(드럼 키트 자체 출력을 캡처), 재생 여부와 무관하게
 * 패드 연타나 시퀀서 루프를 그대로 기록한다.
 */
export function useDrumRecorder(getStream: () => MediaStream | null) {
  const [state, setState] = useState<MixRecordingState>(INITIAL_STATE);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const mimeTypeRef = useRef<string>("audio/webm");
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleStop = useCallback(async () => {
    clearTimer();
    const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
    chunksRef.current = [];

    setState((prev) => ({ ...prev, status: "processing" }));

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await getAudioContext().decodeAudioData(arrayBuffer);
      setState({ status: "ready", elapsedMs: 0, audioBuffer, errorMessage: null });
    } catch {
      setState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: DRUM_RECORDING_ERROR_MESSAGE,
      }));
    }
  }, [clearTimer]);

  const start = useCallback(() => {
    const stream = getStream();
    if (!stream) return;

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
    setState({ status: "recording", elapsedMs: 0, audioBuffer: null, errorMessage: null });
    timerRef.current = setInterval(() => {
      setState((prev) => ({ ...prev, elapsedMs: Date.now() - startTimeRef.current }));
    }, ELAPSED_TICK_MS);
  }, [getStream, handleStop]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }
    };
  }, [clearTimer]);

  return { state, start, stop, reset };
}
