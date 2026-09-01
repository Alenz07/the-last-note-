import { existsSync } from 'node:fs';
import path from 'node:path';
import type { ReactNode } from 'react';

/**
 * The glowing corridor from the reference art. If the real artwork exists at
 * public/hero.jpg it is used (dimmed + masked so ivory text stays readable);
 * otherwise the scene is drawn from gradients + receding arch strokes — zero
 * bytes of image, fine on 3G. Server components only (reads the filesystem).
 */
const HERO_IMG = existsSync(path.join(process.cwd(), 'public', 'hero.jpg')) ? '/hero.jpg' : null;

export function HeroScene({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`hero-scene ${className}`}>
      {HERO_IMG ? (
        // eslint-disable-next-line @next/next/no-img-element -- decorative backdrop, masked & dimmed
        <img src={HERO_IMG} alt="" className="hero-img" loading="lazy" decoding="async" />
      ) : (
        <svg className="arches" viewBox="0 0 400 220" preserveAspectRatio="xMidYMax meet" aria-hidden>
          {[
            { w: 300, h: 210, o: 0.5, sw: 1.1 },
            { w: 232, h: 178, o: 0.42, sw: 1 },
            { w: 176, h: 150, o: 0.34, sw: 0.9 },
            { w: 130, h: 126, o: 0.26, sw: 0.8 },
            { w: 94, h: 106, o: 0.18, sw: 0.7 },
          ].map(({ w, h, o, sw }, i) => {
            const x = (400 - w) / 2;
            const r = w / 2;
            return (
              <path
                key={i}
                d={`M ${x} 220 V ${220 - h + r} A ${r} ${r} 0 0 1 ${x + w} ${220 - h + r} V 220`}
                stroke="currentColor"
                strokeWidth={sw}
                fill="none"
                opacity={o}
              />
            );
          })}
          <line x1="40" y1="220" x2="360" y2="220" stroke="currentColor" strokeWidth="0.8" opacity="0.35" />
        </svg>
      )}
      {children}
    </div>
  );
}
