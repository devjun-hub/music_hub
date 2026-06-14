/**
 * 마이크 녹음에 필요한 getUserMedia / MediaRecorder 래퍼.
 * 권한 요청은 호출 시점(녹음 시도 시)에만 수행한다.
 */

export type MicErrorKind = "denied" | "not-found" | "unsupported" | "unknown";

/** 마이크 권한 요청 중 발생할 수 있는 에러를 사용자 안내용 카테고리로 분류한다. */
export function classifyMicError(error: unknown): MicErrorKind {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "denied";
    }
    if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
      return "not-found";
    }
  }
  if (error instanceof Error && error.message === "unsupported") {
    return "unsupported";
  }
  return "unknown";
}

/** 카테고리별 사용자 안내 메시지. 차단 화면이 아닌 해결 방법을 함께 제시한다. */
export const MIC_ERROR_MESSAGES: Record<MicErrorKind, string> = {
  denied:
    "마이크 권한이 거부되었습니다. 브라우저 주소창의 자물쇠 아이콘에서 마이크 권한을 허용한 뒤 다시 시도하세요.",
  "not-found": "사용 가능한 마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인하세요.",
  unsupported: "이 브라우저는 마이크 녹음을 지원하지 않습니다. 최신 Chrome 또는 Safari를 사용해주세요.",
  unknown: "마이크에 접근하는 중 오류가 발생했습니다. 다시 시도해주세요.",
};

/** 녹음 시도 시점에만 호출한다. 미지원 환경에서는 "unsupported" 메시지의 Error를 던진다. */
export async function requestMicStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("unsupported");
  }
  return navigator.mediaDevices.getUserMedia({ audio: true });
}

const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

/** 현재 브라우저가 지원하는 녹음 포맷 중 우선순위가 가장 높은 것을 반환한다. */
export function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

/** 마이크 스트림의 모든 트랙을 정지해 장치 사용을 해제한다. */
export function stopMediaStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((track) => track.stop());
}
