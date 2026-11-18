import { errorMessage } from '@/lib/api';
import { useState } from 'react';
import { X } from 'lucide-react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { login, googleLogin, register } from '@/lib/api';
import { useAuth, type UserInfo } from '@/context/AuthContext';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (userData: UserInfo) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const { setUser } = useAuth();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            let userData;
            if (isLogin) {
                userData = await login(email, password);
            } else {
                userData = await register(name, email, password);
            }
            onSuccess(userData);
            setUser(userData);
            onClose();
        } catch (err) {
            setError(errorMessage(err, 'Authentication failed'));
        }
    };

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) return;
        try {
            const userData = await googleLogin(credentialResponse.credential);
            onSuccess(userData);
            setUser(userData);
            onClose();
        } catch (err) {
            setError(errorMessage(err, 'Google Auth failed'));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-charcoal-card border border-white/10 rounded-card w-full max-w-md p-8 relative shadow-2xl">
                <button onClick={onClose} className="absolute right-6 top-6 text-ivory-muted hover:text-ivory transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <h2 className="font-display text-3xl text-ivory mb-6 text-center">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded mb-4 text-center font-mono text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                    {!isLogin && (
                        <div>
                            <label className="block font-mono text-label text-ivory-muted uppercase mb-2">Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-3 rounded bg-charcoal border border-white/10 text-ivory focus:border-gold outline-none transition-colors" />
                        </div>
                    )}
                    <div>
                        <label className="block font-mono text-label text-ivory-muted uppercase mb-2">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded bg-charcoal border border-white/10 text-ivory focus:border-gold outline-none transition-colors" />
                    </div>
                    <div>
                        <label className="block font-mono text-label text-ivory-muted uppercase mb-2">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-3 rounded bg-charcoal border border-white/10 text-ivory focus:border-gold outline-none transition-colors" />
                    </div>
                    <button type="submit" className="w-full py-3 bg-gold text-charcoal font-mono uppercase tracking-widest rounded hover:bg-gold-light transition-colors mt-2">
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <div className="relative flex items-center justify-center mb-6">
                    <div className="border-t border-white/10 w-full absolute" />
                    <span className="bg-charcoal-card px-4 text-ivory-muted font-mono text-[10px] uppercase relative z-10">Or continue with</span>
                </div>

                <div className="flex justify-center mb-6">
                    {import.meta.env.VITE_GOOGLE_CLIENT_ID && <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Login Failed')}
                        theme="filled_black"
                        shape="rectangular"
                    />}
                </div>

                <p className="text-center text-ivory-muted font-mono text-xs">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={() => setIsLogin(!isLogin)} type="button" className="text-gold hover:underline">
                        {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
    );
}
