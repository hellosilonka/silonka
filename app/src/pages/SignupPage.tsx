import { errorMessage } from '@/lib/api';
import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { register, googleLogin } from '@/lib/api';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';
import SEOHead from '@/components/SEOHead';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const requested = params.get('redirect');
    const redirect = requested && requested.startsWith('/') && !requested.startsWith('//') && !requested.includes('\\') ? requested : '/';
    const { setUser } = useAuth();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }
        setLoading(true);
        setError('');
        try {
            const userData = await register(name, email, password);
            setUser(userData);
            navigate(redirect);
        } catch (err) {
            setError(errorMessage(err, 'Registration failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) return;
        setLoading(true);
        setError('');
        try {
            const userData = await googleLogin(credentialResponse.credential);
            setUser(userData);
            navigate(redirect);
        } catch (err) {
            setError(errorMessage(err, 'Google Sign Up failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-charcoal pt-32 pb-16 flex items-center justify-center px-4">
            <SEOHead
                title="Create Account — Silonka"
                description="Create your free Silonka account to shop premium Ceylon spices, track your orders, and enjoy a personalized experience."
                canonicalPath="/signup"
                noIndex
            />
            <div className="max-w-md w-full bg-charcoal-card border border-white/5 rounded-card p-8 shadow-xl">
                <h1 className="font-display text-3xl text-ivory text-center mb-8">Create Account</h1>
                {error && <div className="bg-red-500/10 text-red-500 p-3 rounded mb-4 text-center font-mono text-sm">{error}</div>}
                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block font-mono text-label text-ivory-muted uppercase mb-2">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded bg-charcoal border border-white/10 text-ivory focus:border-gold/50 outline-none transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-mono text-label text-ivory-muted uppercase mb-2">Email</label>
                        <input
                            type="email" aria-label="Email" autoComplete="email" maxLength={254}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded bg-charcoal border border-white/10 text-ivory focus:border-gold/50 outline-none transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-mono text-label text-ivory-muted uppercase mb-2">Password</label>
                        <input
                            type="password" aria-label="Password" autoComplete="new-password" minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded bg-charcoal border border-white/10 text-ivory focus:border-gold/50 outline-none transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-mono text-label text-ivory-muted uppercase mb-2">Confirm Password</label>
                        <input
                            type="password" aria-label="Password" autoComplete="new-password" minLength={8}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded bg-charcoal border border-white/10 text-ivory focus:border-gold/50 outline-none transition-colors"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gold text-charcoal font-mono text-label uppercase hover:bg-gold-light transition-colors mt-8 rounded disabled:opacity-50"
                    >
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </button>
                </form>

                {import.meta.env.VITE_GOOGLE_CLIENT_ID && <><div className="mt-6 flex items-center justify-between">
                    <span className="border-b border-white/10 w-1/5 lg:w-1/4"></span>
                    <span className="text-xs text-center text-ivory-muted font-mono uppercase">or sign up with</span>
                    <span className="border-b border-white/10 w-1/5 lg:w-1/4"></span>
                </div>

                <div className="mt-6 flex justify-center">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Sign Up failed')}
                        theme="filled_black"
                        shape="rectangular"
                        text="signup_with"
                    />
                </div></>}

                <p className="mt-8 text-center text-sm font-mono text-ivory-muted">
                    Already have an account?{' '}
                    <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-gold hover:underline">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}
