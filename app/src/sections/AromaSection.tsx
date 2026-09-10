import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flame } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function AromaSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    const text = textRef.current;
    const badge = badgeRef.current;

    if (!section || !card || !text || !badge) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        }
      });

      // ENTRANCE (0-30%)
      scrollTl
        .fromTo(card, 
          { x: '-60vw', rotate: -6, opacity: 0 }, 
          { x: 0, rotate: 0, opacity: 1, ease: 'power2.out' }, 
          0
        )
        .fromTo(text, 
          { x: '45vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'power2.out' }, 
          0.05
        )
        .fromTo(badge, 
          { y: '8vh', opacity: 0 }, 
          { y: 0, opacity: 1, ease: 'power2.out' }, 
          0.12
        );

      // SETTLE (30-70%): Hold

      // EXIT (70-100%)
      scrollTl
        .to(card, { 
          x: '-28vw', 
          opacity: 0, 
          ease: 'power2.in' 
        }, 0.70)
        .to(text, { 
          x: '18vw', 
          opacity: 0, 
          ease: 'power2.in' 
        }, 0.70)
        .to(badge, { 
          y: '6vh', 
          opacity: 0, 
          ease: 'power2.in' 
        }, 0.72);

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section-pinned z-[60] bg-charcoal"
    >
      {/* Vignette */}
      <div className="absolute inset-0 vignette pointer-events-none" />

      {/* Left Media Card */}
      <div
        ref={cardRef}
        className="absolute left-[7vw] top-[18vh] w-[40vw] h-[64vh] rounded-card overflow-hidden shadow-card will-change-transform"
      >
        <picture>
          <source srcSet="/aroma_steam.webp" type="image/webp" />
          <img
            src="/aroma_steam.jpg"
            alt="Aroma and Steam"
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
      </div>

      {/* Right Text Block */}
      <div
        ref={textRef}
        className="absolute left-[54vw] top-1/2 -translate-y-1/2 w-[36vw] will-change-transform"
      >
        <div ref={badgeRef} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-charcoal-card border border-white/10 mb-6">
          <Flame className="w-4 h-4 text-gold" />
          <span className="font-mono text-label text-gold uppercase">Aroma Lock</span>
        </div>

        <h2 className="font-display text-h2 text-ivory mb-6">
          Aroma & Steam
        </h2>
        <p className="text-body text-ivory-muted mb-8 leading-relaxed">
          Heat unlocks the oil. Our packaging keeps that volatility intact—so 
          the first crack of the lid hits like the harvest day. Each pouch is 
          flushed with nitrogen and sealed with a triple-layer barrier against 
          light, air, and moisture.
        </p>
        <button className="btn-gold">
          Read the Guide
        </button>
      </div>
    </section>
  );
}
