import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCart } from '@/context/CartContext';

gsap.registerPlugin(ScrollTrigger);

export default function WholeSpicesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    const text = textRef.current;

    if (!section || !card || !text) return;

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
          { x: '60vw', rotate: 6, opacity: 0 }, 
          { x: 0, rotate: 0, opacity: 1, ease: 'power2.out' }, 
          0
        )
        .fromTo(text, 
          { x: '-45vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'power2.out' }, 
          0.05
        );

      // SETTLE (30-70%): Hold

      // EXIT (70-100%)
      scrollTl
        .to(card, { 
          x: '28vw', 
          opacity: 0, 
          ease: 'power2.in' 
        }, 0.70)
        .to(text, { 
          x: '-18vw', 
          opacity: 0, 
          ease: 'power2.in' 
        }, 0.70);

    }, section);

    return () => ctx.revert();
  }, []);

  const handleAddToCart = () => {
    addItem({
      id: 'whole-spices-bundle',
      name: 'Whole Spices Bundle',
      price: 45,
      image: '/whole_spices.jpg',
      variant: 'Mixed 200g',
    });
  };

  return (
    <section
      ref={sectionRef}
      className="section-pinned z-[70] bg-charcoal"
    >
      {/* Vignette */}
      <div className="absolute inset-0 vignette pointer-events-none" />

      {/* Left Text Block */}
      <div
        ref={textRef}
        className="absolute left-[7vw] top-1/2 -translate-y-1/2 w-[38vw] will-change-transform"
      >
        <h2 className="font-display text-h2 text-ivory mb-6">
          Whole Spices
        </h2>
        <p className="text-body text-ivory-muted mb-8 leading-relaxed">
          Toast, crack, grind. Whole spices keep their oils intact—so you control 
          the intensity in every dish. Our whole spice collection includes 
          cardamom pods, cloves, nutmeg, and star anise, each hand-sorted for 
          size and quality.
        </p>
        <div className="flex items-center gap-6 mb-8">
          <span className="font-display text-3xl text-gold">€45.00</span>
          <span className="font-mono text-label text-ivory-muted uppercase">Mixed 200g</span>
        </div>
        <button onClick={handleAddToCart} className="btn-gold">
          Shop Whole Spices
        </button>
      </div>

      {/* Right Media Card */}
      <div
        ref={cardRef}
        className="absolute right-[7vw] top-[18vh] w-[40vw] h-[64vh] rounded-card overflow-hidden shadow-card will-change-transform"
      >
        <picture>
          <source srcSet="/whole_spices.webp" type="image/webp" />
          <img
            src="/whole_spices.jpg"
            alt="Whole Spices"
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
      </div>
    </section>
  );
}
