import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Types & Constants ───────────────────────────
export type CookiePreferences = {
  essential: boolean;   // always true, can't be disabled
  analytics: boolean;
  marketing: boolean;
};

const CONSENT_KEY = 'silonka_cookie_consent';
const PREFS_KEY = 'silonka_cookie_prefs';

// ─── Context ─────────────────────────────────────
// Allows any component to read cookie preferences and re-open the settings panel
type CookieContextType = {
  preferences: CookiePreferences;
  hasConsented: boolean;
  openSettings: () => void;
};

const CookieContext = createContext<CookieContextType>({
  preferences: { essential: true, analytics: false, marketing: false },
  hasConsented: false,
  openSettings: () => {},
});

export function useCookieConsent() {
  return useContext(CookieContext);
}

// ─── Helpers ─────────────────────────────────────
function getSavedConsent(): 'accepted' | 'declined' | null {
  try {
    return localStorage.getItem(CONSENT_KEY) as any;
  } catch {
    return null;
  }
}

function getSavedPrefs(): CookiePreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { essential: true, analytics: false, marketing: false };
}

export function getCookiePreferences(): CookiePreferences {
  const consent = getSavedConsent();
  if (consent === 'accepted') return getSavedPrefs();
  return { essential: true, analytics: false, marketing: false };
}

// ─── Cookie enforcement ──────────────────────────
// Removes all non-essential browser cookies when user declines or customizes
function clearNonEssentialCookies(prefs: CookiePreferences) {
  // List of cookies we consider "essential" (never removed)
  const essentialCookies = ['jwt']; // auth token

  if (!prefs.analytics && !prefs.marketing) {
    // Remove all cookies except essential ones
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const name = cookie.split('=')[0].trim();
      if (name && !essentialCookies.includes(name)) {
        // Delete the cookie by setting it to expire in the past
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      }
    }
  }
}

// Injects or removes analytics/marketing script tags based on consent
function enforceScriptConsent(prefs: CookiePreferences) {
  // ── Analytics (e.g. Google Analytics) ──
  // If you add GA later, gate it behind this check:
  //   if (prefs.analytics) { loadGoogleAnalytics(); }
  //   else { removeGoogleAnalytics(); }

  if (!prefs.analytics) {
    // Remove any GA-like scripts/cookies that may already be loaded
    document.querySelectorAll('script[src*="google-analytics"], script[src*="googletagmanager"]').forEach(el => el.remove());
    // Clear GA cookies
    ['_ga', '_gid', '_gat'].forEach(name => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    });
  }

  if (!prefs.marketing) {
    // Remove any Facebook pixel, ad scripts, etc.
    document.querySelectorAll('script[src*="facebook"], script[src*="fbevents"]').forEach(el => el.remove());
    ['_fbp', '_fbc'].forEach(name => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    });
  }
}

