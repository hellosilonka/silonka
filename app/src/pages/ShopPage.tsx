import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Filter, ChevronDown, ShoppingBag, Search, X, Package } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { getProducts } from '@/lib/api';
import SEOHead, { breadcrumbSchema } from '@/components/SEOHead';

const BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';

gsap.registerPlugin(ScrollTrigger);

interface Product {
  _id: string;
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  weight: string;
  intensity?: number;
}



const categories = [
  { id: 'all', name: 'All' },
  { id: 'sets', name: 'Gift Sets' },
  { id: 'pepper', name: 'Pepper' },
  { id: 'cinnamon', name: 'Cinnamon' },
  { id: 'spices', name: 'Spices' },
];

const sortOptions = [
  { id: 'featured', name: 'Featured' },
  { id: 'price-low', name: 'Price: Low to High' },
  { id: 'price-high', name: 'Price: High to Low' },
  { id: 'name', name: 'Name: A-Z' },
];

export default function ShopPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const heroRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        const data = await getProducts();
        setAllProducts(data);
      } catch (error) {
        console.error("Error fetching products", error);
      }
    };
    fetchProductsData();

    const hero = heroRef.current;
    if (!hero) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(hero.querySelector('.hero-content'),
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
      );
    }, hero);

    return () => ctx.revert();
  }, []);

  // Filter and sort products
  const filteredProducts = allProducts
    .filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (selectedSort) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-charcoal pt-20">
      <SEOHead
        title="Shop Premium Ceylon Spices Online — Silonka"
        description="Browse and buy authentic Ceylon cinnamon, black pepper, cloves, and curated spice gift sets. Single-origin, hand-harvested from Sri Lanka. Free shipping on select orders."
        keywords="buy Ceylon spices, Ceylon cinnamon online, Sri Lanka black pepper, organic spices shop, spice gift sets, wholesale spices"
        canonicalPath="/shop"
        ogImage="/collection_set.jpg"
        jsonLd={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Shop', url: '/shop' },
        ])}
      />
      {/* Hero Section */}
      <section ref={heroRef} className="relative py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 vignette pointer-events-none" />

        <div className="relative px-4 sm:px-6 lg:px-[7vw]">
          <div className="hero-content text-center max-w-3xl mx-auto">
            <span className="font-mono text-[10px] sm:text-label text-gold uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4 block">
              Our Collection
            </span>
            <h1 className="font-display text-[clamp(32px,6vw,56px)] text-ivory mb-4 sm:mb-6 leading-tight">
              Shop Silonka Spices
            </h1>
            <p className="text-sm sm:text-body text-ivory-muted leading-relaxed px-4">
              From our partner farms in Sri Lanka to your kitchen.
              Each spice is harvested at peak potency and sealed for maximum freshness.
            </p>
          </div>
        </div>
      </section>


      {/* Filters &amp; Products */}
      <section className="relative py-8 sm:py-12 border-t border-white/5">
        <div className="relative px-4 sm:px-6 lg:px-[7vw]">
          {/* Filter Bar */}
          <div className="flex flex-col gap-4 sm:gap-6 mb-8 sm:mb-12">
            {/* Search & Sort Row */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-ivory-muted" />
                <input
                  type="text"
                  placeholder="Search spices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-10 py-2.5 sm:py-3 rounded-full bg-charcoal-card border border-white/10 text-ivory placeholder:text-ivory-muted/50 focus:outline-none focus:border-gold/50 transition-colors text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-ivory-muted hover:text-ivory"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="appearance-none px-4 sm:px-5 py-2.5 sm:py-3 pr-10 sm:pr-12 rounded-full bg-charcoal-card border border-white/10 text-ivory font-mono text-xs sm:text-label uppercase focus:outline-none focus:border-gold/50 cursor-pointer w-full sm:w-auto"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-muted pointer-events-none" />
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Desktop Category Pills */}
              <div className="hidden sm:flex items-center gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-mono text-[10px] sm:text-label uppercase tracking-wider transition-all duration-300 ${selectedCategory === category.id
                      ? 'bg-gold text-charcoal'
                      : 'bg-charcoal-card text-ivory-muted border border-white/10 hover:border-gold/50 hover:text-ivory'
                      }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="sm:hidden flex items-center gap-2 px-4 py-2.5 rounded-full bg-charcoal-card border border-white/10 text-ivory font-mono text-xs uppercase"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Mobile Filters */}
          {isFilterOpen && (
            <div className="sm:hidden mb-6 p-4 sm:p-6 rounded-card bg-charcoal-card border border-white/5">
              <p className="font-mono text-label text-ivory-muted uppercase mb-3 sm:mb-4">Categories</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setIsFilterOpen(false);
                    }}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-mono text-[10px] sm:text-xs uppercase tracking-wider transition-all duration-300 ${selectedCategory === category.id
                      ? 'bg-gold text-charcoal'
                      : 'bg-charcoal text-ivory-muted border border-white/10'
                      }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results Count */}
          <p className="font-mono text-[10px] sm:text-label text-ivory-muted uppercase mb-4 sm:mb-8">
            Showing {filteredProducts.length} products
          </p>

          {/* Product Grid */}
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product, index) => (
              <ShopProductCard key={product.id} product={product} index={index} />
            ))}
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-16 sm:py-20">
              <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-ivory-muted/30 mx-auto mb-4" />
              <p className="font-display text-lg sm:text-xl text-ivory-muted mb-2">No products found</p>
              <p className="text-ivory-muted/60 text-sm">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </section>

      {/* Bulk Orders Banner */}
      <section className="relative py-8 px-4 sm:px-6 lg:px-[7vw] pb-16">
        <div className="rounded-2xl bg-gradient-to-r from-charcoal-card via-[#1e1d18] to-charcoal-card border border-gold/20 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold/15 border border-gold/25 flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h3 className="font-display text-lg text-ivory mb-1">Bulk Orders</h3>
              <p className="text-ivory-muted text-sm">Custom pricing for businesses, hotels, cafés &amp; retailers. Minimum quantities apply.</p>
            </div>
          </div>
          <Link
            to="/bulk-order"
            className="flex-shrink-0 px-6 py-3 bg-gold text-charcoal rounded-xl font-mono text-xs uppercase tracking-widest hover:bg-gold/90 transition-colors flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Place Bulk Order
          </Link>
        </div>
      </section>
    </div>
  );
}

