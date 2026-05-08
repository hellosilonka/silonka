import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';

gsap.registerPlugin(ScrollTrigger);

export default function PepperSection() {
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
          { x: '60vw', rotate: 6, opacity: 0 }, 
          { x: 0, rotate: 0, opacity: 1, ease: 'power2.out' }, 
          0
        )
        .fromTo(text, 
          { x: '-45vw', opacity: 0 }, 
          { x: 0, opacity: 1, ease: 'power2.out' }, 
          0.05
        )
        .fromTo(meter.querySelector('.intensity-fill'), 
          { scaleX: 0 }, 
          { scaleX: 1, ease: 'power2.out' }, 
          0.12
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
        }, 0.70)
        .to(meter, { 
          scaleX: 0.6, 
          opacity: 0, 
          ease: 'power2.in' 
        }, 0.72);

    }, section);

    return () => ctx.revert();
  }, []);

  const handleAddToCart = () => {
    addItem({
      id: 'black-pepper',
      name: 'Ceylon Black Pepper',
      price: 24,
      image: '/pepper_palette.jpg',
      variant: '100g Whole',
    });
  };

  return (
    <section
      ref={sectionRef}
      className="section-pinned z-30 bg-charcoal"
    >
      {/* Vignette */}
      <div className="absolute inset-0 vignette pointer-events-none" />

      {/* Left Text Block */}
      <div
        ref={textRef}
        className="absolute left-[7vw] top-1/2 -translate-y-1/2 w-[38vw] will-change-transform"
      >
        <h2 className="font-display text-h2 text-ivory mb-6">
          The Black Gold
        </h2>
        <p className="text-body text-ivory-muted mb-8 leading-relaxed">
          Known as "Black Gold" among the traders and merchants of old, Ceylon 
          black pepper was widely traded across the Indian Ocean as both a 
          seasoning agent and a preservative. Prized for its high piperine 
          content, responsible for its characteristic aroma and pungent flavour.
        </p>

        {/* Intensity Meter */}
        <div ref={meterRef} className="mb-8">
          <div className="flex justify-between mb-3">
            <span className="font-mono text-label text-ivory-muted uppercase">Mild</span>
            <span className="font-mono text-label text-gold uppercase">Medium</span>
            <span className="font-mono text-label text-ivory-muted uppercase">Hot</span>
          </div>
          <div className="intensity-track">
            <div 
              className="intensity-fill origin-left"
              style={{ width: '60%' }}
            />
          </div>
        </div>

        <div className="flex items-center gap-6 mb-8">
          <span className="font-display text-3xl text-gold">€24.00</span>
          <span className="font-mono text-label text-ivory-muted uppercase">100g Whole</span>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleAddToCart} className="btn-gold">
            Add to Cart
          </button>
          <a 
            href="#" 
            className="flex items-center gap-2 text-ivory-muted hover:text-gold transition-colors font-mono text-label uppercase"
          >
            See the grades <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Right Media Card */}
      <div
        ref={cardRef}
        className="absolute right-[7vw] top-[18vh] w-[40vw] h-[64vh] rounded-card overflow-hidden shadow-card will-change-transform"
      >
        <img
          src="/pepper_palette.jpg"
          alt="Ceylon Black Pepper"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
      </div>
    </section>
  );
}
