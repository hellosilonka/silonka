import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sun, Wind, Scale, Package, Check } from 'lucide-react';
import SEOHead, { breadcrumbSchema } from '@/components/SEOHead';

gsap.registerPlugin(ScrollTrigger);

const processSteps = [
  {
    number: '01',
    title: 'Harvest',
    description: 'We time harvest to the monsoon season when essential oils are at their peak. Each spice is hand-picked at perfect ripeness.',
    icon: Sun,
    image: '/whole_spices.jpg',
  },
  {
    number: '02',
    title: 'Sun Drying',
    description: 'No artificial heat. Our spices dry naturally in the Sri Lankan sun, preserving their volatile oils and complex flavors.',
    icon: Wind,
    image: '/aroma_steam.jpg',
  },
  {
    number: '03',
    title: 'Sorting',
    description: 'Each batch is hand-sorted to remove imperfect specimens. Only the finest make it to our packaging facility.',
    icon: Scale,
    image: '/pepper_palette.jpg',
  },
  {
    number: '04',
    title: 'Packaging',
    description: 'Nitrogen-flushed, triple-layer pouches protect against light, air, and moisture. Freshness guaranteed.',
    icon: Package,
    image: '/collection_set.jpg',
  },
];

const qualityChecks = [
  'Hand-sorted for size and color uniformity',
  'Moisture content tested to <12%',
  'Essential oil analysis for potency',
  'Microbial testing for safety',
  'Traceability to individual farm lot',
];

