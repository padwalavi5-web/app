interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

// Renders a circular progress ring with the current value centered inside.
const CircularProgress = ({ value, max, size = 120, strokeWidth = 8, color = '#16a34a' }: CircularProgressProps) => {
  const safeMax = Math.max(max, 1);
  const safeValue = Math.max(0, Math.min(value, safeMax));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = safeValue / safeMax;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <div
        className="circular-progress-inner absolute rounded-full"
        style={{ '--progress-inner-size': `${size * 0.78}px` } as React.CSSProperties}
      />
      <svg width={size} height={size} className="-rotate-90 drop-shadow-[0_16px_26px_rgba(15,118,110,0.14)]">
        <defs>
          <linearGradient id="progressTrack" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <linearGradient id="progressFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressTrack)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressFill)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold text-slate-800">{safeValue.toFixed(1)}</span>
        <span className="mt-1 text-sm text-slate-500">מתוך {safeMax}</span>
      </div>
    </div>
  );
};

export default CircularProgress;
