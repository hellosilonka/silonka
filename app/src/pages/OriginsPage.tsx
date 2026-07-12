import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin, Leaf, Droplets, Sun } from 'lucide-react';
import SEOHead, { breadcrumbSchema } from '@/components/SEOHead';

gsap.registerPlugin(ScrollTrigger);

const timelineEvents = [
  {
    year: 'Ancient',
    title: 'Ancient Trade Routes',
    description: 'Long before European ships reached the island, Sri Lanka was already a thriving center of the Indian Ocean spice trade. Arab, Persian, Indian, and Chinese merchants regularly sailed to the island\'s ports to obtain highly prized spices—especially cinnamon—which were then carried to markets across the Middle East and the Mediterranean.',
    image: '/300_opt.jpg',
  },
  {
    year: '1500s',
    title: 'Portuguese Era',
    description: 'Soon after their arrival in the early 1500s, the Portuguese established control over the cinnamon trade, creating a monopoly that forced local communities to supply cinnamon bark to colonial authorities. This only served to boost Ceylon Cinnamon\'s reputation as the most coveted spice in the world.',
    image: '/1518_opt.jpg',
  },
  {
    year: '1658',
    title: 'Dutch Spice Empire',
    description: 'After the Dutch East India Company (VOC) wrested control of the island\'s coastal regions, they were able to strengthen the monopoly. The Dutch introduced systematic cultivation methods to cinnamon plantations and developed transport networks to aid in moving the spices from growing regions to ports like Colombo and Negombo.',
    image: '/1658_opt.jpg',
  },
  {
    year: '1800s',
    title: 'British Colonial Era',
    description: 'Under British rule in the 19th century, Sri Lanka\'s spice trade became more systematically organized and integrated into the global colonial economy. Cinnamon plantations were expanded and infrastructure improved. Although tea eventually became the island\'s dominant export, Sri Lankan cinnamon and other spices remained highly valued commodities.',
    image: '/1658_opt.jpg',
  },
  {
    year: 'Today',
    title: "Sri Lanka's Spice Legacy",
    description: 'Sri Lanka is responsible for producing over 80% of the world\'s "True Cinnamon." Despite technological advancements and industrial changes, Sri Lanka\'s spice cultivators remain rooted in centuries-old traditions—hand-picking bark, sun-drying pepper vines, and hand-picking clove buds at dawn. This ensures the utmost care and delicacy of skill preserves the true essence of the spice.',
    image: '/Today_opt.jpg',
  },
];

