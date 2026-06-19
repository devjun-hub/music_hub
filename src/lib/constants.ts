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

/**
 * 드럼 섹션 — 패드/시퀀서가 다루는 16개 사운드 (MPC 스타일 4×4).
 * 순서가 곧 시퀀서 행 순서이며, key는 키보드 단축키다.
 */
export const DRUM_SOUNDS = [
  { id: "kick",        label: "킥",            shortLabel: "킥",    key: "1" },
  { id: "snare",       label: "스네어",         shortLabel: "SNR",  key: "2" },
  { id: "hihatClosed", label: "하이햇 (클로즈)", shortLabel: "CH",   key: "3" },
  { id: "hihatOpen",   label: "하이햇 (오픈)",   shortLabel: "OH",   key: "4" },
  { id: "tomLow",      label: "로우 탐",         shortLabel: "T-L",  key: "z" },
  { id: "tomMid",      label: "미드 탐",         shortLabel: "T-M",  key: "x" },
  { id: "tomHigh",     label: "하이 탐",         shortLabel: "T-H",  key: "c" },
  { id: "crash",       label: "크래시",          shortLabel: "CRS",  key: "v" },
  { id: "ride",        label: "라이드",          shortLabel: "RD",   key: "q" },
  { id: "clap",        label: "클랩",            shortLabel: "CLP",  key: "w" },
  { id: "rimshot",     label: "림샷",            shortLabel: "RIM",  key: "e" },
  { id: "cowbell",     label: "카우벨",          shortLabel: "CB",   key: "r" },
  { id: "shaker",      label: "쉐이커",          shortLabel: "SHK",  key: "a" },
  { id: "conga",       label: "콩가",            shortLabel: "CGA",  key: "s" },
  { id: "bongo",       label: "봉고",            shortLabel: "BGO",  key: "d" },
  { id: "perc",        label: "퍼커션",          shortLabel: "PRC",  key: "f" },
  // ── EDM 확장 16종 (패드 뱅크 B) ──
  { id: "kickEdm",     label: "EDM 킥",        shortLabel: "EDM 킥", key: "7" },
  { id: "snareEdm",    label: "EDM 스네어",     shortLabel: "EDM SNR", key: "8" },
  { id: "clapEdm",     label: "EDM 클랩",       shortLabel: "EDM CLP", key: "9" },
  { id: "crashEdm",    label: "EDM 크래시",     shortLabel: "EDM CRS", key: "0" },
  { id: "synthPluck",  label: "EDM 플럭",       shortLabel: "PLK",    key: "n" },
  { id: "synthLead",   label: "EDM 리드",       shortLabel: "LED",    key: "m" },
  { id: "bassDrop",    label: "서브 베이스 드랍", shortLabel: "BSD",    key: "," },
  { id: "fxLaser",     label: "레이저 샷",      shortLabel: "LSR",    key: "." },
  { id: "fxUplifter",  label: "업리프터 스윕",   shortLabel: "UPL",    key: "u" },
  { id: "fxDownlifter",label: "다운리프터 스윕", shortLabel: "DWN",    key: "i" },
  { id: "vocalHey",    label: "보컬 찬트 HEY",   shortLabel: "HEY",    key: "o" },
  { id: "vocalGo",     label: "보컬 찬트 GO",    shortLabel: "GO!",    key: "p" },
  { id: "rimEdm",      label: "EDM 림",        shortLabel: "EDM RIM", key: "h" },
  { id: "congaHigh",   label: "하이 콩가",      shortLabel: "C-H",    key: "j" },
  { id: "cowbellEdm",  label: "EDM 카우벨",     shortLabel: "EDM CB",  key: "k" },
  { id: "fxScream",    label: "EDM 스크림",     shortLabel: "SCR",    key: "l" },
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

/** 드럼 패턴 뱅크 — 4개의 독립된 16스텝 패턴을 전환하며 사용한다. */
export const DRUM_BANK_IDS = ["A", "B", "C", "D"] as const;
export type DrumBankId = (typeof DRUM_BANK_IDS)[number];
export const DEFAULT_DRUM_BANK: DrumBankId = "A";

/** 드럼 사운드별 볼륨 슬라이더 (0=무음 ~ 1=원래 볼륨). amplitudeToDb로 dB 오프셋으로 변환한다. */
export const DRUM_VOLUME_MIN = 0;
export const DRUM_VOLUME_MAX = 1;
export const DRUM_VOLUME_STEP = 0.01;
export const DEFAULT_DRUM_SOUND_VOLUME = 1;

/** 드럼 사운드별 튠(피치) 조절 범위 (반음 단위) */
export const DRUM_TUNE_MIN_SEMITONES = -12;
export const DRUM_TUNE_MAX_SEMITONES = 12;
export const DRUM_TUNE_STEP = 1;
export const DEFAULT_DRUM_TUNE = 0;

/** 스윙(그루브) 조절 (0~100%). 오프비트(짝수 인덱스 스텝)의 16분음을 뒤로 미루는 비율. */
export const DRUM_SWING_MIN = 0;
export const DRUM_SWING_MAX = 100;
export const DRUM_SWING_STEP = 1;
export const DEFAULT_DRUM_SWING = 0;

/** 스윙 100%일 때, 오프비트 16분음을 16분음 길이의 이 비율만큼 지연시킨다. */
export const DRUM_SWING_MAX_RATIO = 0.5;

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

/**
 * FX 드롭 패드 12종 — 마스터 버스에 직접 믹스되어 크로스페이더 위치와 무관하게 들린다.
 * 4×3 레이아웃: 첫 4개(원래) + 신규 8개.
 */
export const DJ_FX_PADS = [
  // 행 1 — 원래 4종
  { id: "airhorn",      label: "에어혼",  key: "z" },
  { id: "siren",        label: "사이렌",  key: "x" },
  { id: "riser",        label: "라이저",  key: "c" },
  { id: "impact",       label: "임팩트",  key: "v" },
  // 행 2 — 신규: 텍스처·빌드
  { id: "spinback",     label: "스핀백",  key: "b" },
  { id: "reversecymbal",label: "역심벌",  key: "n" },
  { id: "stutter",      label: "스터터",  key: "m" },
  { id: "bassroar",     label: "베이스붐", key: "g" },
  // 행 3 — 신규: 드롭·분위기
  { id: "foghorn",      label: "배경적",  key: "h" },
  { id: "scratch",      label: "스크래치", key: "j" },
  { id: "laser",        label: "레이저",  key: "t" },
  { id: "explosion",    label: "폭발",    key: "y" },
  // 행 4 — 추가: 빌드업·전환
  { id: "snareroll",    label: "스네어롤", key: "a" },
  { id: "downsweep",    label: "다운스윕", key: "s" },
  { id: "wobble",       label: "워블",    key: "d" },
  { id: "clapbomb",     label: "클랩붐",  key: "f" },
  // 행 5 — 추가: 분위기·퍼포먼스
  { id: "ravehorn",     label: "레이브혼", key: "q" },
  { id: "phasersweep",  label: "플랜저",  key: "w" },
  { id: "ricochet",     label: "리코셋",  key: "e" },
  { id: "reversekick",  label: "역킥",    key: "r" },
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
    id: "edmAnthem",
    name: "⚡ EDM Festival Anthem (EDM 페스티벌 앤섬)",
    description: "웅장한 인트로, 고조되는 빌드업, 화려한 신스 리드 드랍 (120초)",
    bpm: 128,
    bars: 64,
  },
  {
    id: "futureBass",
    name: "✨ Melodic Future Bass Drop (멜로딕 퓨처 베이스)",
    description: "감성적인 코드 패드, 긴장감 있는 스네어 롤, 거대한 베이스 드랍 (110초)",
    bpm: 140,
    bars: 64,
  },
  {
    id: "electroHouse",
    name: "🔥 Electro House Peak Time (일렉트로 하우스)",
    description: "질주하는 비트, 카리스마 넘치는 테크노 리드, 레이저 효과음 피크 (120초)",
    bpm: 128,
    bars: 64,
  },
] as const satisfies ReadonlyArray<{
  id: string;
  name: string;
  description: string;
  bpm: number;
  bars: number;
}>;