export default function CraftPage() {
  const heroRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const steps = stepsRef.current;

    if (!hero || !steps) return;

    const ctx = gsap.context(() => {
      // Hero animation
      gsap.fromTo(hero.querySelector('.hero-content'),
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
      );

      // Process steps animation
      const stepItems = steps.querySelectorAll('.process-step');
      stepItems.forEach((item, index) => {
        const image = item.querySelector('.step-image');
        const content = item.querySelector('.step-content');

        gsap.fromTo(image,
          { x: index % 2 === 0 ? -60 : 60, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 80%',
            }
          }
        );

        gsap.fromTo(content,
          { x: index % 2 === 0 ? 60 : -60, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 80%',
            }
          }
        );
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-charcoal pt-20">
      <SEOHead
        title="How Ceylon Cinnamon Is Made — Hand-Harvested & Sun-Dried | Silonka"
        description="Learn the 4-step craft behind authentic Ceylon Cinnamon: hand-harvested at peak ripeness, sun-dried naturally, hand-sorted for quality, and nitrogen-sealed for freshness. From Sri Lanka to your kitchen."
        keywords="how Ceylon cinnamon is made, cinnamon harvesting process, hand-peeled cinnamon, sun-dried true cinnamon, Ceylon cinnamon processing, organic spice craft, Silonka process"
        canonicalPath="/craft"
        ogImage="/craft_mortar.jpg"
        jsonLd={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Our Craft', url: '/craft' },
        ])}
      />
      {/* Hero Section */}
      <section ref={heroRef} className="relative py-8 sm:py-12 lg:py-16">
        <div className="absolute inset-0 vignette pointer-events-none" />

        <div className="relative px-4 sm:px-6 lg:px-[7vw]">
          <div className="hero-content text-center max-w-3xl mx-auto">
            <span className="font-mono text-[10px] sm:text-label text-gold uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 block">
              Our Process
            </span>
            <h1 className="font-display text-[clamp(32px,6vw,56px)] text-ivory mb-3 leading-tight">
              The art of Ceylon Cinnamon craft
            </h1>
            <p className="text-sm sm:text-body text-ivory-muted leading-snug px-4">
              From harvest to your hands
            </p>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="relative py-16 sm:py-24">
        <div className="absolute inset-0 vignette pointer-events-none" />

        <div className="relative px-4 sm:px-6 lg:px-[7vw]">
          <div ref={stepsRef} className="space-y-20 sm:space-y-32">
            {processSteps.map((step, index) => (
              <div
                key={index}
                className="process-step grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center"
              >
                {/* Image */}
                <div className={`step-image order-2 ${index % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div className="relative">
                    <div className="aspect-[4/3] rounded-card overflow-hidden">
                      <img
                        src={step.image}
                        alt={step.title}
                        width={864}
                        height={1184}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Step Number */}
                    <div className="absolute -top-3 sm:-top-6 -left-3 sm:-left-6 w-10 h-10 sm:w-16 sm:h-16 bg-gold rounded-full flex items-center justify-center">
                      <span className="font-display text-lg sm:text-2xl text-charcoal">{step.number}</span>
                    </div>
                  </div>
                  {/* Decorative Line (Mobile) */}
                  <div className="lg:hidden w-16 h-px bg-gradient-to-r from-gold to-transparent mt-8" />
                </div>

                {/* Content */}
                <div className={`step-content order-1 ${index % 2 === 1 ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <step.icon className="w-6 h-6 sm:w-8 sm:h-8 text-gold" />
                    <span className="font-mono text-[10px] sm:text-label text-ivory-muted uppercase tracking-widest">
                      Step {step.number}
                    </span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-h3 text-ivory mb-4 sm:mb-6">{step.title}</h2>
                  <p className="text-sm sm:text-body text-ivory-muted leading-relaxed mb-6 sm:mb-8">
                    {step.description}
                  </p>

                  {/* Decorative Line (Desktop) */}
                  <div className="hidden lg:block w-16 sm:w-24 h-px bg-gradient-to-r from-gold to-transparent" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Standards */}
      <section className="relative py-16 sm:py-24 bg-charcoal-light">
        <div className="absolute inset-0 vignette pointer-events-none" />

        <div className="relative px-4 sm:px-6 lg:px-[7vw]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">
            {/* Content */}
            <div>
              <span className="font-mono text-[10px] sm:text-label text-gold uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4 block">
                Quality Control
              </span>
              <h2 className="font-display text-[clamp(24px,4vw,40px)] text-ivory mb-4 sm:mb-6">
                Our Standards
              </h2>
              <p className="text-sm sm:text-body text-ivory-muted mb-6 sm:mb-8 leading-relaxed">
                Every batch undergoes rigorous testing before it leaves our facility.
                We don't just meet international standards—we exceed them.
              </p>

              <ul className="space-y-3 sm:space-y-4">
                {qualityChecks.map((check, index) => (
                  <li key={index} className="flex items-start gap-3 sm:gap-4">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-gold" />
                    </div>
                    <span className="text-ivory text-sm sm:text-base">{check}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Image */}
            <div>
              <div className="aspect-square rounded-card overflow-hidden p-10 lg:p-16">
                <picture>
                  <source srcSet="/craft_cinnamon.webp" type="image/webp" />
                  <img
                    src="/craft_cinnamon.png"
                    alt="Ceylon cinnamon bundle with golden accents"
                    width={864}
                    height={864}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain scale-90 hover:scale-100 transition-transform duration-700"
                  />
                </picture>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Freshness Guarantee */}
      <section className="relative py-16 sm:py-24">
        <div className="absolute inset-0 vignette pointer-events-none" />

        <div className="relative px-4 sm:px-6 lg:px-[7vw]">
          <div className="max-w-4xl mx-auto text-center">
            <span className="font-mono text-[10px] sm:text-label text-gold uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4 block">
              Our Promise
            </span>
            <h2 className="font-display text-[clamp(24px,4vw,40px)] text-ivory mb-4 sm:mb-6">
              The Freshness Guarantee
            </h2>
            <p className="text-sm sm:text-body text-ivory-muted mb-10 sm:mb-12 leading-relaxed px-4">
              We harvest twice yearly, process in small batches, and package only
              when we receive your order. The spices in your kitchen were likely
              still on the tree within the last six months.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {[
                { value: '6', label: 'Months from harvest' },
                { value: '100%', label: 'Traceable to source' },
                { value: '0', label: 'Artificial additives' },
              ].map((stat, index) => (
                <div key={index} className="p-5 sm:p-6 rounded-card bg-charcoal-card border border-white/5">
                  <p className="font-display text-3xl sm:text-4xl text-gold mb-1 sm:mb-2">{stat.value}</p>
                  <p className="font-mono text-[10px] sm:text-label text-ivory-muted uppercase">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
