import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const topCurtainRef = useRef<HTMLDivElement>(null);
  const bottomCurtainRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const originRef = useRef<HTMLSpanElement>(null);
  const hasRun = useRef(false);

  const animate = useCallback(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const container = containerRef.current;
    const topCurtain = topCurtainRef.current;
    const bottomCurtain = bottomCurtainRef.current;
    const counter = counterRef.current;
    const brand = brandRef.current;
    const line = lineRef.current;
    const tagline = taglineRef.current;
    const origin = originRef.current;

    if (!container || !topCurtain || !bottomCurtain || !counter || !brand || !line || !tagline || !origin) {
      onComplete();
      return;
    }

    const chars = brand.querySelectorAll('.char');
    const tl = gsap.timeline();

    // Phase 1: Counter counts up 0 → 100
    const counterObj = { value: 0 };
    tl.to(counterObj, {
      value: 100,
      duration: 2.0,
      ease: 'power2.inOut',
      onUpdate: () => {
        counter.textContent = String(Math.round(counterObj.value)).padStart(3, '0');
      },
    })

    // Phase 2: Golden accent line grows (starts at 40% through counter)
    .fromTo(line,
      { scaleX: 0 },
      { scaleX: 1, duration: 1.4, ease: 'power3.inOut' },
      0.8
    )

    // Phase 3: Brand name characters stagger in
    .fromTo(chars,
      { y: 80, opacity: 0, rotateX: -90 },
      {
        y: 0,
        opacity: 1,
        rotateX: 0,
        stagger: 0.06,
        duration: 0.9,
        ease: 'power4.out',
      },
      1.0
    )

    // Phase 4: Origin label fades in
    .fromTo(origin,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
      1.6
    )

    // Phase 5: Tagline fades in
    .fromTo(tagline,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' },
      1.9
    )

    // Phase 6: Counter fades out
    .to(counter, {
      opacity: 0,
      y: -20,
      duration: 0.4,
      ease: 'power2.in',
    }, 2.4)

    // Phase 7: Hold for a beat, then everything scales up slightly & fades
    .to([brand, line, tagline, origin], {
      scale: 1.05,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.in',
      stagger: 0.04,
    }, 2.8)

    // Phase 8: Dual curtain wipe — top goes up, bottom goes down
    .to(topCurtain, {
      yPercent: -100,
      duration: 0.8,
      ease: 'power3.inOut',
    }, 3.3)
    .to(bottomCurtain, {
      yPercent: 100,
      duration: 0.8,
      ease: 'power3.inOut',
    }, 3.3)

    // Phase 9: Complete — remove from DOM
    .call(() => {
      onComplete();
    }, [], 4.0);

  }, [onComplete]);

  useEffect(() => {
    // Small delay to let fonts load and render settle
    const timer = requestAnimationFrame(() => {
      animate();
    });

    // Safety fallback — if animation somehow stalls, complete after 5s
    const fallback = setTimeout(() => {
      onComplete();
    }, 5500);

    return () => {
      cancelAnimationFrame(timer);
      clearTimeout(fallback);
    };
  }, [animate, onComplete]);

  const brandText = 'Silonka';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      aria-hidden="true"
    >
      {/* Top curtain */}
      <div
        ref={topCurtainRef}
        className="absolute top-0 left-0 w-full h-1/2 z-[9999]"
        style={{ backgroundColor: '#0B0B0C' }}
      />

      {/* Bottom curtain */}
      <div
        ref={bottomCurtainRef}
        className="absolute bottom-0 left-0 w-full h-1/2 z-[9999]"
        style={{ backgroundColor: '#0B0B0C' }}
      />

      {/* Content layer — sits between curtains */}
      <div className="absolute inset-0 z-[10000] flex flex-col items-center justify-center">
        {/* Counter */}
        <span
          ref={counterRef}
          className="font-mono text-[13px] tracking-[0.3em] uppercase mb-8"
          style={{ color: '#D4A03A' }}
        >
          000
        </span>

        {/* Brand name with character-level animation */}
        <div
          ref={brandRef}
          className="overflow-hidden mb-4"
          style={{ perspective: '600px' }}
        >
          <div className="flex items-baseline justify-center">
            {brandText.split('').map((char, i) => (
              <span
                key={i}
                className="char inline-block font-display"
                style={{
                  fontSize: 'clamp(48px, 10vw, 120px)',
                  lineHeight: 0.9,
                  letterSpacing: '-0.02em',
                  color: '#F4F1EA',
                  transformOrigin: 'center bottom',
                  willChange: 'transform, opacity',
                }}
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* Origin label */}
        <span
          ref={originRef}
          className="font-mono text-[11px] tracking-[0.25em] uppercase mb-6 opacity-0"
          style={{ color: '#B8B2A6' }}
        >
          Premium Ceylon Spices
        </span>

        {/* Gold accent line */}
        <div
          ref={lineRef}
          className="h-[1px] mb-6"
          style={{
            width: 'clamp(80px, 20vw, 200px)',
            background: 'linear-gradient(90deg, transparent, #D4A03A, transparent)',
            transformOrigin: 'center',
            transform: 'scaleX(0)',
          }}
        />

        {/* Tagline — matches hero subtitle */}
        <p
          ref={taglineRef}
          className="font-body text-sm sm:text-base text-center max-w-sm opacity-0 px-6"
          style={{
            color: 'rgba(244, 241, 234, 0.5)',
            letterSpacing: '0.04em',
          }}
        >
          The magical harvest born from the mist-veiled highlands of Ceylon.
        </p>
      </div>
    </div>
  );
}
