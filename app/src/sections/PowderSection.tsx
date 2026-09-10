import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCart } from '@/context/CartContext';

gsap.registerPlugin(ScrollTrigger);

export default function PowderSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const meterRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    const text = textRef.current;
    const meter = meterRef.current;

    if (!section || !card || !text || !meter) return;

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
        .fromTo(meter.querySelector('.consistency-fill'), 
          { scaleX: 0 }, 
          { scaleX: 1, ease: 'power2.out' }, 
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
        .to(meter, { 
          opacity: 0, 
          ease: 'power2.in' 
        }, 0.72);

    }, section);

    return () => ctx.revert();
  }, []);

  const handleAddToCart = () => {
    addItem({
      id: 'ground-powder-set',
      name: 'Ground Powder Set',
      price: 32,
      image: '/ground_powder.jpg',
      variant: '3x 75g',
    });
  };

  return (
    <section
      ref={sectionRef}
      className="section-pinned z-[80] bg-charcoal"
    >
      {/* Vignette */}
      <div className="absolute inset-0 vignette pointer-events-none" />

      {/* Left Media Card */}
      <div
        ref={cardRef}
        className="absolute left-[7vw] top-[18vh] w-[40vw] h-[64vh] rounded-card overflow-hidden shadow-card will-change-transform"
      >
        <picture>
          <source srcSet="/ground_powder.webp" type="image/webp" />
          <img
            src="/ground_powder.jpg"
            alt="Ground Powders"
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
        <h2 className="font-display text-h2 text-ivory mb-6">
          Ground Powders
        </h2>
        <p className="text-body text-ivory-muted mb-8 leading-relaxed">
          Sifted fine for even coating. Stored in UV-blocking pouches to preserve 
          color and heat. Our grinding process uses traditional stone mills that 
          keep temperatures low, protecting the volatile oils.
        </p>

        {/* Consistency Meter */}
        <div ref={meterRef} className="mb-8">
          <div className="flex justify-between mb-3">
            <span className="font-mono text-label text-ivory-muted uppercase">Fine Grind</span>
            <span className="font-mono text-label text-gold uppercase">Premium</span>
          </div>
          <div className="intensity-track">
            <div 
              className="consistency-fill intensity-fill origin-left"
              style={{ width: '85%' }}
            />
          </div>
        </div>

        <div className="flex items-center gap-6 mb-8">
          <span className="font-display text-3xl text-gold">€32.00</span>
          <span className="font-mono text-label text-ivory-muted uppercase">3x 75g</span>
        </div>
        <button onClick={handleAddToCart} className="btn-gold">
          Shop Powders
        </button>
      </div>
    </section>
  );
}
