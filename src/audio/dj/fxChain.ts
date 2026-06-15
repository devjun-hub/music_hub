import * as Tone from "tone";
import {
  DEFAULT_ECHO_WET,
  DEFAULT_REVERB_WET,
  DJ_FILTER_BYPASS_HIGH_HZ,
  DJ_FILTER_BYPASS_LOW_HZ,
  DJ_FILTER_HIGHPASS_MAX_HZ,
  DJ_FILTER_LOWPASS_MIN_HZ,
  ECHO_FEEDBACK,
  REVERB_DECAY,
  type DjEchoDivision,
} from "@/lib/constants";

/** 필터/에코/리버브 파라미터를 부드럽게 적용하는 램프 시간(초). 클릭 노이즈를 방지한다. */
const RAMP_SECONDS = 0.05;

/**
 * DJ 덱 1개 분량의 FX 체인: Filter(필터 스윕) → FeedbackDelay(에코) → Reverb.
 * record 섹션의 CellEffectsChain과 동일하게, echo/reverb는 wet=0으로 두면 사실상 바이패스된다.
 * 필터는 항상 인라인이며 value=0 부근에서 거의 음향 변화가 없도록 설계했다.
 */
export interface DeckFxChain {
  /** EQ 출력 등을 연결할 입력단 (Filter) */
  readonly input: Tone.ToneAudioNode;
  /** 채널 볼륨으로 이어지는 출력단 (Reverb) */
  readonly output: Tone.ToneAudioNode;
  /** -1(로우패스 완전 닫힘) ~ 0(바이패스) ~ 1(하이패스 완전 닫힘) */
  setFilter(value: number): void;
  setEchoEnabled(enabled: boolean): void;
  setEchoWet(wet: number): void;
  setEchoDivision(division: DjEchoDivision): void;
  /** 현재 effectiveBpm과 분음 설정으로 딜레이 타임을 재계산한다. */
  setEchoBpm(effectiveBpm: number): void;
  setReverbEnabled(enabled: boolean): void;
  setReverbWet(wet: number): void;
  dispose(): void;
}

export function createDeckFxChain(): DeckFxChain {
  const filter = new Tone.Filter(DJ_FILTER_BYPASS_HIGH_HZ, "lowpass");
  const echo = new Tone.FeedbackDelay({ delayTime: 0.25, feedback: ECHO_FEEDBACK, wet: 0 });
  const reverb = new Tone.Reverb({ decay: REVERB_DECAY, wet: 0 });
  // 임펄스 리스폰스 생성은 비동기. 생성 전까지는 wet=0이라 무음 상태로 안전하다.
  void reverb.generate();

  filter.chain(echo, reverb);

  let echoEnabled = false;
  let echoWet = DEFAULT_ECHO_WET;
  let echoDivision: DjEchoDivision = 8;
  let echoBpm = 120;
  let reverbEnabled = false;
  let reverbWet = DEFAULT_REVERB_WET;

  function applyEchoDelayTime(): void {
    const seconds = (60 / echoBpm) * (4 / echoDivision);
    echo.delayTime.rampTo(seconds, RAMP_SECONDS);
  }

  return {
    input: filter,
    output: reverb,

    setFilter(value) {
      if (value <= 0) {
        filter.type = "lowpass";
        const ratio = DJ_FILTER_LOWPASS_MIN_HZ / DJ_FILTER_BYPASS_HIGH_HZ;
        const freq = DJ_FILTER_BYPASS_HIGH_HZ * Math.pow(ratio, -value);
        filter.frequency.rampTo(freq, RAMP_SECONDS);
      } else {
        filter.type = "highpass";
        const ratio = DJ_FILTER_HIGHPASS_MAX_HZ / DJ_FILTER_BYPASS_LOW_HZ;
        const freq = DJ_FILTER_BYPASS_LOW_HZ * Math.pow(ratio, value);
        filter.frequency.rampTo(freq, RAMP_SECONDS);
      }
    },

    setEchoEnabled(enabled) {
      echoEnabled = enabled;
      echo.wet.rampTo(enabled ? echoWet : 0, RAMP_SECONDS);
    },
    setEchoWet(wet) {
      echoWet = wet;
      if (echoEnabled) echo.wet.rampTo(wet, RAMP_SECONDS);
    },
    setEchoDivision(division) {
      echoDivision = division;
      applyEchoDelayTime();
    },
    setEchoBpm(effectiveBpm) {
      echoBpm = effectiveBpm;
      applyEchoDelayTime();
    },

    setReverbEnabled(enabled) {
      reverbEnabled = enabled;
      reverb.wet.rampTo(enabled ? reverbWet : 0, RAMP_SECONDS);
    },
    setReverbWet(wet) {
      reverbWet = wet;
      if (reverbEnabled) reverb.wet.rampTo(wet, RAMP_SECONDS);
    },

    dispose() {
      filter.dispose();
      echo.dispose();
      reverb.dispose();
    },
  };
}