const spices = [
  {
    name: 'Ceylon Cinnamon',
    subtitle: 'Cinnamomum verum — The World\'s "True Cinnamon"',
    region: 'Western Province (Galle, Matara, Kalutara)',
    image: '/cinnamon_signature.jpg',
    facts: [
      'Dubbed the world\'s "True Cinnamon" for its fine quality',
      'Stark differences from the more common cassia cinnamon of Indonesia and China',
      'Hand-rolled into delicate multi-layered quills — a unique feature of genuine Ceylonese Cinnamon',
      'Dried in the shade, never directly in the sun, to preserve sweet taste and golden colour',
      'Low coumarin content makes it safer for frequent consumption',
    ],
    description: `Amongst all spices of the culinary world, none are more famous than Ceylon Cinnamon (Cinnamomum verum). It has been dubbed the world's "True Cinnamon" for its fine quality, and stark differences from the more common cassia cinnamon of Indonesia and China.

Ceylon Cinnamon is brought to its finest quality by an intricate process that requires intense practice, experience, and skill. The spice is produced by carefully peeling the inner bark of the cinnamon tree and hand-rolling it into delicate multi-layered quills—a unique feature that distinguishes genuine Ceylonese Cinnamon from cassia.

The quills are then dried in the shade, never directly in the sun, in order to preserve the sweet taste and the characteristic golden colour. Ceylonese Cinnamon is preferred not just for its taste and fragrance, but also because its low coumarin content contributes to making it safer for frequent consumption.`,
  },
  {
    name: 'Black Pepper',
    subtitle: 'Piper nigrum — The Black Gold',
    region: 'Kandy, Matale & Kurunegala Districts',
    image: '/pepper_palette.jpg',
    facts: [
      'Known as "Black Gold" among the traders and merchants of old',
      'Widely traded across the Indian Ocean as both a seasoning agent and a preservative',
      'Prized for its high piperine content, responsible for its characteristic aroma and pungent flavour',
      'Sun-dried on woven mats for 3–5 days until the outer skin wrinkles to a dark black',
      'Sri Lankan pepper is bold, aromatic, and complex — with floral and earthy undertones',
    ],
    description: `Known as "Black Gold" among the traders and merchants of old, Ceylon black pepper was widely traded across the Indian Ocean as both a seasoning agent and a preservative in ancient cuisines.

Black pepper is prized for its high piperine content, which is responsible for its characteristic aroma and pungent flavour. Sri Lankan black pepper grows in the humid foothills of the central highlands, where pepper vines (Piper nigrum) climb the trunks of jak, breadfruit, and silver-oak trees.

The harvest season follows the northeast monsoon — farmers and their families pick each berry by hand, checking for that precise moment of ripeness when the berry is plump, green, and bursting with essential oils. After harvest, the berries are spread across woven mats and sun-dried for three to five days. The skin wrinkles and darkens to a deep, matte black.`,
  },
  {
    name: 'Cloves',
    subtitle: 'Syzygium aromaticum — The Aromatic Bud',
    region: 'Central Region & Wet Zone',
    image: '/whole_spices.jpg',
    facts: [
      'Originally native to the Maluku Islands of Indonesia, introduced to Sri Lanka during British colonial period',
      'Quickly adapted to the island\'s climatic temperament, mainly cultivated in the central region and wet zone',
      'Known for their intense aroma and high essential oil content, particularly eugenol',
      'Eugenol is responsible for the spice\'s warm, yet sweetening fragrance',
      'Highly valued for medicinal properties, a common ingredient in Sinhalese Ayurveda',
    ],
    description: `Cloves, originally native to the Maluku Islands of Indonesia, were introduced to Sri Lanka during the British colonial period. The spice quickly adapted to the island's climatic temperament and is mainly cultivated in the country's central region and wet zone.

Over time, cloves became an important contributor to the island's diversified curry blends. Sri Lankan cloves are known for their intense aroma and high essential oil content, particularly eugenol, which is responsible for the spice's warm, yet sweetening fragrance.

Moreover, cloves are highly valued for their medicinal properties, making them a common ingredient in herbal preparations in Sri Lanka's traditional medicinal formulations, Sinhalese Ayurveda.`,
  },
];

const regions = [
  {
    name: 'Western Province',
    elevation: 'Sea level – 100m',
    products: 'Ceylon Cinnamon',
    description: 'The warm, humid coastal strip from Kalutara to Matara is the heartland of true cinnamon. The rich, red soil and steady rainfall make it the only region in the world where Cinnamomum verum thrives at commercial scale.',
  },
  {
    name: 'Central Highlands',
    elevation: '900–2,000m',
    products: 'Black Pepper, Cardamom',
    description: 'The misty mountain slopes around Kandy, Matale, and Nuwara Eliya produce Sri Lanka\'s finest pepper and cardamom. Cool nights and warm days concentrate the essential oils that give these spices their exceptional depth.',
  },
  {
    name: 'Southern Province',
    elevation: '50–400m',
    products: 'Cloves, Black Pepper',
    description: 'The rolling hills of Matale and the southern districts support large clove plantations. The iron-rich red soil and monsoon rains of the south produce cloves with an unusually high eugenol content and a powerful, lasting aroma.',
  },
];

