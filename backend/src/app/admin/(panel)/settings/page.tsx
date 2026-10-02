import { getSettings } from '@/lib/settings';
import { saveSettingsAction } from '../../actions';

/** Always the live row — a cached settings page is a lie about the site. */
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Settings' };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const s = await getSettings();

  return (
    <div className="grid max-w-2xl gap-6">
      <div>
        <h1 className="display text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Live knobs. Saving takes effect on the public site within about five seconds — no rebuild, no restart.
        </p>
      </div>

      {saved ? (
        <p className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">Saved.</p>
      ) : null}

      <form action={saveSettingsAction} className="grid gap-5">
        <label className="flex items-start gap-3 rounded-xl border border-line p-4">
          <input type="checkbox" name="freeMode" defaultChecked={s.freeMode} className="mt-1 h-4 w-4 shrink-0" />
          <span>
            <span className="block font-semibold text-ink">Free mode</span>
            <span className="mt-1 block text-sm leading-relaxed text-ink-muted">
              No gateway is used and nothing is charged. The public site says so everywhere a price appears, and the
              reveal sheet becomes a timed hold instead of a checkout. Turn this off to start taking money.
            </span>
          </span>
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-ink-muted">Free banner</span>
          <input className="field" name="freeBanner" defaultValue={s.freeBanner} maxLength={160} />
          <span className="text-xs text-ink-faint">Shown on the landing, the chain list and every chain page while free mode is on.</span>
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-ink-muted">Reveal hold (seconds)</span>
          <input
            className="field"
            type="number"
            name="revealHoldSeconds"
            min={0}
            max={120}
            defaultValue={s.revealHoldSeconds}
          />
          <span className="text-xs text-ink-faint">
            How long the sheet waits before the note opens, in free mode. Zero opens it immediately.
          </span>
        </label>

        <div>
          <button type="submit" className="btn btn-primary !w-auto !px-8">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
