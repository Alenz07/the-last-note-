'use client';

const KEY = 'dernote-theme';
const GROUND = { dark: '#090a0c', light: '#f8f4f3' } as const;

/**
 * Dark is the default and stays that way — this only records an explicit
 * choice. The inline script in the layout reads the same key before paint,
 * and so do the legal pages the backend serves on this origin.
 *
 * No state on purpose: both icons render and CSS shows the one matching
 * data-theme. The server cannot know which theme this browser picked, so
 * anything held in React state would either mismatch on hydration or blink
 * the wrong icon until the effect ran.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    // Keeps the phone's status bar in step with the page beneath it.
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', GROUND[next]);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private mode — the choice just does not survive the tab */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark"
      title="Switch between light and dark"
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-ink-muted transition-colors hover:border-line-gold hover:text-gold ${className}`}
    >
      <svg className="theme-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
      </svg>
      <svg className="theme-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20 13.5A8.5 8.5 0 1 1 10.5 4a6.8 6.8 0 0 0 9.5 9.5Z" />
      </svg>
    </button>
  );
}
