import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Tag, ArrowRight, Search, X } from 'lucide-react';
import { getBlogs } from '@/lib/api';
import SEOHead, { breadcrumbSchema } from '@/components/SEOHead';

const BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  tags: string[];
  author: string;
  readTime: number;
  createdAt: string;
  published: boolean;
}

function getImageSrc(image: string): string {
  if (!image) return '';
  return image.startsWith('/uploads') ? `${BASE_URL}${image}` : image;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await getBlogs();
      setPosts(data);
    } catch (err) {
      console.error('Error fetching blog posts', err);
    } finally {
      setLoading(false);
    }
  };

  // Collect all unique tags
  const allTags = Array.from(new Set(posts.flatMap(p => p.tags))).filter(Boolean);

  const filtered = posts.filter(post => {
    const matchSearch =
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchTag = !activeTag || post.tags.includes(activeTag);
    return matchSearch && matchTag;
  });

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="min-h-screen bg-charcoal pt-20">
      <SEOHead
        title="Ceylon Cinnamon Blog — Health Benefits, Recipes & Spice Guides | Silonka"
        description="Discover everything about Ceylon Cinnamon — health benefits, recipes, antioxidant properties, diabetes management, and how it compares to Cassia. Expert insights on premium Sri Lankan spices from Silonka."
        keywords="Ceylon Cinnamon, Ceylon Cinnamon health benefits, true cinnamon, Cinnamomum verum, cinnamon vs cassia, Ceylon spice blog, Sri Lanka cinnamon, buy Ceylon cinnamon, organic cinnamon, Silonka blog"
        canonicalPath="/blog"
        ogType="blog"
        jsonLd={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
        ])}
      />

      {/* Hero */}
      <section className="relative py-16 sm:py-24 border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_40%_60%,rgba(212,175,55,0.07),transparent_60%)] pointer-events-none" />
        <div className="relative px-4 sm:px-6 lg:px-[7vw]">
          <div className="max-w-2xl">
            <span className="font-mono text-label text-gold uppercase tracking-[0.2em] mb-4 block">
              The Silonka Journal
            </span>
            <h1 className="font-display text-[clamp(36px,5vw,64px)] text-ivory mb-4 leading-tight">
              There is only one true cinnamon. It comes from Sri Lanka.
            </h1>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="py-8 px-4 sm:px-6 lg:px-[7vw] border-b border-white/5">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-muted" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 rounded-full bg-charcoal-card border border-white/10 text-ivory placeholder:text-ivory-muted/50 focus:outline-none focus:border-gold/50 text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory-muted hover:text-ivory">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tag filters */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTag('')}
                className={`px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all ${!activeTag ? 'bg-gold text-charcoal' : 'bg-charcoal-card border border-white/10 text-ivory-muted hover:border-gold/40'}`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                  className={`px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all ${activeTag === tag ? 'bg-gold text-charcoal' : 'bg-charcoal-card border border-white/10 text-ivory-muted hover:border-gold/40'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-[7vw]">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-display text-2xl text-ivory-muted mb-2">No articles found</p>
            <p className="text-ivory-muted/60 text-sm">Try a different search or tag filter</p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Featured Post */}
            {featured && (
              <Link to={`/blog/${featured.slug}`} className="group block">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 rounded-3xl overflow-hidden border border-white/5 hover:border-gold/20 transition-all duration-500 bg-charcoal-card">
                  {/* Image */}
                  <div className="aspect-video lg:aspect-auto lg:min-h-[360px] overflow-hidden bg-charcoal relative">
                    {featured.image ? (
                      <img
                        src={getImageSrc(featured.image)}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-charcoal to-charcoal-card">
                        <span className="font-display text-6xl text-gold/20">S</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-gold text-charcoal font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">Featured</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 lg:p-12 flex flex-col justify-center">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {featured.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 font-mono text-[10px] uppercase text-gold tracking-wider">
                          <Tag className="w-3 h-3" />{tag}
                        </span>
                      ))}
                    </div>
                    <h2 className="font-display text-2xl sm:text-3xl text-ivory mb-4 group-hover:text-gold transition-colors leading-tight">
                      {featured.title}
                    </h2>
                    <p className="text-ivory-muted text-sm leading-relaxed mb-6 line-clamp-3">
                      {featured.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-ivory-muted/60 text-xs font-mono">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(featured.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{featured.readTime} min read</span>
                      </div>
                      <span className="flex items-center gap-1 text-gold font-mono text-xs uppercase tracking-wider group-hover:gap-2 transition-all">
                        Read <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map(post => (
                  <Link
                    key={post._id}
                    to={`/blog/${post.slug}`}
                    className="group rounded-2xl overflow-hidden border border-white/5 hover:border-gold/20 bg-charcoal-card transition-all duration-500 flex flex-col"
                  >
                    {/* Image */}
                    <div className="aspect-video overflow-hidden bg-charcoal">
                      {post.image ? (
                        <img
                          src={getImageSrc(post.image)}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-charcoal to-charcoal-card">
                          <span className="font-display text-4xl text-gold/20">S</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="font-mono text-[10px] uppercase text-gold/80 tracking-wider">#{tag}</span>
                        ))}
                      </div>
                      <h3 className="font-display text-lg text-ivory group-hover:text-gold transition-colors leading-tight mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-ivory-muted text-sm leading-relaxed line-clamp-2 mb-4 flex-1">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-xs font-mono text-ivory-muted/60 border-t border-white/5 pt-4 mt-auto">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{post.readTime} min</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
