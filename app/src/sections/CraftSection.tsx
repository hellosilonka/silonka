import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sun, Mountain, Package } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const craftSteps = [
  { icon: Sun, label: 'Sun-dried' },
  { icon: Mountain, label: 'Stone-ground' },
  { icon: Package, label: 'Sealed fresh' },
];

export default function CraftSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    const text = textRef.current;
    const chips = chipsRef.current;

    if (!section || !card || !text || !chips) return;

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
        .fromTo(chips.children, 
          { y: '6vh', opacity: 0 }, 
          { y: 0, opacity: 1, stagger: 0.06, ease: 'power2.out' }, 
          0.18
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
        .to(chips.children, { 
          y: '4vh', 
          opacity: 0, 
          stagger: 0.03,
          ease: 'power2.in' 
        }, 0.72);

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="craft"
      className="section-pinned z-50 bg-charcoal"
    >
      {/* Vignette */}
      <div className="absolute inset-0 vignette pointer-events-none" />

      {/* Left Text Block */}
      <div
        ref={textRef}
        className="absolute left-[7vw] top-1/2 -translate-y-1/2 w-[38vw] will-change-transform"
      >
        <h2 className="font-display text-h2 text-ivory mb-6">
          Our Story Starts in the Soil
        </h2>
        <p className="text-body text-ivory-muted mb-8 leading-relaxed">
          Every leaf and bark is handpicked from smallholder farms, nurtured by 
          generations of growers. Sun-dried, hand-processed, and rigorously inspected — 
          from the grove to the rack, from the bark to the quill, nothing is rushed 
          because true quality cannot be hurried.
        </p>

        {/* Step Chips */}
        <div ref={chipsRef} className="flex flex-wrap gap-3 mb-8">
          {craftSteps.map((step, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-charcoal-card border border-white/10"
            >
              <step.icon className="w-4 h-4 text-gold" />
              <span className="font-mono text-label text-ivory uppercase">{step.label}</span>
            </div>
          ))}
        </div>

        <button className="btn-gold">
          Meet the Makers
        </button>
      </div>

      {/* Right Media Card */}
      <div
        ref={cardRef}
        className="absolute right-[7vw] top-[18vh] w-[40vw] h-[64vh] rounded-card overflow-hidden shadow-card will-change-transform"
      >
        <img
          src="/craft_mortar.jpg"
          alt="Spice Craft"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
      </div>
    </section>
  );
}
