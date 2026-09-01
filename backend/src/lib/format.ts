const IN = new Intl.NumberFormat('en-IN');

/** "#4,372" — Indian grouping; tabular numerals come from CSS (.num). */
export const formatPosition = (n: number) => `#${IN.format(n)}`;

export const formatCount = (n: number) => IN.format(n);

/** Terse relative time for "last link 2 min ago". Never finer than minutes past 60 s. */
export function timeAgo(from: Date | string | number, now: Date = new Date()): string {
  const s = Math.max(0, Math.floor((now.getTime() - new Date(from).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

/** 600 -> "10:00" */
export const mmss = (totalSeconds: number) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
