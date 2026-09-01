import { teaser } from '@/lib/copy';
import { ChainIcon, EyeIcon, QuillIcon } from './Icons';

const ICONS = [QuillIcon, EyeIcon, ChainIcon];
const TITLES = ['Write', 'Reveal', 'Continue'];

/**
 * The reference's step column: gold-ringed icons joined by a hairline,
 * title + the existing howItWorks line as description.
 */
export function HowItWorks({ className = '' }: { className?: string }) {
  return (
    <section className={className}>
      <h2 className="section-title">How it works</h2>
      <ol className="mx-auto mt-7 flex max-w-sm flex-col">
        {teaser.howItWorks.map((line, i) => {
          const Icon = ICONS[i] ?? ChainIcon;
          const last = i === teaser.howItWorks.length - 1;
          return (
            <li key={line} className="relative flex gap-4 pb-8 last:pb-0">
              {!last ? <span aria-hidden className="absolute left-[1.4rem] top-12 bottom-0 w-px bg-line" /> : null}
              <span className="seal-ring h-11 w-11 shrink-0">
                <Icon size={19} />
              </span>
              <div className="pt-0.5">
                <h3 className="text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-accent">{TITLES[i] ?? ''}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">{line}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
