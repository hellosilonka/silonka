import { errorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '@/lib/api';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { setUser } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userData = await login(email, password);
            if (userData.isAdmin) {
                setUser(userData);
                navigate('/admin');
            } else {
                setError('Access denied. Admin privileges required.');
            }
        } catch (err) {
            setError(errorMessage(err, 'Login failed'));
        }
    };

    return (
        <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
            <div className="absolute inset-0 noise-overlay pointer-events-none" />
            <div className="max-w-md w-full bg-charcoal-card border border-white/5 rounded-card p-10 shadow-2xl z-10">
                <div className="text-center mb-10">
                    <h1 className="font-display text-4xl text-gold mb-2">Silonka Portal</h1>
                    <p className="font-mono text-label text-ivory-muted uppercase tracking-widest">Admin Access Only</p>
                </div>

                {error && <div className="bg-red-500/10 text-red-500 p-4 rounded mb-6 text-center font-mono text-sm border border-red-500/20">{error}</div>}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block font-mono text-label text-ivory-muted uppercase mb-3 tracking-wider">Admin Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-4 rounded-lg bg-charcoal-light border border-white/10 text-ivory focus:border-gold outline-none transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-mono text-label text-ivory-muted uppercase mb-3 tracking-wider">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 rounded-lg bg-charcoal-light border border-white/10 text-ivory focus:border-gold outline-none transition-colors"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-5 bg-gold text-charcoal font-mono text-label uppercase tracking-widest hover:bg-gold-light transition-colors mt-8 rounded-lg shadow-lg"
                    >
                        Authenticate
                    </button>
                </form>
            </div>
        </div>
    );
}
