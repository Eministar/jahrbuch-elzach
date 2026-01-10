'use client';

import { useEffect, useRef } from 'react';
import clsx from 'clsx';

type Props = {
  className?: string;
};

// Animated aurora gradient background mit warmen Farben
export default function Aurora({ className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const isCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches;
    if (prefersReduced || isCoarsePointer) return;
    let raf = 0;
    let t = 0;
    const loop = () => {
      t += 0.002;
      const x = Math.sin(t) * 15;
      const y = Math.cos(t * 0.8) * 15;
      el.style.backgroundPosition = `${50 + x}% ${50 + y}%`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      className={clsx(
        'hidden md:block pointer-events-none absolute inset-0 -z-20 md:opacity-40',
        'bg-[radial-gradient(1200px_600px_at_10%_10%,rgba(217,119,87,0.15),transparent_60%),_radial-gradient(800px_500px_at_90%_20%,rgba(122,155,136,0.12),transparent_60%),_radial-gradient(900px_600px_at_30%_90%,rgba(201,104,70,0.10),transparent_60%)]',
        className,
      )}
      aria-hidden="true"
    />
  );
}
