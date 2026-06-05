import { useState } from 'react';

export default function Login() {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState(null);
    const [loading, setLoading]   = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || 'Login failed');
                return;
            }
            localStorage.setItem('admin_token', data.token);
            localStorage.setItem('admin_user', JSON.stringify(data.user));
            window.location.href = '/admin-panel';
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0e17' }}>
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-cyan-400 uppercase tracking-widest">
                        Vessel Operations
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Admin Panel</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-xl p-8 flex flex-col gap-5">
                    <h2 className="text-white font-bold text-lg uppercase tracking-widest text-center">Sign In</h2>

                    {error && (
                        <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-2 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <label className="flex flex-col gap-1.5">
                        <span className="text-slate-400 text-xs uppercase tracking-wider">Email</span>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoFocus
                            className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                        />
                    </label>

                    <label className="flex flex-col gap-1.5">
                        <span className="text-slate-400 text-xs uppercase tracking-wider">Password</span>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg uppercase tracking-widest transition-colors mt-2"
                    >
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
