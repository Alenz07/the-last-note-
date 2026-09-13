/** Gold line icons (stroke = currentColor), matching the reference look. */
type P = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export const QuillIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M20 4c-6.5.6-11.2 3.4-13.6 8.2C5.2 14.6 4.6 17 4.5 19.5c2.5-.1 4.9-.7 7.3-1.9C16.6 15.2 19.4 10.5 20 4Z" />
    <path d="M4.5 19.5C8 13.5 12 9.5 16.5 7" />
  </svg>
);

export const EyeIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const ChainIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M10 14a4.2 4.2 0 0 0 6 0l3-3a4.24 4.24 0 0 0-6-6l-1.5 1.5" />
    <path d="M14 10a4.2 4.2 0 0 0-6 0l-3 3a4.24 4.24 0 0 0 6 6L12.5 17.5" />
  </svg>
);

export const LockIcon = ({ size = 15, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="5" y="10.5" width="14" height="9" rx="2" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </svg>
);

export const HeartIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 20s-7.5-4.6-9.3-9A5.2 5.2 0 0 1 12 7.4 5.2 5.2 0 0 1 21.3 11c-1.8 4.4-9.3 9-9.3 9Z" />
  </svg>
);

export const StarIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="m12 3.5 2.5 5.4 5.9.6-4.4 4 1.2 5.8L12 16.4l-5.2 2.9 1.2-5.8-4.4-4 5.9-.6L12 3.5Z" />
  </svg>
);

export const BookIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 6.5C10.5 5 8.2 4.5 5.5 4.5c-.9 0-1.7.1-2.5.3v13.7c.8-.2 1.6-.3 2.5-.3 2.7 0 5 .6 6.5 2 1.5-1.4 3.8-2 6.5-2 .9 0 1.7.1 2.5.3V4.8c-.8-.2-1.6-.3-2.5-.3-2.7 0-5 .5-6.5 2Z" />
    <path d="M12 6.5v13.7" />
  </svg>
);

export const MaskIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3.5 8.5c2.7-.8 5.6-1.2 8.5-1.2s5.8.4 8.5 1.2c0 4.5-1.6 8.2-4.2 8.2-1.6 0-2.6-1.2-4.3-1.2s-2.7 1.2-4.3 1.2c-2.6 0-4.2-3.7-4.2-8.2Z" />
    <circle cx="8.5" cy="11.5" r="0.6" fill="currentColor" />
    <circle cx="15.5" cy="11.5" r="0.6" fill="currentColor" />
  </svg>
);

export const PersonIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5" />
  </svg>
);

export const BoltIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12l1-8Z" />
  </svg>
);

export const WhatsAppIcon = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3.5 20.5l1.3-4.4A8.2 8.2 0 1 1 8 19.3l-4.5 1.2Z" />
    <path d="M9 9.2c.2 1 .7 2 1.5 2.8s1.8 1.3 2.8 1.5l.9-1.1 1.9.9c-.2.9-1 1.5-1.9 1.5-2.9-.2-5.3-2.6-5.5-5.5 0-.9.6-1.7 1.5-1.9l.9 1.9-1 .9Z" />
  </svg>
);

export const InstagramIcon = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <circle cx="12" cy="12" r="3.8" />
    <circle cx="16.9" cy="7.1" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const MailIcon = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="m3.9 7.2 7 5.2a2 2 0 0 0 2.2 0l7-5.2" />
  </svg>
);

export const DownloadIcon = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3.5v11" />
    <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
    <path d="M4.5 19.5h15" />
  </svg>
);

export const ShieldIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3 5 5.8v5.4c0 4.4 2.9 7.6 7 9.3 4.1-1.7 7-4.9 7-9.3V5.8L12 3Z" />
    <path d="m9 12 2 2 4-4.5" />
  </svg>
);

/**
 * The glyph for a chain, chosen by slug. A component (not a factory) so it is
 * never constructed during render — unknown chains fall back to the quill.
 */
export function ChainGlyph({ slug, size = 20, className }: P & { slug: string }) {
  switch (slug) {
    case 'confess':
      return <HeartIcon size={size} className={className} />;
    case 'advice':
      return <StarIcon size={size} className={className} />;
    case 'story':
      return <BookIcon size={size} className={className} />;
    default:
      return <QuillIcon size={size} className={className} />;
  }
}
