import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Star, Leaf, Truck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { getProducts } from '@/lib/api';
import SEOHead, { ORGANIZATION_SCHEMA, WEBSITE_SCHEMA } from '@/components/SEOHead';

gsap.registerPlugin(ScrollTrigger);

const BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  weight?: string;
  inStock?: boolean;
}

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();
  const { format } = useCurrency();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  // Fetch real products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const products = await getProducts();
        // Show first 3 products as featured
        setFeaturedProducts(products.slice(0, 3));
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    const bg = bgRef.current;
    const content = contentRef.current;
    const title = titleRef.current;
    const subtitle = subtitleRef.current;
    const cta = ctaRef.current;

    if (!hero || !bg || !content || !title || !subtitle || !cta) return;

    const ctx = gsap.context(() => {
      // Hero entrance animation timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Background fade (removed scale animation so Tailwind classes persist)
      tl.fromTo(bg,
        { opacity: 0 },
        { opacity: 1, duration: 2 }
      )
        // Title words with 3D effect
        .fromTo(title.querySelectorAll('.word'),
          { y: 100, opacity: 0, rotateX: -60, transformOrigin: 'center bottom' },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            duration: 1.2,
            stagger: 0.12,
            ease: 'power4.out'
          },
          '-=1'
        )
        // Subtitle
        .fromTo(subtitle,
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 1 },
          '-=0.7'
        )
        // CTA buttons
        .fromTo(cta.children,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 },
          '-=0.5'
        );

      // Parallax scroll effect for background
      gsap.to(bg, {
        yPercent: 15,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        }
      });

      // Content fade and lift on scroll
      gsap.to(content, {
        y: -100,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: '60% top',
          scrub: 1,
        }
      });

    }, hero);

    return () => ctx.revert();
  }, []);

  const handleQuickAdd = () => {
    if (featuredProducts.length > 0) {
      const first = featuredProducts[0];
      addItem({
        id: first._id,
        name: first.name,
        price: first.price,
        image: first.image?.startsWith('/uploads') ? `${BASE_URL}${first.image}` : first.image,
        variant: first.weight || '',
      });
    }
  };

  return (
    <div className="relative">
      <SEOHead
        title="Silonka — Premium Ceylon Cinnamon & Spices from Sri Lanka"
        description="Buy authentic Ceylon Cinnamon (Cinnamomum verum), Black Pepper, and Cloves — single-origin, hand-harvested from Sri Lanka's misty hill country. True cinnamon with low coumarin, delivered fresh worldwide."
        keywords="Ceylon Cinnamon, buy Ceylon Cinnamon, true cinnamon, Cinnamomum verum, Sri Lanka spices, Ceylon black pepper, organic cinnamon, premium spices, single origin spices, Silonka"
        canonicalPath="/"
        ogImage="/hero_spice_field.jpg"
        jsonLd={[ORGANIZATION_SCHEMA, WEBSITE_SCHEMA]}
      />
      <section
        ref={heroRef}
        className="relative h-[100dvh] min-h-screen w-full overflow-hidden"
      >
        {/* Background Video with Parallax */}
        <div
          ref={bgRef}
          className="absolute inset-0 scale-150 sm:scale-110"
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="/hero_spice_field.jpg"
            className="w-full h-full object-cover object-center"
          >
            <source src="/herovideo 1.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/70 via-charcoal/30 to-charcoal" />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/50 via-transparent to-charcoal/50" />

        {/* Vignette Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_30%,rgba(0,0,0,0.6)_100%)]" />

        {/* Content */}
        <div
          ref={contentRef}
          className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4 sm:px-6"
        >
          {/* Main Title */}
          <h1
            ref={titleRef}
            className="font-display text-[clamp(36px,10vw,100px)] text-ivory leading-[0.9] mb-4 sm:mb-6 perspective-1000"
          >
            <span className="word inline-block">Silonka</span>
            <br />
            <span className="word inline-block text-gradient-gold">Spices</span>
          </h1>

          {/* Subtitle */}
          <p
            ref={subtitleRef}
            className="text-base sm:text-lg md:text-xl text-ivory/70 max-w-xl mb-8 sm:mb-10 leading-relaxed px-4"
          >
            The magical harvest born from the mist-veiled highlands of Ceylon.
          </p>

          {/* CTA Buttons */}
          <div ref={ctaRef} className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <a
              href="/shop"
              className="group btn-gold flex items-center gap-2 sm:gap-3 text-sm sm:text-base"
            >
              Explore Collection
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <button
              onClick={handleQuickAdd}
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-pill font-mono text-label uppercase tracking-widest text-ivory border border-ivory/30 hover:border-gold hover:text-gold transition-all duration-300 text-xs sm:text-sm"
            >
              Quick Add — {featuredProducts.length > 0 ? format(featuredProducts[0].price) : ''}
            </button>
          </div>
        </div>


      </section>

      {/* Featured Products Section */}
      <section id="featured" className="relative py-16 sm:py-24 lg:py-32 bg-charcoal">
        <div className="absolute inset-0 vignette pointer-events-none" />

        <div className="relative px-4 sm:px-6 lg:px-[7vw]">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-20">
            <span className="font-mono text-[10px] sm:text-label text-gold uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4 block">
              Curated Selection
            </span>
            <h2 className="font-display text-[clamp(28px,5vw,48px)] text-ivory mb-4 sm:mb-6">
              Our Signature Collection
            </h2>
            <p className="text-sm sm:text-body text-ivory-muted max-w-xl mx-auto px-4">
              Each spice is hand-selected from smallholder farms and processed
              in small batches to preserve its essential oils.
            </p>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {featuredProducts.map((product, index) => (
              <ProductCard key={product._id} product={product} index={index} />
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-10 sm:mt-16">
            <a
              href="/shop"
              className="inline-flex items-center gap-2 sm:gap-3 text-gold hover:text-gold-light transition-colors font-mono text-label uppercase tracking-widest group text-xs sm:text-sm"
            >
              View All Products
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-2 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Story Preview Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 bg-charcoal-light">
        <div className="absolute inset-0 vignette pointer-events-none" />

        <div className="relative px-4 sm:px-6 lg:px-[7vw]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">
            {/* Image */}
            <div className="relative order-2 lg:order-1">
              <div className="aspect-[4/5] rounded-card overflow-hidden">
                <img
                  src="/craft_mortar.jpg"
                  alt="Traditional mortar and pestle used for grinding fresh Ceylon spices by hand"
                  width={864}
                  height={1184}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>

            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              <h2 className="font-display text-[clamp(24px,4vw,40px)] text-ivory mb-4 sm:mb-6">
                <span className="text-gradient-gold"> Our Story Starts in the Soil</span>
              </h2>
              <p className="text-sm sm:text-body text-ivory-muted mb-4 sm:mb-6 leading-relaxed">
                From the rugged, rolling plains of the Southern and South-Western regions of Sri Lanka,
                we bring the world cinnamon of quality that is unlike any other. Every leaf and bark
                is handpicked from smallholder farms, nurtured by generations of growers who know
                the land intimately, and processed in small, careful batches to preserve their
                natural oils, fragrance, and full-bodied flavor.
              </p>
              <p className="text-sm sm:text-body text-ivory-muted mb-4 sm:mb-6 leading-relaxed">
                Sun-dried, hand-processed, and rigorously inspected, so the cinnamon that reaches
                your kitchen or your business is the purest essence of the island: vibrant, aromatic,
                and ready to elevate every dish.
              </p>
              <p className="text-sm sm:text-body text-ivory-muted mb-4 sm:mb-6 leading-relaxed">
                We work directly with farmers, ensuring every batch is fully traceable, ethically
                sourced, and handled with care. From the grove to the rack, from the bark to the
                quill, nothing is rushed because true quality cannot be hurried.
              </p>
              <p className="text-sm sm:text-body text-ivory-muted mb-6 sm:mb-8 leading-relaxed">
                The same level of care and inspection is to be expected of the other spices
                that we have to offer, as well.
              </p>
              <a
                href="/origins"
                className="btn-gold inline-flex items-center gap-2 sm:gap-3 text-sm"
              >
                Discover Our Origins
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quality Promise Section */}
      <section className="relative py-12 sm:py-16 lg:py-24 bg-charcoal">
        <div className="absolute inset-0 vignette pointer-events-none" />

        <div className="relative px-4 sm:px-6 lg:px-[7vw]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {qualityFeatures.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 sm:p-8 rounded-card border border-white/5 hover:border-gold/30 transition-colors duration-300 group"
              >
                <feature.icon className="w-8 h-8 sm:w-10 sm:h-10 text-gold mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="font-display text-lg sm:text-xl text-ivory mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-ivory-muted text-xs sm:text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Preview */}
      <section className="relative py-16 sm:py-24 lg:py-32 bg-charcoal-light">
        <div className="absolute inset-0 vignette pointer-events-none" />

        <div className="relative px-4 sm:px-6 lg:px-[7vw]">
          <div className="text-center mb-10 sm:mb-16">
            <span className="font-mono text-[10px] sm:text-label text-gold uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4 block">
              Testimonials
            </span>
            <h2 className="font-display text-[clamp(24px,4vw,40px)] text-ivory">
              What Chefs Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-6 sm:p-8 rounded-card bg-charcoal border border-white/5 hover:border-gold/20 transition-colors"
              >
                <div className="flex gap-1 mb-4 sm:mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 text-gold fill-gold" />
                  ))}
                </div>
                <p className="text-ivory/90 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-display text-base sm:text-lg text-ivory">{testimonial.name}</p>
                  <p className="font-mono text-[10px] sm:text-label text-ivory-muted uppercase">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// Quality Features Data