export type SampleId = (typeof SAMPLE_LIBRARY)[number]["id"];

/** 드럼 비트 프리셋 — 시퀀서에 즉시 불러올 수 있는 패턴 모음 */
export interface DrumBeatPreset {
  id: string;
  name: string;
  description: string;
  bpm: number;
  pattern: Partial<Record<DrumSoundId, boolean[]>>;
}

export const DRUM_BEAT_PRESETS: DrumBeatPreset[] = [
  {
    id: "pop44",
    name: "팝 4/4",
    description: "킥·스네어·하이햇 기본 비트",
    bpm: 120,
    pattern: {
      kick:        [true,  false, false, false, false, false, false, false, true,  false, false, false, false, false, false, false],
      snare:       [false, false, false, false, true,  false, false, false, false, false, false, false, true,  false, false, false],
      hihatClosed: [true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  false],
      hihatOpen:   [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true ],
      tomLow:      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      tomMid:      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      tomHigh:     [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      crash:       [true,  false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      ride:        [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      clap:        [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      rimshot:     [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      cowbell:     [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      shaker:      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      conga:       [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      bongo:       [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      perc:        [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
  },
  {
    id: "hiphop",
    name: "힙합 그루브",
    description: "싱코페이션 킥 + 클랩 + 16비트 하이햇",
    bpm: 90,
    pattern: {
      kick:        [true,  false, false, false, false, false, true,  false, false, true,  false, false, false, false, false, false],
      snare:       [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      hihatClosed: [true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  false],
      hihatOpen:   [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true ],
      tomLow:      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      tomMid:      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      tomHigh:     [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      crash:       [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      ride:        [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      clap:        [false, false, false, false, true,  false, false, false, false, false, false, false, true,  false, false, false],
      rimshot:     [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      cowbell:     [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      shaker:      [false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true ],
      conga:       [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      bongo:       [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      perc:        [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
  },
  {
    id: "dembow",
    name: "레게톤 (Dembow)",
    description: "데밍보우 + 클랩 라틴 리듬",
    bpm: 100,
    pattern: {
      kick:        [true,  false, false, false, false, false, false, false, true,  false, false, false, false, false, false, false],
      snare:       [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      hihatClosed: [true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  false],
      hihatOpen:   [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      tomLow:      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      tomMid:      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      tomHigh:     [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      crash:       [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      ride:        [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      clap:        [false, false, false, false, false, false, true,  false, false, false, true,  false, false, false, false, false],
      rimshot:     [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      cowbell:     [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      shaker:      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      conga:       [true,  false, false, false, false, false, false, true,  false, false, false, false, false, false, true,  false],
      bongo:       [false, false, false, true,  false, false, false, false, false, false, false, true,  false, false, false, false],
      perc:        [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
  },
  {
    id: "edm_festival",
    name: "⚡ EDM 페스티벌 앤섬",
    description: "웅장한 EDM 킥, 클랩, 레이저 & 보컬 찬트 루프",
    bpm: 128,
    pattern: {
      kickEdm:     [true,  false, false, false, true,  false, false, false, true,  false, false, false, true,  false, false, false],
      clapEdm:     [false, false, false, false, true,  false, false, false, false, false, false, false, true,  false, false, false],
      hihatClosed: [false, false, true,  false, false, false, true,  false, false, false, true,  false, false, false, true,  false],
      synthPluck:  [true,  false, true,  false, false, true,  false, true,  true,  false, true,  false, false, true,  false, true ],
      fxLaser:     [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true,  false],
      vocalHey:    [false, false, false, true,  false, false, false, true,  false, false, false, true,  false, false, false, false],
    },
  },
  {
    id: "future_bass",
    name: "✨ 퓨처 베이스 드랍",
    description: "싱코페이션 비트 + 붐 서브베이스 + 업리프터 빌드업",
    bpm: 140,
    pattern: {
      kickEdm:     [true,  false, false, false, false, false, true,  false, false, false, false, false, false, true,  false, false],
      clapEdm:     [false, false, false, false, true,  false, false, false, false, false, false, false, true,  false, false, false],
      hihatOpen:   [false, false, true,  false, false, false, true,  false, false, false, true,  false, false, false, true,  false],
      bassDrop:    [true,  false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      synthLead:   [false, false, false, true,  false, true,  false, false, true,  false, true,  false, false, false, true,  false],
      fxUplifter:  [true,  false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
  },
  {
    id: "electro_house",
    name: "🔥 일렉트로 하우스 피크",
    description: "질주하는 일렉트로 리드, 림샷 그루브 & 다운 필터",
    bpm: 128,
    pattern: {
      kickEdm:     [true,  false, false, false, true,  false, false, false, true,  false, false, false, true,  false, false, false],
      rimEdm:      [false, false, false, false, false, false, true,  false, false, false, false, true,  false, false, false, false],
      hihatClosed: [true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  false],
      hihatOpen:   [false, false, true,  false, false, false, true,  false, false, false, true,  false, false, false, true,  false],
      synthLead:   [true,  false, false, true,  false, false, true,  false, true,  false, false, true,  false, false, true,  false],
      vocalGo:     [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true,  false],
      fxDownlifter:[true,  false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
  },
];