// ─── Provider + Banner Component ─────────────────
export default function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    essential: true,
    analytics: true,
    marketing: false,
  });
  const [animateIn, setAnimateIn] = useState(false);

  const [currentPrefs, setCurrentPrefs] = useState<CookiePreferences>(getCookiePreferences);
  const [hasConsented, setHasConsented] = useState(() => getSavedConsent() !== null);

  // Show banner on first visit (no consent stored)
  useEffect(() => {
    const consent = getSavedConsent();
    if (!consent) {
      const timer = setTimeout(() => {
        setVisible(true);
        requestAnimationFrame(() => setAnimateIn(true));
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      // Enforce saved preferences on load
      const saved = getSavedPrefs();
      enforceScriptConsent(saved);
      clearNonEssentialCookies(saved);
    }
  }, []);

  const openSettings = useCallback(() => {
    // Load existing prefs into the form when re-opening
    const saved = getSavedPrefs();
    setPrefs(saved);
    setShowDetails(true);
    setVisible(true);
    requestAnimationFrame(() => setAnimateIn(true));
  }, []);

  const applyPreferences = (newPrefs: CookiePreferences, consentType: 'accepted' | 'declined') => {
    localStorage.setItem(CONSENT_KEY, consentType);
    localStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
    setCurrentPrefs(newPrefs);
    setHasConsented(true);

    // Enforce immediately
    enforceScriptConsent(newPrefs);
    clearNonEssentialCookies(newPrefs);

    close();
  };

  const handleAcceptAll = () => {
    applyPreferences({ essential: true, analytics: true, marketing: true }, 'accepted');
  };

  const handleSavePreferences = () => {
    applyPreferences(prefs, 'accepted');
  };

  const handleDecline = () => {
    applyPreferences({ essential: true, analytics: false, marketing: false }, 'declined');
  };

  const close = () => {
    setAnimateIn(false);
    setTimeout(() => {
      setVisible(false);
      setShowDetails(false);
    }, 400);
  };

  return (
    <CookieContext.Provider value={{ preferences: currentPrefs, hasConsented, openSettings }}>
      {children}

      {/* Cookie Consent Banner */}
      {visible && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-[9998] px-4 pb-4 sm:px-6 sm:pb-6 transition-all duration-500 ease-out ${
            animateIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div
            className="max-w-3xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60"
            style={{ background: 'rgba(17, 17, 20, 0.97)', backdropFilter: 'blur(24px)' }}
          >
            {/* Main Banner */}
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gold/15 border border-gold/25 flex items-center justify-center mt-0.5">
                  <Cookie className="w-5 h-5 text-gold" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base sm:text-lg text-ivory mb-1.5">
                    We value your privacy
                  </h3>
                  <p className="text-ivory-muted text-xs sm:text-sm leading-relaxed">
                    We use cookies to enhance your browsing experience, serve personalised content, and analyse our traffic. By clicking "Accept All", you consent to our use of cookies. Read our{' '}
                    <Link to="/privacy-policy" className="text-gold hover:text-gold-light underline underline-offset-2 transition-colors">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>

                <button
                  onClick={handleDecline}
                  className="flex-shrink-0 p-1.5 rounded-lg text-ivory-muted/40 hover:text-ivory-muted hover:bg-white/5 transition-colors"
                  aria-label="Close cookie banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-5 ml-0 sm:ml-14">
                <button
                  onClick={handleAcceptAll}
                  className="px-6 py-2.5 rounded-xl bg-gold text-charcoal font-mono text-[10px] sm:text-xs uppercase tracking-widest hover:bg-gold-light transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/20"
                >
                  Accept All
                </button>
                <button
                  onClick={handleDecline}
                  className="px-6 py-2.5 rounded-xl border border-white/15 text-ivory-muted font-mono text-[10px] sm:text-xs uppercase tracking-widest hover:border-gold/40 hover:text-ivory transition-all"
                >
                  Decline
                </button>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-ivory-muted/60 font-mono text-[10px] sm:text-xs uppercase tracking-widest hover:text-ivory-muted transition-colors"
                >
                  Customize
                  {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Expandable Cookie Settings */}
            <div
              className={`overflow-hidden transition-all duration-400 ease-in-out ${
                showDetails ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-1 border-t border-white/5">
                <div className="space-y-3 mt-4">
                  <CookieToggle
                    label="Essential Cookies"
                    description="Required for login, cart, and checkout to function. These cannot be disabled."
                    checked={true}
                    disabled={true}
                    onChange={() => {}}
                  />
                  <CookieToggle
                    label="Analytics Cookies"
                    description="Help us understand how visitors interact with our website to improve user experience."
                    checked={prefs.analytics}
                    onChange={(v) => setPrefs({ ...prefs, analytics: v })}
                  />
                  <CookieToggle
                    label="Marketing Cookies"
                    description="Used to deliver personalised advertisements and measure campaign effectiveness."
                    checked={prefs.marketing}
                    onChange={(v) => setPrefs({ ...prefs, marketing: v })}
                  />
                </div>

                <button
                  onClick={handleSavePreferences}
                  className="mt-5 w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gold text-charcoal font-mono text-[10px] sm:text-xs uppercase tracking-widest hover:bg-gold-light transition-all"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CookieContext.Provider>
  );
}

function CookieToggle({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
      <div className="flex-1 min-w-0">
        <p className="text-ivory text-sm font-medium">{label}</p>
        <p className="text-ivory-muted/60 text-xs mt-0.5 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`flex-shrink-0 relative w-11 h-6 rounded-full transition-all duration-300 ${
          checked ? 'bg-gold/90' : 'bg-white/10'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
