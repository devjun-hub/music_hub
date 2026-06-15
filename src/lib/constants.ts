export const DEFAULT_BPM = 120;
export const MIN_BPM = 40;
export const MAX_BPM = 240;

/** 0(무음) ~ 1(최대) 범위의 정규화된 마스터 볼륨 */
export const DEFAULT_MASTER_VOLUME = 0.8;

/** MP3 인코딩 비트레이트 (kbps) */
export const MP3_BITRATE_KBPS = 128;

export interface SectionConfig {
  id: string;
  label: string;
  href: string;
}

/** 드럼 섹션 — 패드/시퀀서가 다루는 8개 사운드. 순서가 곧 시퀀서 행 순서다. */
export const DRUM_SOUNDS = [
  { id: "kick", label: "킥", shortLabel: "킥", key: "1" },
  { id: "snare", label: "스네어", shortLabel: "스네어", key: "2" },
  { id: "hihatClosed", label: "하이햇 (클로즈)", shortLabel: "CH", key: "3" },
  { id: "hihatOpen", label: "하이햇 (오픈)", shortLabel: "OH", key: "4" },
  { id: "tomLow", label: "로우 탐", shortLabel: "탐 L", key: "5" },
  { id: "tomMid", label: "미드 탐", shortLabel: "탐 M", key: "6" },
  { id: "tomHigh", label: "하이 탐", shortLabel: "탐 H", key: "7" },
  { id: "crash", label: "크래시", shortLabel: "크래시", key: "8" },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  shortLabel: string;
  key: string;
}>;

export type DrumSoundId = (typeof DRUM_SOUNDS)[number]["id"];

/** 16스텝 시퀀서의 스텝 수 */
export const STEP_COUNT = 16;

/** 드럼 섹션 연주 모드: MPC 스타일 패드 vs 실제 드럼 세트 모형 */
export const DRUM_MODES = ["pad", "kit"] as const;
export type DrumMode = (typeof DRUM_MODES)[number];
export const DEFAULT_DRUM_MODE: DrumMode = "pad";

/** 4개 섹션 네비게이션 — 순서가 곧 우선순위(녹음 → 리믹스 → 드럼 → DJ) */
export const SECTIONS: SectionConfig[] = [
  { id: "record", label: "녹음", href: "/record" },
  { id: "remix", label: "리믹스", href: "/remix" },
  { id: "drum", label: "드럼", href: "/drum" },
  { id: "dj", label: "DJ", href: "/dj" },
];

/** DJ 덱 식별자 */
export const DECK_IDS = ["A", "B"] as const;
export type DeckId = (typeof DECK_IDS)[number];

/** DJ 덱 EQ 3밴드 게인 범위 (dB). -24는 사실상 무음에 가까운 "킬" 수준. */
export const DJ_EQ_MIN_DB = -24;
export const DJ_EQ_MAX_DB = 6;

/** DJ 피치 페이더 범위 옵션 (%). CDJ 관례를 따라 8/16/50 중 선택. */
export const DJ_PITCH_RANGE_OPTIONS = [8, 16, 50] as const;
export const DEFAULT_DJ_PITCH_RANGE: number = DJ_PITCH_RANGE_OPTIONS[0];

/** DJ 덱 기본 채널 볼륨 (0~1). 두 덱 + EQ 부스트가 겹쳐도 클리핑 여유를 둔다. */
export const DEFAULT_DJ_DECK_VOLUME = 0.8;

/** DJ 덱 기본 BPM (피치 0%일 때 기준 템포) */
export const DEFAULT_DJ_DECK_BPM = DEFAULT_BPM;

/** 크로스페이더 기본값 (0=A 전용 ~ 1=B 전용, 0.5=중앙) */
export const DEFAULT_CROSSFADER = 0.5;

/** 너지 버튼을 누르고 있는 동안 적용되는 임시 피치 보정폭 (%) */
export const DJ_NUDGE_PERCENT = 4;

/** DJ 필터 노브 (-1=로우패스 완전 닫힘, 0=바이패스, 1=하이패스 완전 닫힘) */
export const DJ_FILTER_MIN = -1;
export const DJ_FILTER_MAX = 1;
export const DJ_FILTER_STEP = 0.01;
export const DEFAULT_DJ_FILTER = 0;

/** 필터 스윕 주파수 범위 (Hz). 0 부근에서는 사실상 음향 변화가 없는 바이패스에 가깝다. */
export const DJ_FILTER_LOWPASS_MIN_HZ = 150;
export const DJ_FILTER_HIGHPASS_MAX_HZ = 6000;
/** value=0일 때 lowpass 컷오프 (사실상 통과) */
export const DJ_FILTER_BYPASS_HIGH_HZ = 20000;
/** value=0일 때 highpass 컷오프 (사실상 통과) */
export const DJ_FILTER_BYPASS_LOW_HZ = 20;

/** DJ 에코 분음 옵션 (4=1/4, 8=1/8, 16=1/16음표). delayTime = (60/bpm) * (4/division) */
export const DJ_ECHO_DIVISIONS = [4, 8, 16] as const;
export type DjEchoDivision = (typeof DJ_ECHO_DIVISIONS)[number];
export const DEFAULT_DJ_ECHO_DIVISION: DjEchoDivision = 8;

/** 덱당 핫큐 슬롯 수 */
export const DJ_HOT_CUE_COUNT = 4;

