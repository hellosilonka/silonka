import { useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function CinnamonSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    const text = textRef.current;
    const cta = ctaRef.current;

    if (!section || !card || !text || !cta) return;

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
        .fromTo(cta, 
          { y: '10vh', opacity: 0 }, 
          { y: 0, opacity: 1, ease: 'power2.out' }, 
          0.10
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
        .to(cta, { 
          y: '8vh', 
          opacity: 0, 
          ease: 'power2.in' 
        }, 0.72);

    }, section);

    return () => ctx.revert();
  }, []);

  // Removed hardcoded handleAddToCart since mock product is deleted

  return (
    <section
      ref={sectionRef}
      className="section-pinned z-40 bg-charcoal"
    >
      {/* Vignette */}
      <div className="absolute inset-0 vignette pointer-events-none" />

      {/* Left Media Card */}
      <div
        ref={cardRef}
        className="absolute left-[7vw] top-[18vh] w-[40vw] h-[64vh] rounded-card overflow-hidden shadow-card will-change-transform"
      >
        <picture>
          <source srcSet="/cinnamon_signature.webp" type="image/webp" />
          <img
            src="/cinnamon_signature.jpg"
            alt="Ceylon Cinnamon"
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
        <span className="font-mono text-label text-gold uppercase tracking-widest mb-4 block">
          Signature Spice
        </span>
        <h2 className="font-display text-h2 text-ivory mb-6">
          Ceylon Cinnamon
        </h2>
        <p className="text-body text-ivory-muted mb-8 leading-relaxed">
          Amongst all spices, none are more famous than Ceylon Cinnamon 
          (Cinnamomum verum)—the world's "True Cinnamon." Hand-rolled into 
          delicate multi-layered quills and shade-dried to preserve its sweet 
          taste, golden colour, and low coumarin content.
        </p>
        <div className="flex items-center gap-6 mb-8">
          {/* Price removed since this is a feature section, not a product */}
        </div>
        <Link
          to="/shop"
          ref={ctaRef}
          className="btn-gold will-change-transform inline-block"
        >
          Explore Shop
        </Link>
      </div>
    </section>
  );
}
