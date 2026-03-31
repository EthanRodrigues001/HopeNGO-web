import React from "react";

interface Props {
  current: number;
  max: number | null;
}

export function SeatProgressBar({ current, max }: Props) {
  if (!max) return <p className="text-sm text-neutral-400">Unlimited seats</p>;

  const pct = Math.min((current / max) * 100, 100);
  const color = pct < 70 ? 'bg-emerald-500' : pct < 90 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-neutral-400">
        <span>{current} registered</span>
        <span>{max - current} left</span>
      </div>
      <div className="w-full bg-neutral-800 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-300 shadow-[0_0_10px_currentColor] opacity-80`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
