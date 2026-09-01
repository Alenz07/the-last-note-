import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

/**
 * One button per screen, full width, price in the label. `primary` is the only
 * place the accent colour appears. Flow components (PayButton, Composer) reuse
 * the same classes — `.btn .btn-primary` / `.btn .btn-ghost` — from globals.css.
 */
type Variant = 'primary' | 'ghost';

const cls = (variant: Variant, className: string) => `btn btn-${variant} ${className}`;

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: ComponentProps<'button'> & { variant?: Variant; children: ReactNode }) {
  return (
    <button type="button" {...rest} className={cls(variant, className)}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; children: ReactNode }) {
  return (
    <Link {...rest} className={cls(variant, className)}>
      {children}
    </Link>
  );
}
