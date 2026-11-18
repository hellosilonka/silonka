import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, Tag, ArrowLeft, Share2 } from 'lucide-react';
import { getBlogBySlug } from '@/lib/api';
import SEOHead, { articleSchema, breadcrumbSchema } from '@/components/SEOHead';

const BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';

function getImageSrc(image: string): string {
  if (!image) return '';
  return image.startsWith('/uploads') ? `${BASE_URL}${image}` : image;
}

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  tags: string[];
  author: string;
  readTime: number;
  createdAt: string;
}

// Converts plain text (with markdown-ish line breaks) to JSX paragraphs
function renderContent(content: string) {
  return content.split('\n\n').map((block, i) => {
    if (block.startsWith('## ')) {
      return <h2 key={i} className="font-display text-2xl text-ivory mt-10 mb-4">{block.slice(3)}</h2>;
    }
    if (block.startsWith('### ')) {
      return <h3 key={i} className="font-display text-xl text-ivory-muted mt-8 mb-3">{block.slice(4)}</h3>;
    }
    if (block.startsWith('- ') || block.startsWith('* ')) {
      const items = block.split('\n').filter(l => l.startsWith('- ') || l.startsWith('* '));
      return (
        <ul key={i} className="list-none space-y-2 my-4">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-3 text-ivory-muted leading-relaxed">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
              {item.slice(2)}
            </li>
          ))}
        </ul>
      );
    }
    if (block.startsWith('> ')) {
      return (
        <blockquote key={i} className="border-l-2 border-gold pl-6 py-2 my-6 italic text-ivory-muted text-lg">
          {block.slice(2)}
        </blockquote>
      );
    }
    return (
      <p key={i} className="text-ivory-muted leading-relaxed my-4">
        {block}
      </p>
    );
  });
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    const fetch = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const data = await getBlogBySlug(slug);
        if (active) setPost(data);
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetch();
    return () => { active = false; };
  }, [slug]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: post?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal pt-20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-charcoal pt-32 text-center">
        <p className="font-display text-3xl text-ivory-muted mb-4">Article not found</p>
        <Link to="/blog" className="text-gold font-mono text-xs uppercase tracking-widest hover:text-gold/80">← Back to Blog</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal pt-20">
      <SEOHead
        title={`${post.title} — Silonka Blog`}
        description={post.excerpt}
        keywords={post.tags?.join(', ')}
        canonicalPath={`/blog/${post.slug}`}
        ogType="article"
        ogImage={post.image || undefined}
        jsonLd={[
          articleSchema({
            title: post.title,
            description: post.excerpt,
            slug: post.slug,
            image: post.image,
            author: post.author,
            datePublished: post.createdAt,
            tags: post.tags,
          }),
          breadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Blog', url: '/blog' },
            { name: post.title, url: `/blog/${post.slug}` },
          ]),
        ]}
      />
      {/* Hero image */}
      {post.image && (
        <div className="h-[40vh] sm:h-[55vh] overflow-hidden relative">
          <img
            src={getImageSrc(post.image)}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-transparent" />
        </div>
      )}

      <article className={`max-w-3xl mx-auto px-4 sm:px-6 ${post.image ? '-mt-24 relative z-10' : 'pt-16'} pb-20`}>
        {/* Back */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-ivory-muted hover:text-gold transition-colors font-mono text-xs uppercase tracking-widest mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Journal
        </Link>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {post.tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 bg-gold/10 border border-gold/20 text-gold font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
              <Tag className="w-3 h-3" />{tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="font-display text-[clamp(28px,5vw,52px)] text-ivory leading-tight mb-6">
          {post.title}
        </h1>

        {/* Excerpt */}
        <p className="text-ivory-muted text-lg leading-relaxed border-l-2 border-gold pl-5 mb-8 italic">
          {post.excerpt}
        </p>

        {/* Meta */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-white/5 mb-10">
          <div className="flex items-center gap-5 text-xs font-mono text-ivory-muted/70">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime} min read
            </span>
            <span className="text-ivory-muted">By {post.author}</span>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-ivory-muted hover:text-gold transition-colors font-mono text-xs uppercase tracking-widest"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        {/* Content */}
        <div className="prose-custom text-base">
          {renderContent(post.content)}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/5 flex items-center justify-between">
          <Link
            to="/blog"
            className="flex items-center gap-2 text-ivory-muted hover:text-gold transition-colors font-mono text-xs uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" />
            All Articles
          </Link>
          <Link
            to="/shop"
            className="px-5 py-2.5 rounded-full bg-gold text-charcoal font-mono text-xs uppercase tracking-widest hover:bg-gold/90 transition-colors"
          >
            Shop Spices
          </Link>
        </div>
      </article>
    </div>
  );
}
