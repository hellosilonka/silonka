import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const bg = bgRef.current;
    const headline = headlineRef.current;
    const subline = sublineRef.current;
    const cta = ctaRef.current;
    const scrollHint = scrollHintRef.current;

    if (!section || !bg || !headline || !subline || !cta || !scrollHint) return;

    const ctx = gsap.context(() => {
      // Auto-play entrance animation on load
      const loadTl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      loadTl
        .fromTo(bg, { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.1 })
        .fromTo(headline.querySelectorAll('.word'), 
          { y: 24, opacity: 0 }, 
          { y: 0, opacity: 1, stagger: 0.06, duration: 0.9 }, 
          '-=0.6'
        )
        .fromTo([subline, cta], 
          { y: 14, opacity: 0 }, 
          { y: 0, opacity: 1, stagger: 0.08, duration: 0.7 }, 
          '-=0.5'
        )
        .fromTo(scrollHint, 
          { y: 10, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 0.5 }, 
          '-=0.3'
        );

      // Scroll-driven exit animation
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
          onLeaveBack: () => {
            // Reset all elements to visible when scrolling back to top
            gsap.set([headline, subline, cta, scrollHint], { opacity: 1, x: 0, y: 0 });
            gsap.set(bg, { scale: 1, y: 0 });
          }
        }
      });

      // ENTRANCE (0-30%): Hold (elements already visible from load animation)
      // SETTLE (30-70%): Static
      // EXIT (70-100%): Elements exit
      scrollTl
        .fromTo(headline, 
          { x: 0, opacity: 1 }, 
          { x: '-18vw', opacity: 0, ease: 'power2.in' }, 
          0.70
        )
        .fromTo([subline, cta], 
          { x: 0, opacity: 1 }, 
          { x: '-12vw', opacity: 0, ease: 'power2.in' }, 
          0.72
        )
        .fromTo(bg, 
          { scale: 1, y: 0 }, 
          { scale: 1.06, y: '-6vh', ease: 'none' }, 
          0.70
        )
        .fromTo(scrollHint, 
          { opacity: 1 }, 
          { opacity: 0 }, 
          0.65
        );

    }, section);

    return () => ctx.revert();
  }, []);

  const scrollToShop = () => {
    const shopSection = document.querySelector('#shop');
    if (shopSection) {
      shopSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={sectionRef}
      className="section-pinned z-10"
    >
      {/* Background Image */}
      <div
        ref={bgRef}
        className="absolute inset-0 z-1"
      >
        <img
          src="/hero_spice_field.jpg"
          alt="Ceylon spice garden"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-transparent" />
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 vignette z-2 pointer-events-none" />

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center px-6 lg:px-[7vw]">
        <div className="max-w-3xl">
          <h1
            ref={headlineRef}
            className="font-display text-hero text-ivory mb-6"
          >
            <span className="word inline-block">Spice</span>{' '}
            <span className="word inline-block">Origins</span>
          </h1>
          <p
            ref={sublineRef}
            className="text-body text-ivory-muted max-w-xl mb-10"
          >
            The magical harvest born from the mist-veiled highlands of Ceylon.
          </p>
          <button
            ref={ctaRef}
            onClick={scrollToShop}
            className="btn-ivory"
          >
            Explore the Collection
          </button>
        </div>
      </div>

      {/* Scroll Hint */}
      <div
        ref={scrollHintRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span className="font-mono text-label text-ivory-muted uppercase">Scroll</span>
        <ChevronDown className="w-5 h-5 text-gold animate-bounce" />
      </div>
    </section>
  );
}