function ShopProductCard({ product, index }: { product: Product; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();
  const { format } = useCurrency();

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(card,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          delay: index * 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 95%',
            toggleActions: 'play none none none',
          }
        }
      );
    }, card);

    return () => ctx.revert();
  }, [index]);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      variant: product.weight,
    });
  };

  return (
    <div
      ref={cardRef}
      className="group relative rounded-card overflow-hidden bg-charcoal-card border border-white/5 hover:border-gold/30 transition-all duration-500"
    >
      {/* Image */}
      <Link to={`/product/${product._id}`} className="aspect-square overflow-hidden relative block">
        <img
          src={product.image?.startsWith('/uploads') ? `${BASE_URL}${product.image}` : product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        {/* Quick Add Overlay */}
        <div className="absolute inset-0 bg-charcoal/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button
            onClick={(e) => { e.preventDefault(); handleAddToCart(); }}
            className="px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gold text-charcoal font-mono text-label uppercase tracking-wider hover:bg-gold-light transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300 text-xs sm:text-sm"
          >
            Add to Cart
          </button>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-1 sm:mb-2">
          <Link to={`/product/${product._id}`} className="font-display text-base sm:text-lg text-ivory group-hover:text-gold transition-colors line-clamp-1">
            {product.name}
          </Link>
          <span className="font-mono text-[10px] sm:text-xs text-ivory-muted flex-shrink-0 ml-2">{product.weight}</span>
        </div>
        <p className="text-ivory-muted text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{product.description}</p>

        {/* Intensity Meter for Pepper */}
        {product.intensity && (
          <div className="mb-3 sm:mb-4">
            <div className="flex justify-between text-[10px] sm:text-xs mb-1">
              <span className="text-ivory-muted">Intensity</span>
              <span className="text-gold">{product.intensity}%</span>
            </div>
            <div className="h-0.5 sm:h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full"
                style={{ width: `${product.intensity}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="font-display text-lg sm:text-xl text-gold">{format(product.price)}</span>
          <button
            onClick={handleAddToCart}
            className="p-1.5 sm:p-2 rounded-full border border-gold/50 text-gold hover:bg-gold hover:text-charcoal transition-all duration-300"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
