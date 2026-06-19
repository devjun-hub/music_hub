"use client";

import type { Pattern } from "@/audio/drumLoop";
import { LabeledSlider } from "@/components/LabeledSlider";
import {
  DRUM_SOUNDS,
  DRUM_SWING_MAX,
  DRUM_SWING_MIN,
  DRUM_SWING_STEP,
  STEP_COUNT,
  type DrumBankId,
  type DrumSoundId,
} from "@/lib/constants";
import { BankSelector } from "./BankSelector";

interface StepSequencerProps {
  pattern: Pattern;
  isPlaying: boolean;
  currentStep: number;
  onToggleStep: (id: DrumSoundId, step: number) => void;
  onPlay: () => void;
  onStop: () => void;
  onClear: () => void;
  banks: Record<DrumBankId, Pattern>;
  activeBank: DrumBankId;
  onBankChange: (bank: DrumBankId) => void;
  swing: number;
  onSwingChange: (value: number) => void;
  selectedSoundId: DrumSoundId;
  onSelectedSoundChange: (id: DrumSoundId) => void;
}

const formatPercent = (value: number) => `${value}%`;

/** MPC 스타일 단일 행 16스텝 패턴 에디터 + 재생/정지/클리어/뱅크/스윙 컨트롤 */
export function StepSequencer({
  pattern,
  isPlaying,
  currentStep,
  onToggleStep,
  onPlay,
  onStop,
  onClear,
  banks,
  activeBank,
  onBankChange,
  swing,
  onSwingChange,
  selectedSoundId,
  onSelectedSoundChange,
}: StepSequencerProps) {
  const activeSound = DRUM_SOUNDS.find((s) => s.id === selectedSoundId) || DRUM_SOUNDS[0];

  return (
    <div
      className="space-y-3 rounded-2xl border p-3.5 flex-none"
      style={{
        background: "linear-gradient(135deg, #27272a 0%, #18181b 100%)",
        borderColor: "#3f3f46",
        boxShadow: "inset 0 1px 3px rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.5)"
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 select-none">
          <h2 className="text-xs font-black tracking-widest text-zinc-400 uppercase">STEP SEQUENCER</h2>
          <span className="text-[8px] font-bold text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/40">
            1-CH EDIT
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={isPlaying ? onStop : onPlay}
            aria-pressed={isPlaying}
            className={`h-8 min-w-16 rounded px-3.5 text-[10px] font-black uppercase tracking-wider transition-all border ${
              isPlaying
                ? "bg-emerald-500 border-emerald-300 text-black shadow-[0_0_10px_#10b981]"
                : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
            }`}
            style={{ borderWidth: "1.5px" }}
          >
            {isPlaying ? "STOP" : "PLAY"}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="h-8 rounded border border-zinc-700 bg-zinc-800 px-3.5 text-[10px] font-black uppercase tracking-wider text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
            style={{ borderWidth: "1.5px" }}
          >
            CLEAR
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-black/40 p-2 rounded-lg border border-zinc-800/40">
        <BankSelector banks={banks} activeBank={activeBank} onChange={onBankChange} />
        <div className="min-w-40 flex-1">
          <LabeledSlider
            label="SWING"
            value={swing}
            min={DRUM_SWING_MIN}
            max={DRUM_SWING_MAX}
            step={DRUM_SWING_STEP}
            onChange={onSwingChange}
            formatValue={formatPercent}
            ariaLabel="스윙(그루브) 비율"
          />
        </div>
      </div>

      {/* 단일 행 스텝 편집기 */}
      <div
        className="space-y-2.5 rounded-xl border p-3"
        style={{
          background: "linear-gradient(180deg, #090e1a 0%, #02040a 100%)", // OLED dark screen look
          borderColor: "#1e293b",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8)"
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-[9px] font-black text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/30 uppercase tracking-widest select-none">
              {activeSound.shortLabel}
            </span>
            <span className="text-xs font-bold text-slate-300 select-none">{activeSound.label.toUpperCase()}</span>
          </div>
          <label className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
            <span>TARGET PIECE:</span>
            <select
              value={selectedSoundId}
              onChange={(e) => onSelectedSoundChange(e.target.value as DrumSoundId)}
              className="bg-slate-950 border border-slate-800 text-[10px] rounded px-2 py-0.5 outline-none font-bold text-cyan-400 focus:border-cyan-500 cursor-pointer"
            >
              {DRUM_SOUNDS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} ({s.key.toUpperCase()})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="overflow-x-auto py-1">
          <div className="flex items-center justify-between gap-1 w-full min-w-[280px]">
            {Array.from({ length: STEP_COUNT }, (_, step) => {
              const isActive = pattern[selectedSoundId]?.[step] ?? false;
              const isCurrent = step === currentStep;
              const isAccent = step % 4 === 0;
              return (
                <div key={step} className="flex-1 flex flex-col items-center gap-1.5">
                  {/* 스텝 숫자 라벨 */}
                  <span className={`text-[8px] font-mono select-none ${isCurrent ? "text-yellow-400 font-bold" : "text-slate-500"}`}>
                    {(step + 1).toString().padStart(2, '0')}
                  </span>

                  <button
                    type="button"
                    aria-label={`${activeSound.label} ${step + 1}번 스텝 ${isActive ? "켜짐" : "꺼짐"}`}
                    aria-pressed={isActive}
                    onClick={() => onToggleStep(selectedSoundId, step)}
                    className={`w-full aspect-square min-w-[1.25rem] max-w-[2.25rem] rounded transition-all duration-75 active:scale-95 border ${
                      isActive
                        ? "bg-cyan-500 border-cyan-300 shadow-[0_0_8px_#06b6d4]"
                        : isAccent
                          ? "bg-zinc-800 border-zinc-600 shadow-[0_1.5px_0_#18181b]"
                          : "bg-zinc-900 border-zinc-800 shadow-[0_1.5px_0_#18181b]"
                    }`}
                    style={{
                      borderWidth: "1.5px",
                      outline: isCurrent ? "2px solid #eab308" : "none",
                      outlineOffset: "1.5px",
                    }}
                  />
                  
                  {/* 스텝 작동 런닝 라이트 */}
                  <span className={`h-1 w-1 rounded-full ${
                    isCurrent 
                      ? "bg-yellow-400 shadow-[0_0_4px_#eab308]" 
                      : isActive 
                        ? "bg-cyan-400/40" 
                        : "bg-transparent"
                  }`} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
