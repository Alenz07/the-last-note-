const IN = new Intl.NumberFormat('en-IN');

export const formatCount = (n: number) => IN.format(n);
export const formatPosition = (n: number) => `#${IN.format(n)}`;
export const rupees = (paise: number) => `₹${Math.round(paise / 100)}`;

/** 600 → "10:00" */
export const mmss = (totalSeconds: number) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function timeAgo(from: Date | string | number, now: Date = new Date()): string {
  const s = Math.max(0, Math.floor((now.getTime() - new Date(from).getTime()) / 1000));
  if (s < 60) return `${s} seconds ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return m === 1 ? '1 min ago' : `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return h === 1 ? '1 hour ago' : `${h} hours ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}