const qualityFeatures = [
  {
    icon: Leaf,
    title: 'Single Origin',
    description: 'Every spice comes from a specific region in Sri Lanka, traceable to the farm.',
  },
  {
    icon: Star,
    title: 'Small Batch',
    description: 'We process in limited quantities to ensure peak freshness and quality.',
  },
  {
    icon: Truck,
    title: 'Sustainable',
    description: 'Fair prices for farmers. Eco-friendly packaging. Zero waste goals.',
  },
];

// Testimonials Data
const testimonials = [
  {
    quote: "The cinnamon is outrageously fragrant—my pastry chef noticed immediately.",
    name: "Elena M.",
    role: "Pastry Chef",
  },
  {
    quote: "Finally, a pepper with actual heat and complexity. Night and day difference.",
    name: "Rohan S.",
    role: "Home Cook",
  },
  {
    quote: "Guests ask about the spices on every plate. We've switched our entire menu.",
    name: "Isaac T.",
    role: "Chef-Owner",
  },
];

// Product Card Component
function ProductCard({ product, index }: { product: Product; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();
  const { format } = useCurrency();

  const badges = ['Bestseller', 'Premium', 'Signature', 'Popular', 'New', 'Craft'];
  const badge = badges[index % badges.length];

  const imageSrc = product.image?.startsWith('/uploads')
    ? `${BASE_URL}${product.image}`
    : product.image;

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(card,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay: index * 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            toggleActions: 'play none none none',
          }
        }
      );
    }, card);

    return () => ctx.revert();
  }, [index]);

  const handleAddToCart = () => {
    addItem({
      id: product._id,
      name: product.name,
      price: product.price,
      image: imageSrc,
    });
  };

  return (
    <div
      ref={cardRef}
      className="group relative rounded-card overflow-hidden bg-charcoal-card border border-white/5 hover:border-gold/30 transition-all duration-500"
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden relative">
        <img
          src={imageSrc}
          alt={product.name}
          width={600}
          height={600}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={(e) => { (e.target as HTMLImageElement).src = '/collection_set.jpg'; }}
        />
        {/* Badge */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
          <span className="px-2 sm:px-3 py-1 rounded-full bg-gold text-charcoal font-mono text-[10px] sm:text-xs uppercase tracking-wider">
            {badge}
          </span>
        </div>
        {/* Quick Add Overlay */}
        <div className="absolute inset-0 bg-charcoal/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button
            onClick={handleAddToCart}
            className="px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gold text-charcoal font-mono text-label uppercase tracking-wider hover:bg-gold-light transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300 text-xs sm:text-sm"
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        <h3 className="font-display text-lg sm:text-xl text-ivory mb-1 sm:mb-2">{product.name}</h3>
        <p className="text-ivory-muted text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="font-display text-xl sm:text-2xl text-gold">{format(product.price)}</span>
          <button
            onClick={handleAddToCart}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-gold/50 text-gold font-mono text-[10px] sm:text-xs uppercase tracking-wider hover:bg-gold hover:text-charcoal transition-all duration-300"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
