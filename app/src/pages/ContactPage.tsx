import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Mail, Phone, MapPin, Send, Instagram, Check } from 'lucide-react';
import SEOHead, { faqSchema, breadcrumbSchema } from '@/components/SEOHead';

gsap.registerPlugin(ScrollTrigger);

export default function ContactPage() {
  const heroRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    const form = formRef.current;

    if (!hero || !form) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(hero.querySelector('.hero-content'),
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
      );

      gsap.fromTo(form,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: form,
            start: 'top 85%',
          }
        }
      );
    });

    return () => ctx.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-charcoal pt-20">
      <SEOHead
        title="Contact Silonka — Ceylon Spice Experts"
        description="Have questions about our Ceylon spices, shipping, or wholesale orders? Get in touch with Silonka. Based in Colombo, Sri Lanka — we respond within 24 hours."
        keywords="contact Silonka, Ceylon spice questions, wholesale spice inquiry, spice shipping info, Sri Lanka spice supplier"
        canonicalPath="/contact"
        jsonLd={[
          breadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Contact', url: '/contact' },
          ]),
          faqSchema([
            { question: 'How long does shipping take?', answer: 'Europe: 3-5 business days. Rest of world: 7-10 business days.' },
            { question: 'What is your return policy?', answer: 'If you\'re not satisfied, contact us within 30 days for a full refund.' },
            { question: 'Are your spices organic?', answer: 'Yes, all our partner farms are certified organic.' },
            { question: 'Do you offer wholesale?', answer: 'Absolutely. Contact us for wholesale pricing and bulk orders.' },
          ]),
        ]}
      />
      {/* Hero Section */}
      <section ref={heroRef} className="relative py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 vignette pointer-events-none" />

        <div className="relative px-4 sm:px-6 lg:px-[7vw]">
          <div className="hero-content text-center max-w-3xl mx-auto">
            <span className="font-mono text-[10px] sm:text-label text-gold uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4 block">
              Get in Touch
            </span>
            <h1 className="font-display text-[clamp(32px,6vw,56px)] text-ivory mb-4 sm:mb-6 leading-tight">
              Contact Us
            </h1>
            <p className="text-sm sm:text-body text-ivory-muted leading-relaxed px-4">
              Have questions about our spices, shipping, or wholesale orders?
              We'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="relative py-12 sm:py-16 lg:py-24">
        <div className="absolute inset-0 vignette pointer-events-none" />

        <div className="relative px-4 sm:px-6 lg:px-[7vw]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 sm:gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6 sm:space-y-8">
              <div>
                <h2 className="font-display text-xl sm:text-h3 text-ivory mb-3 sm:mb-4">
                  Let's Talk
                </h2>
                <p className="text-ivory-muted text-sm sm:text-base leading-relaxed mb-6 sm:mb-8">
                  Our team is based in Colombo, Sri Lanka. We typically
                  respond within 24 hours.
                </p>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {[
                  { icon: Mail, label: 'Email', value: 'hello@silonka.com' },
                  { icon: Phone, label: 'Phone', value: '+94 76 695 1393' },
                  { icon: MapPin, label: 'Office', value: 'Colombo, Sri Lanka' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                    </div>
                    <div>
                      <p className="font-mono text-[10px] sm:text-label text-ivory-muted uppercase mb-0.5 sm:mb-1">{item.label}</p>
                      <p className="text-ivory text-sm sm:text-base">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social */}
              <div>
                <p className="font-mono text-[10px] sm:text-label text-ivory-muted uppercase mb-3 sm:mb-4">Follow Us</p>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 sm:gap-3 text-ivory hover:text-gold transition-colors text-sm sm:text-base"
                >
                  <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
                  @silonka
                </a>
              </div>

              {/* Bulk Orders CTA */}
              <div className="pt-2">
                <p className="font-mono text-[10px] sm:text-label text-ivory-muted uppercase mb-3 sm:mb-4">Bulk Purchasing</p>
                <a
                  href="/bulk-order"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gold text-charcoal rounded-xl font-mono text-xs uppercase tracking-widest hover:bg-gold/90 transition-all duration-300 font-semibold shadow-lg shadow-gold/10 hover:shadow-gold/20 hover:-translate-y-0.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M16 16h6"/><path d="M19 13v6"/><path d="M12 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v4"/>
                  </svg>
                  Place Bulk Order
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="p-5 sm:p-8 lg:p-12 rounded-card bg-charcoal-card border border-white/5"
              >
                {isSubmitted ? (
                  <div className="text-center py-10 sm:py-12">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <Check className="w-6 h-6 sm:w-8 sm:h-8 text-gold" />
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl text-ivory mb-2">Message Sent!</h3>
                    <p className="text-ivory-muted text-sm sm:text-base">We'll get back to you within 24 hours.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                      <div>
                        <label className="block font-mono text-[10px] sm:text-label text-ivory-muted uppercase mb-2 sm:mb-3">
                          Your Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-lg bg-charcoal border border-white/10 text-ivory placeholder:text-ivory-muted/50 focus:outline-none focus:border-gold/50 transition-colors text-sm"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] sm:text-label text-ivory-muted uppercase mb-2 sm:mb-3">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-lg bg-charcoal border border-white/10 text-ivory placeholder:text-ivory-muted/50 focus:outline-none focus:border-gold/50 transition-colors text-sm"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="mb-4 sm:mb-6">
                      <label className="block font-mono text-[10px] sm:text-label text-ivory-muted uppercase mb-2 sm:mb-3">
                        Subject
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-lg bg-charcoal border border-white/10 text-ivory focus:outline-none focus:border-gold/50 transition-colors appearance-none text-sm"
                      >
                        <option value="">Select a subject</option>
                        <option value="order">Order Inquiry</option>
                        <option value="wholesale">Wholesale</option>
                        <option value="shipping">Shipping Question</option>
                        <option value="product">Product Question</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="mb-6 sm:mb-8">
                      <label className="block font-mono text-[10px] sm:text-label text-ivory-muted uppercase mb-2 sm:mb-3">
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-lg bg-charcoal border border-white/10 text-ivory placeholder:text-ivory-muted/50 focus:outline-none focus:border-gold/50 transition-colors resize-none text-sm"
                        placeholder="How can we help you?"
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-gold w-full flex items-center justify-center gap-2 sm:gap-3 text-sm"
                    >
                      Send Message
                      <Send className="w-4 h-4" />
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="relative py-16 sm:py-24 bg-charcoal-light">
        <div className="absolute inset-0 vignette pointer-events-none" />

        <div className="relative px-4 sm:px-6 lg:px-[7vw]">
          <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
            <span className="font-mono text-[10px] sm:text-label text-gold uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4 block">
              Common Questions
            </span>
            <h2 className="font-display text-[clamp(24px,4vw,40px)] text-ivory">
              Frequently Asked
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {[
              {
                q: 'How long does shipping take?',
                a: 'Europe: 3-5 business days. Rest of world: 7-10 business days.',
              },
              {
                q: 'What is your return policy?',
                a: "If you're not satisfied, contact us within 30 days for a full refund.",
              },
              {
                q: 'Are your spices organic?',
                a: 'Yes, all our partner farms are certified organic.',
              },
              {
                q: 'Do you offer wholesale?',
                a: 'Absolutely. Contact us for wholesale pricing and bulk orders.',
              },
            ].map((faq, index) => (
              <div key={index} className="p-5 sm:p-6 rounded-card bg-charcoal border border-white/5">
                <h3 className="font-display text-base sm:text-lg text-ivory mb-2 sm:mb-3">{faq.q}</h3>
                <p className="text-ivory-muted text-xs sm:text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
