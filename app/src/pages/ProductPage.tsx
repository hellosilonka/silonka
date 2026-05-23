import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ArrowLeft, Star, ShoppingBag, Truck, Shield, Leaf, ChevronRight, Minus, Plus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth } from '@/context/AuthContext';
import { getProductById, getRelatedProducts, addProductReview } from '@/lib/api';
import SEOHead, { breadcrumbSchema } from '@/components/SEOHead';

const BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';

function getImageSrc(image: string): string {
  if (!image) return '';
  return image.startsWith('/uploads') ? `${BASE_URL}${image}` : image;
}

interface Review {
  _id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Variation {
  _id: string;
  label: string;
  price: number;
  inStock: boolean;
}

interface Product {
  _id: string;
  id: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  image: string;
  images: string[];
  category: string;
  weight: string;
  intensity?: number;
  inStock: boolean;
  origin: string;
  ingredients: string;
  shelfLife: string;
  certifications: string[];
  variations: Variation[];
  reviews: Review[];
  averageRating: number;
  numReviews: number;
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`transition-colors ${s <= rating ? 'text-gold fill-gold' : s - 0.5 <= rating ? 'text-gold fill-gold/50' : 'text-white/20'}`}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
}

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="p-0.5 transition-transform hover:scale-125"
        >
          <Star
            className={`w-6 h-6 transition-colors ${s <= (hover || value) ? 'text-gold fill-gold' : 'text-white/20'}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { format } = useCurrency();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'reviews'>('description');

  // Review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const fetchData = async () => {
      try {
        const prod = await getProductById(id);
        setProduct(prod);
        if (prod.variations?.length > 0) {
          setSelectedVariation(prod.variations[0]._id);
        }
        try {
          const rel = await getRelatedProducts(id);
          setRelated(rel);
        } catch { /* ignore */ }
      } catch {
        navigate('/shop');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    setSelectedImage(0);
    setQuantity(1);
    setActiveTab('description');
  }, [id, navigate]);

  useEffect(() => {
    if (!heroRef.current || loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.product-image-main', { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'power3.out' });
      gsap.fromTo('.product-info', { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, delay: 0.15, ease: 'power3.out' });
    }, heroRef.current);
    return () => ctx.revert();
  }, [loading, product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal pt-20 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  const allImages = [product.image, ...(product.images || [])].filter(Boolean);
  const currentVariation = product.variations?.find((v) => v._id === selectedVariation);
  const activePrice = currentVariation ? currentVariation.price : product.price;
  const isInStock = currentVariation ? currentVariation.inStock : product.inStock;

  const handleAddToCart = () => {
    addItem({
      id: product.id + (currentVariation ? `-${currentVariation.label}` : ''),
      name: product.name,
      price: activePrice,
      image: product.image,
      variant: currentVariation ? currentVariation.label : product.weight,
    });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setReviewSubmitting(true);
    setReviewError('');
    setReviewSuccess('');
    try {
      await addProductReview(product._id, { rating: reviewRating, comment: reviewComment });
      setReviewSuccess('Review submitted!');
      setReviewComment('');
      setReviewRating(5);
      // Refresh product data
      const updated = await getProductById(id!);
      setProduct(updated);
    } catch (err: any) {
      setReviewError(err?.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal pt-20">
      <SEOHead
        title={`${product.name} — Silonka`}
        description={product.description}
        keywords={`${product.name}, ${product.category}, Ceylon spices, buy online`}
        canonicalPath={`/product/${product._id}`}
        ogImage={product.image}
        jsonLd={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Shop', url: '/shop' },
          { name: product.name, url: `/product/${product._id}` },
        ])}
      />

      {/* Breadcrumb */}
      <div className="px-4 sm:px-6 lg:px-[7vw] py-4">
        <nav className="flex items-center gap-2 font-mono text-[10px] sm:text-xs text-ivory-muted/60 uppercase tracking-widest">
          <Link to="/" className="hover:text-gold transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/shop" className="hover:text-gold transition-colors">Shop</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ivory-muted">{product.name}</span>
        </nav>
      </div>

      {/* Main Product Section */}
      <section ref={heroRef} className="px-4 sm:px-6 lg:px-[7vw] pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

          {/* Image Gallery */}
          <div className="product-image-main">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-charcoal-card border border-white/5 mb-4">
              <img
                src={getImageSrc(allImages[selectedImage])}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              {!isInStock && (
                <div className="absolute inset-0 bg-charcoal/70 flex items-center justify-center">
                  <span className="px-6 py-3 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-mono text-xs uppercase tracking-widest">
                    Out of Stock
                  </span>
                </div>
              )}
              {product.intensity && (
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-charcoal/80 backdrop-blur-sm border border-gold/30">
                  <span className="font-mono text-[10px] text-gold uppercase tracking-wider">🔥 {product.intensity}% intensity</span>
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                      selectedImage === i ? 'border-gold shadow-lg shadow-gold/20' : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={getImageSrc(img)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info flex flex-col">
            {/* Category Badge */}
            <span className="inline-flex items-center self-start px-3 py-1 rounded-full bg-gold/10 border border-gold/20 font-mono text-[10px] text-gold uppercase tracking-widest mb-4">
              {product.category}
            </span>

            <h1 className="font-display text-[clamp(28px,4vw,48px)] text-ivory leading-tight mb-3">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-5">
              <StarRating rating={product.averageRating || 0} size={18} />
              <span className="font-mono text-xs text-ivory-muted">
                {product.averageRating > 0 ? product.averageRating.toFixed(1) : '0'} ({product.numReviews || 0} review{product.numReviews !== 1 ? 's' : ''})
              </span>
            </div>

            <p className="text-ivory-muted leading-relaxed mb-6">{product.description}</p>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-display text-3xl sm:text-4xl text-gold">{format(activePrice)}</span>
              <span className="font-mono text-xs text-ivory-muted/60 uppercase">{currentVariation ? currentVariation.label : product.weight}</span>
            </div>

            {/* Variations */}
            {product.variations && product.variations.length > 0 && (
              <div className="mb-6">
                <label className="font-mono text-xs text-ivory-muted uppercase tracking-widest mb-3 block">Select Size</label>
                <div className="flex flex-wrap gap-2">
                  {product.variations.map((v) => (
                    <button
                      key={v._id}
                      onClick={() => setSelectedVariation(v._id)}
                      disabled={!v.inStock}
                      className={`px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider transition-all duration-300 ${
                        selectedVariation === v._id
                          ? 'bg-gold text-charcoal shadow-lg shadow-gold/25'
                          : v.inStock
                            ? 'bg-charcoal-card text-ivory-muted border border-white/10 hover:border-gold/50'
                            : 'bg-charcoal-card text-ivory-muted/30 border border-white/5 cursor-not-allowed line-through'
                      }`}
                    >
                      {v.label} — {format(v.price)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
              <div className="flex items-center border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 text-ivory-muted hover:text-gold hover:bg-white/5 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-5 py-3 font-mono text-sm text-ivory min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 text-ivory-muted hover:text-gold hover:bg-white/5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => { for (let i = 0; i < quantity; i++) handleAddToCart(); }}
                disabled={!isInStock}
                className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-mono text-xs uppercase tracking-widest transition-all duration-300 ${
                  isInStock
                    ? 'bg-gold text-charcoal hover:bg-gold-light hover:shadow-lg hover:shadow-gold/30 hover:-translate-y-0.5'
                    : 'bg-white/5 text-ivory-muted/40 cursor-not-allowed'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                {isInStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: 'Free Shipping', sub: 'Orders over $50' },
                { icon: Shield, label: '100% Authentic', sub: 'Certified origin' },
                { icon: Leaf, label: 'Sustainably Sourced', sub: 'Eco-friendly' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center p-3 rounded-xl bg-charcoal-card/50 border border-white/5">
                  <Icon className="w-5 h-5 text-gold mb-1.5" />
                  <span className="font-mono text-[9px] sm:text-[10px] text-ivory uppercase tracking-wider leading-tight">{label}</span>
                  <span className="text-[9px] text-ivory-muted/50 mt-0.5 hidden sm:block">{sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="px-4 sm:px-6 lg:px-[7vw] pb-20 border-t border-white/5 pt-12">
        {/* Tab Buttons */}
        <div className="flex gap-1 mb-10 overflow-x-auto">
          {(['description', 'details', 'reviews'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl font-mono text-xs uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-gold text-charcoal'
                  : 'text-ivory-muted hover:text-ivory hover:bg-white/5'
              }`}
            >
              {tab === 'reviews' ? `Reviews (${product.numReviews || 0})` : tab}
            </button>
          ))}
        </div>

        {/* Description Tab */}
        {activeTab === 'description' && (
          <div className="max-w-3xl">
            <p className="text-ivory-muted leading-relaxed text-base whitespace-pre-line">
              {product.longDescription || product.description}
            </p>
          </div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="max-w-2xl">
            <div className="space-y-0">
              {[
                { label: 'Weight', value: product.weight },
                { label: 'Category', value: product.category },
                { label: 'Origin', value: product.origin || 'Sri Lanka' },
                ...(product.ingredients ? [{ label: 'Ingredients', value: product.ingredients }] : []),
                ...(product.shelfLife ? [{ label: 'Shelf Life', value: product.shelfLife }] : []),
                ...(product.intensity ? [{ label: 'Intensity', value: `${product.intensity}%` }] : []),
                { label: 'In Stock', value: isInStock ? 'Yes' : 'No' },
              ].map(({ label, value }, i) => (
                <div key={label} className={`flex justify-between py-4 ${i > 0 ? 'border-t border-white/5' : ''}`}>
                  <span className="font-mono text-xs text-ivory-muted uppercase tracking-wider">{label}</span>
                  <span className="text-ivory text-sm capitalize">{value}</span>
                </div>
              ))}
            </div>

            {product.certifications && product.certifications.length > 0 && (
              <div className="mt-6">
                <span className="font-mono text-xs text-ivory-muted uppercase tracking-wider block mb-3">Certifications</span>
                <div className="flex flex-wrap gap-2">
                  {product.certifications.map((cert) => (
                    <span key={cert} className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-mono text-[10px] uppercase tracking-wider">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="max-w-3xl">
            {/* Rating Summary */}
            <div className="flex items-center gap-6 mb-10 p-6 rounded-2xl bg-charcoal-card border border-white/5">
              <div className="text-center">
                <div className="font-display text-5xl text-gold mb-1">{product.averageRating > 0 ? product.averageRating.toFixed(1) : '—'}</div>
                <StarRating rating={product.averageRating || 0} size={16} />
                <p className="font-mono text-[10px] text-ivory-muted mt-2 uppercase">{product.numReviews || 0} reviews</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = product.reviews?.filter((r) => r.rating === star).length || 0;
                  const pct = product.numReviews ? (count / product.numReviews) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-ivory-muted w-6 text-right">{star}★</span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-mono text-[10px] text-ivory-muted/60 w-6">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Write Review Form */}
            {user ? (
              <form onSubmit={handleSubmitReview} className="mb-10 p-6 rounded-2xl bg-charcoal-card border border-white/5">
                <h3 className="font-display text-lg text-ivory mb-4">Write a Review</h3>
                <div className="mb-4">
                  <label className="font-mono text-xs text-ivory-muted uppercase tracking-wider block mb-2">Your Rating</label>
                  <StarSelector value={reviewRating} onChange={setReviewRating} />
                </div>
                <div className="mb-4">
                  <label className="font-mono text-xs text-ivory-muted uppercase tracking-wider block mb-2">Your Review</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-charcoal border border-white/10 text-ivory placeholder:text-ivory-muted/40 focus:outline-none focus:border-gold/50 transition-colors text-sm resize-none"
                    placeholder="Share your experience with this product..."
                    required
                  />
                </div>
                {reviewError && <p className="text-red-400 text-xs mb-3">{reviewError}</p>}
                {reviewSuccess && <p className="text-green-400 text-xs mb-3">{reviewSuccess}</p>}
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-6 py-3 rounded-xl bg-gold text-charcoal font-mono text-xs uppercase tracking-widest hover:bg-gold-light transition-all disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="mb-10 p-6 rounded-2xl bg-charcoal-card border border-white/5 text-center">
                <p className="text-ivory-muted text-sm mb-3">Please log in to write a review</p>
                <Link to="/login" className="inline-flex px-5 py-2.5 rounded-xl bg-gold text-charcoal font-mono text-xs uppercase tracking-widest hover:bg-gold-light transition-colors">
                  Log In
                </Link>
              </div>
            )}

            {/* Reviews List */}
            {product.reviews && product.reviews.length > 0 ? (
              <div className="space-y-4">
                {product.reviews.slice().reverse().map((review) => (
                  <div key={review._id} className="p-5 rounded-2xl bg-charcoal-card/50 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gold/15 border border-gold/25 flex items-center justify-center">
                          <span className="font-display text-sm text-gold">{review.userName?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-ivory text-sm font-medium">{review.userName}</p>
                          <p className="font-mono text-[10px] text-ivory-muted/50">
                            {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} size={14} />
                    </div>
                    <p className="text-ivory-muted text-sm leading-relaxed mt-2">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="w-10 h-10 text-ivory-muted/20 mx-auto mb-3" />
                <p className="text-ivory-muted text-sm">No reviews yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-[7vw] pb-20 border-t border-white/5 pt-12">
          <h2 className="font-display text-2xl sm:text-3xl text-ivory mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {related.map((rp) => (
              <Link
                key={rp._id}
                to={`/product/${rp._id}`}
                className="group rounded-2xl overflow-hidden bg-charcoal-card border border-white/5 hover:border-gold/30 transition-all duration-500"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={getImageSrc(rp.image)}
                    alt={rp.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-display text-sm sm:text-base text-ivory group-hover:text-gold transition-colors line-clamp-1">{rp.name}</h3>
                  <p className="text-ivory-muted text-xs line-clamp-1 mt-1">{rp.description}</p>
                  <span className="font-display text-lg text-gold mt-2 block">{format(rp.price)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Back to Shop */}
      <div className="px-4 sm:px-6 lg:px-[7vw] pb-16">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-ivory-muted hover:text-gold transition-colors font-mono text-xs uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shop
        </Link>
      </div>
    </div>
  );
}
