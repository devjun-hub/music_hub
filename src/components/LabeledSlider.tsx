"use client";

interface LabeledSliderProps {
  /** 슬라이더 왼쪽에 표시할 짧은 라벨. 같은 패널 내 정렬을 위해 빈 문자열도 허용한다. */
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** 오른쪽 값 표시 포맷. 기본은 그대로 숫자 출력. */
  formatValue?: (value: number) => string;
  ariaLabel: string;
  disabled?: boolean;
}

/** 가로형 range 슬라이더 + 좌측 라벨 + 우측 고정폭 값 표시. EQ/피치/볼륨/팬/크로스페이더가 공유한다. */
export function LabeledSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  ariaLabel,
  disabled,
}: LabeledSliderProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 shrink-0 text-xs font-medium text-foreground-muted">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={ariaLabel}
        className="h-6 flex-1 accent-accent-active disabled:opacity-40"
      />
      <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums text-foreground-muted">
        {formatValue ? formatValue(value) : value}
      </span>
    </div>
  );
}