export default function OriginsPage() {
  const heroRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const story = storyRef.current;
    const timeline = timelineRef.current;

    if (!hero || !story || !timeline) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(hero.querySelector('.hero-content'),
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
      );

      gsap.fromTo(story.querySelector('.story-image'),
        { x: -80, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: story, start: 'top 70%' }
        }
      );

      gsap.fromTo(story.querySelector('.story-text'),
        { x: 80, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: story, start: 'top 70%' }
        }
      );

      const timelineItems = timeline.querySelectorAll('.timeline-item');
      timelineItems.forEach((item, index) => {
        gsap.fromTo(item,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            delay: index * 0.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: item, start: 'top 85%' }
          }
        );
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-charcoal pt-20">
      <SEOHead
        title="Our Story — The Origins of Ceylon Spices — Silonka"
        description="Discover Silonka's story: from ancient spice trade routes through Sri Lanka's hill country to your kitchen. Learn about Ceylon cinnamon, black pepper, and cloves — and the families who cultivate them."
        keywords="Ceylon spice history, Sri Lanka cinnamon origin, spice trade routes, organic spice farms, Silonka story, Ceylon pepper, cloves Sri Lanka"
        canonicalPath="/origins"
        ogImage="/cgarden_opt.jpg"
        jsonLd={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Our Origins', url: '/origins' },
        ])}
      />

      {/* Hero Section */}
      <section ref={heroRef} className="relative py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 vignette pointer-events-none" />
        <div className="relative px-4 sm:px-6 lg:px-[7vw]">
          <div className="hero-content text-center max-w-3xl mx-auto">
            <span className="font-mono text-[10px] sm:text-label text-gold uppercase tracking-[0.2em] mb-4 block">
              Our Story
            </span>
            <h1 className="font-display text-[clamp(32px,6vw,56px)] text-ivory mb-6 leading-tight">
              From Sri Lanka to Your Kitchen
            </h1>
            <p className="text-sm sm:text-body text-ivory-muted leading-relaxed px-4">
              For two thousand years, one island kept the world's most treasured secret. Silonka was born from it.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section ref={storyRef} className="relative py-16 sm:py-24 bg-charcoal-light">
        <div className="absolute inset-0 vignette pointer-events-none" />
        <div className="relative px-4 sm:px-6 lg:px-[7vw]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">
            <div className="story-image relative order-2 lg:order-1">
              <div className="aspect-[4/3] rounded-card overflow-hidden">
                <img
                  src="/cgarden_opt.jpg"
                  alt="Silonka spice farm"
                  width={1200}
                  height={800}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

            </div>
            <div className="story-text order-1 lg:order-2">
              <h2 className="font-display text-[clamp(24px,4vw,40px)] text-ivory mb-6">
                An Island Built on Spice
              </h2>
              <p className="text-sm sm:text-body text-ivory-muted mb-4 leading-relaxed">
                Sri Lanka, historically known as Ceylon, has been one of the world's most celebrated
                sources of Cinnamon for many centuries. Located along the major maritime routes of the
                Indian Ocean, the island had become a crucial hub very early on in the ancient global
                spice trade, attracting merchants from Arabia, Persia, and China on their way to the
                markets of the Mediterranean.
              </p>
              <p className="text-sm sm:text-body text-ivory-muted mb-4 leading-relaxed">
                Ceylon Cinnamon had therefore achieved status as one of the most prized commodities
                of global trade long before the arrival of Europeans. In fact, the intense competition
                for Ceylon Cinnamon was such that historians often took to recording cinnamon being
                the primal reason European powers fought over Ceylon.
              </p>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[
                  { icon: Leaf, label: '100% Organic' },
                  { icon: Droplets, label: 'Rain-Fed' },
                  { icon: Sun, label: 'Sun-Dried' },
                  { icon: MapPin, label: 'Traceable' },
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 sm:gap-3">
                    <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                    <span className="font-mono text-[10px] sm:text-label text-ivory uppercase">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spice Deep Dives */}
      <section className="relative py-16 sm:py-24">
        <div className="absolute inset-0 vignette pointer-events-none" />
        <div className="relative px-4 sm:px-6 lg:px-[7vw]">
          <div className="text-center mb-12 sm:mb-20">
            <span className="font-mono text-[10px] sm:text-label text-gold uppercase tracking-[0.2em] mb-4 block">
              The Spices
            </span>
            <h2 className="font-display text-[clamp(24px,4vw,40px)] text-ivory">
              Where Every Spice Comes From
            </h2>
          </div>

          <div className="space-y-20 sm:space-y-32">
            {spices.map((spice, index) => (
              <div key={index} className={`grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-start ${index % 2 === 1 ? '' : ''}`}>
                {/* Image side */}
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="aspect-[4/3] rounded-card overflow-hidden mb-6">
                    <img
                      src={spice.image}
                      alt={spice.name}
                      width={1200}
                      height={800}
                      loading="lazy"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  {/* Fast Facts */}
                  <div className="p-5 sm:p-6 rounded-card bg-charcoal-card border border-white/5">
                    <p className="font-mono text-[10px] sm:text-label text-gold uppercase tracking-widest mb-4">Fast Facts</p>
                    <ul className="space-y-3">
                      {spice.facts.map((fact, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold mt-2 flex-shrink-0" />
                          <span className="text-ivory-muted text-xs sm:text-sm leading-relaxed">{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Text side */}
                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <span className="font-mono text-[10px] sm:text-label text-gold uppercase tracking-[0.2em] mb-3 block">
                    {spice.region}
                  </span>
                  <h3 className="font-display text-[clamp(24px,3.5vw,40px)] text-ivory mb-1">
                    {spice.name}
                  </h3>
                  <p className="font-mono text-[10px] sm:text-label text-ivory-muted uppercase tracking-widest mb-6 italic">
                    {spice.subtitle}
                  </p>
                  <div className="w-16 h-px bg-gradient-to-r from-gold to-transparent mb-6" />
                  {spice.description.split('\n\n').map((para, i) => (
                    <p key={i} className="text-sm sm:text-body text-ivory-muted leading-relaxed mb-4">
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Historical Timeline */}
      <section className="relative py-16 sm:py-24 bg-charcoal-light">
        <div className="absolute inset-0 vignette pointer-events-none" />
        <div className="relative px-4 sm:px-6 lg:px-[7vw]">
          <div className="text-center mb-10 sm:mb-16">
            <span className="font-mono text-[10px] sm:text-label text-gold uppercase tracking-[0.2em] mb-4 block">
              History
            </span>
            <h2 className="font-display text-[clamp(24px,4vw,40px)] text-ivory">
              Millennia of Spice Trade
            </h2>
          </div>

          <div ref={timelineRef} className="space-y-12 sm:space-y-16">
            {timelineEvents.map((event, index) => (
              <div
                key={index}
                className="timeline-item grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center"
              >
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="aspect-video rounded-card overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.title}
                      width={1200}
                      height={800}
                      loading="lazy"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
                <div className={index % 2 === 1 ? 'lg:order-1 lg:text-right' : ''}>
                  <span className="font-display text-4xl sm:text-5xl text-gold/30 mb-2 block">{event.year}</span>
                  <h3 className="font-display text-xl sm:text-2xl text-ivory mb-3 sm:mb-4">{event.title}</h3>
                  <p className="text-sm sm:text-body text-ivory-muted leading-relaxed">{event.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Closing Quote */}
          <div className="text-center mt-16 sm:mt-24 max-w-2xl mx-auto">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-8" />
            <blockquote className="font-display text-[clamp(18px,3vw,28px)] text-ivory/90 italic leading-relaxed">
              "For as long as the world exists, the finest cinnamon will only be found in Sri Lanka."
            </blockquote>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-8" />
          </div>
        </div>
      </section>

      {/* Regions Section */}
      <section className="relative py-16 sm:py-24">
        <div className="absolute inset-0 vignette pointer-events-none" />
        <div className="relative px-4 sm:px-6 lg:px-[7vw]">
          <div className="text-center mb-10 sm:mb-16">
            <span className="font-mono text-[10px] sm:text-label text-gold uppercase tracking-[0.2em] mb-4 block">
              Growing Regions
            </span>
            <h2 className="font-display text-[clamp(24px,4vw,40px)] text-ivory">
              Where Our Spices Grow
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {regions.map((region, index) => (
              <div
                key={index}
                className="p-6 sm:p-8 rounded-card bg-charcoal-light border border-white/5 hover:border-gold/30 transition-colors duration-300"
              >
                <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-gold mb-4 sm:mb-6" />
                <h3 className="font-display text-lg sm:text-xl text-ivory mb-1 sm:mb-2">{region.name}</h3>
                <p className="font-mono text-[10px] sm:text-label text-gold uppercase mb-3 sm:mb-4">{region.elevation}</p>
                <p className="text-ivory-muted text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">{region.description}</p>
                <p className="font-mono text-[10px] sm:text-label text-ivory-muted uppercase">
                  Known for: {region.products}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