/** 비트 루프 길이 옵션 (비트 단위) */
export const DJ_LOOP_BEAT_OPTIONS = [1, 2, 4, 8] as const;
export type DjLoopBeats = (typeof DJ_LOOP_BEAT_OPTIONS)[number];
export const DEFAULT_DJ_LOOP_BEATS: DjLoopBeats = 4;

/** 마스터 출력 리미터 임계값(dB). 두 덱 + FX 패드가 겹쳐도 클리핑을 방지한다. */
export const DJ_MASTER_LIMITER_THRESHOLD_DB = -1;

/** FX 드롭 패드 — 마스터 버스에 직접 믹스되어 크로스페이더 위치와 무관하게 들린다. */
export const DJ_FX_PADS = [
  { id: "airhorn", label: "에어혼", key: "z" },
  { id: "siren", label: "사이렌", key: "x" },
  { id: "riser", label: "라이저", key: "c" },
  { id: "impact", label: "임팩트", key: "v" },
] as const satisfies ReadonlyArray<{ id: string; label: string; key: string }>;
export type DjFxPadId = (typeof DJ_FX_PADS)[number]["id"];

/** 리믹스 트랙 기본 채널 볼륨 (0~1) */
export const DEFAULT_TRACK_VOLUME = 0.8;

/** 리믹스 트랙 팬 범위 (-1=왼쪽 ~ 1=오른쪽, 0=중앙) */
export const TRACK_PAN_MIN = -1;
export const TRACK_PAN_MAX = 1;
export const TRACK_PAN_STEP = 0.1;
export const DEFAULT_TRACK_PAN = 0;

/** 녹음 섹션(멀티트랙 에디터) 셀 기본 채널 볼륨 (0~1) */
export const DEFAULT_CELL_VOLUME = 0.8;

/** 에코(FeedbackDelay) 딜레이 타임(초)·피드백 고정값, wet(강도) 슬라이더 범위 */
export const ECHO_DELAY_TIME = 0.25;
export const ECHO_FEEDBACK = 0.35;
export const ECHO_WET_MIN = 0;
export const ECHO_WET_MAX = 1;
export const ECHO_WET_STEP = 0.01;
export const DEFAULT_ECHO_WET = 0.35;

/** 리버브(Reverb) decay 고정값(초), wet(강도) 슬라이더 범위 */
export const REVERB_DECAY = 2.5;
export const REVERB_WET_MIN = 0;
export const REVERB_WET_MAX = 1;
export const REVERB_WET_STEP = 0.01;
export const DEFAULT_REVERB_WET = 0.3;

/** 오토튠 피치 분석 주기(ms)와 분석 버퍼 크기(샘플) */
export const AUTOTUNE_ANALYSIS_INTERVAL_MS = 100;
export const AUTOTUNE_FFT_SIZE = 2048;

/** 오토튠이 무시하는 주파수 범위(Hz) — 너무 낮거나 높은 잡음을 피치로 오인하지 않도록 함 */
export const AUTOTUNE_MIN_FREQUENCY = 60;
export const AUTOTUNE_MAX_FREQUENCY = 1500;

/** 오토튠 보정 속도(0~1): 분석 주기마다 목표 피치로 다가가는 비율. 낮으면 느리게 글라이드, 높으면 즉시 스냅 */
export const AUTOTUNE_RETUNE_MIN = 0.05;
export const AUTOTUNE_RETUNE_MAX = 1;
export const AUTOTUNE_RETUNE_STEP = 0.05;
export const DEFAULT_AUTOTUNE_RETUNE = 0.3;

/** 오토튠 스케일 프리셋(v1: 루트 C 고정). pitchClasses는 0(C)~11(B) 중 허용되는 음. */
export const AUTOTUNE_SCALES = [
  { id: "major", label: "메이저 (C / Am)", pitchClasses: [0, 2, 4, 5, 7, 9, 11] },
  { id: "minor", label: "마이너 (Cm)", pitchClasses: [0, 2, 3, 5, 7, 8, 10] },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  pitchClasses: readonly number[];
}>;

export type AutotuneScaleId = (typeof AUTOTUNE_SCALES)[number]["id"];
export const DEFAULT_AUTOTUNE_SCALE: AutotuneScaleId = "major";

/**
 * 내장 무료 샘플 루프 — 외부 음원 파일 없이 Tone.js 신스로 직접 합성해 제공한다
 * (라이선스 문제 회피 + 클라이언트 전용 구조 유지, 드럼 키트와 동일한 접근).
 * bars는 4/4박자 기준 마디 수.
 */
export const SAMPLE_LIBRARY = [
  {
    id: "lofiChords",
    name: "Lo-fi 코드 루프",
    description: "따뜻한 패드 코드 진행",
    bpm: 80,
    bars: 4,
  },
  {
    id: "synthArp",
    name: "신스 아르페지오",
    description: "16비트 아르페지오 루프",
    bpm: 120,
    bars: 2,
  },
  {
    id: "bassGroove",
    name: "베이스 그루브",
    description: "킥과 어우러지는 신스 베이스",
    bpm: 100,
    bars: 2,
  },
] as const satisfies ReadonlyArray<{
  id: string;
  name: string;
  description: string;
  bpm: number;
  bars: number;
}>;

export type SampleId = (typeof SAMPLE_LIBRARY)[number]["id"];
