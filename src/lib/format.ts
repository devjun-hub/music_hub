/** 밀리초를 mm:ss 형식의 고정폭 문자열로 변환한다. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/** BPM과 4/4박자 마디 수로부터 재생 길이(ms)를 계산한다. */
export function barsToMs(bpm: number, bars: number): number {
  return ((60 / bpm) * 4 * bars) * 1000;
}
