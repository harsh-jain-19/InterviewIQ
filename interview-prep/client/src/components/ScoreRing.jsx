export default function ScoreRing({ value, size = 140, label }) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const color = value >= 75 ? 'var(--good)' : value >= 50 ? 'var(--warn)' : 'var(--bad)';
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`Score ${value} out of 100`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="10" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset .9s ease' }}
        />
      </svg>
      <div className="ring-text">
        <strong>{value}</strong>
        <span>{label || 'out of 100'}</span>
      </div>
    </div>
  );
}
