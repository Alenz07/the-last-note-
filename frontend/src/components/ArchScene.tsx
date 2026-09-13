import { existsSync } from 'node:fs';
import path from 'node:path';
import type { ReactNode } from 'react';

/**
 * The candlelit archway behind the hero. Uses the real artwork if the owner
 * drops it at public/hero.jpg; otherwise draws receding arch strokes over the
 * gradient glow — zero image bytes. Server components only.
 */
const HERO_IMG = existsSync(path.join(process.cwd(), 'public', 'hero.jpg')) ? '/hero.jpg' : null;

export function ArchScene({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`arch-scene ${className}`}>
      {HERO_IMG ? (
        // eslint-disable-next-line @next/next/no-img-element -- decorative, masked backdrop
        <img src={HERO_IMG} alt="" className="arch-img" loading="eager" decoding="async" />
      ) : (
        <svg className="arch-lines" viewBox="0 0 300 240" preserveAspectRatio="xMidYMax meet" aria-hidden>
          {[
            { w: 220, h: 230, o: 0.55, sw: 1.2 },
            { w: 170, h: 196, o: 0.45, sw: 1.05 },
            { w: 128, h: 166, o: 0.36, sw: 0.9 },
            { w: 94, h: 140, o: 0.27, sw: 0.8 },
            { w: 66, h: 118, o: 0.18, sw: 0.7 },
          ].map(({ w, h, o, sw }, i) => {
            const x = (300 - w) / 2;
            const r = w / 2;
            return (
              <path
                key={i}
                d={`M ${x} 240 V ${240 - h + r} A ${r} ${r} 0 0 1 ${x + w} ${240 - h + r} V 240`}
                stroke="currentColor"
                strokeWidth={sw}
                fill="none"
                opacity={o}
              />
            );
          })}
          <line x1="10" y1="240" x2="290" y2="240" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
        </svg>
      )}
      {children}
    </div>
  );
}
