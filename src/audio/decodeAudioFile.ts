import { getAudioContext } from "./context";

/** decodeAudioData가 지원하는 주요 확장자. 드래그앤드롭 시 file.type이 비어있는 경우(특히 .wav, Windows) 대비용. */
const AUDIO_FILE_EXTENSIONS = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac", ".webm", ".caf"];

/** 오디오 파일 input의 accept 속성 값 */
export const AUDIO_FILE_ACCEPT = "audio/*";

/** MIME 타입 또는 확장자로 오디오 파일 여부를 판별한다. 드래그앤드롭 1차 필터링용. */
export function isAudioFile(file: File): boolean {
  if (file.type.startsWith("audio/")) return true;
  const lower = file.name.toLowerCase();
  return AUDIO_FILE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/** 파일을 읽어 공유 AudioContext로 디코딩한다. 실패 시 예외를 던진다. */
export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  return getAudioContext().decodeAudioData(arrayBuffer);
}
