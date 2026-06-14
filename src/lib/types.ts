/** 믹스 녹음(여러 트랙/셀을 동시 재생하며 결과를 MediaRecorder로 캡처) 상태 머신 */
export type MixRecordingStatus = "idle" | "recording" | "processing" | "ready" | "error";

export interface MixRecordingState {
  status: MixRecordingStatus;
  elapsedMs: number;
  audioBuffer: AudioBuffer | null;
  errorMessage: string | null;
}
