/** 메인 스레드 -> 워커: PCM 채널 데이터를 MP3로 인코딩 요청 */
export interface Mp3EncodeRequest {
  type: "encode";
  channelData: Float32Array[];
  sampleRate: number;
  kbps: number;
}

/** 워커 -> 메인 스레드: 인코딩 진행률 (0~1) */
export interface Mp3ProgressMessage {
  type: "progress";
  ratio: number;
}

/** 워커 -> 메인 스레드: 인코딩 완료, MP3 바이너리 전달 */
export interface Mp3DoneMessage {
  type: "done";
  buffer: ArrayBuffer;
}

export type Mp3WorkerMessage = Mp3ProgressMessage | Mp3DoneMessage;
