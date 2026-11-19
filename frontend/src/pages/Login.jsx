import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError('');
    setInfo('Google sign-in is ready to connect. Add your Google OAuth Client ID to enable it.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
      <div className="card w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <img
            src="/boi-ghor-logo.png"
            alt="BOI GHOR"
            className="w-16 h-16 rounded-2xl object-cover mb-3 shadow-md ring-1 ring-slate-200"
          />
          <h1 className="text-xl font-bold text-gray-800">BOI GHOR</h1>
          <p className="text-sm text-gray-500">Sign in to your digital library</p>
        </div>

        {error && <p className="notice-error">{error}</p>}
        {info && <p className="notice-success"><ShieldCheck size={16} />{info}</p>}

        <button type="button" onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-brand-300 hover:bg-brand-50">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M21.35 12.18c0-.72-.06-1.25-.2-1.8H12v3.42h5.37c-.11.85-.7 2.13-2 2.99l-.02.11 2.91 2.25.2.02c1.84-1.7 2.89-4.2 2.89-7.0Z"/><path fill="#34A853" d="M12 21.68c2.63 0 4.84-.87 6.45-2.37l-3.07-2.38c-.82.57-1.91.97-3.38.97a5.86 5.86 0 0 1-5.53-4.05l-.1.01-3.03 2.34-.03.1A9.75 9.75 0 0 0 12 21.68Z"/><path fill="#FBBC05" d="M6.47 13.85A5.9 5.9 0 0 1 6.16 12c0-.64.11-1.26.3-1.85v-.12L3.4 7.66l-.1.05A9.72 9.72 0 0 0 2.25 12c0 1.56.37 3.03 1.05 4.29l3.17-2.44Z"/><path fill="#EA4335" d="M12 6.1c1.85 0 3.1.8 3.82 1.47l2.79-2.72C16.83 3.2 14.63 2.25 12 2.25A9.75 9.75 0 0 0 3.3 7.7l3.16 2.45A5.88 5.88 0 0 1 12 6.1Z"/></svg>
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs font-medium text-gray-400"><span className="h-px flex-1 bg-gray-200" />OR<span className="h-px flex-1 bg-gray-200" /></div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="••••••••"
            />
          </div>
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-brand-600 hover:underline">Forgot password?</Link>
          </div>
          <button disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Don't have an account? <Link to="/register" className="text-brand-600 font-medium hover:underline">Register</Link>
        </p>
        <div className="text-center mt-3 pt-3 border-t border-gray-100">
          <Link to="/admin-login" className="text-xs font-medium text-gray-600 hover:text-brand-600">Administrator Login →</Link>
        </div>
        <p className="mt-5 text-center text-xs leading-relaxed text-gray-500">By continuing, you agree to our <Link to="/terms" className="font-medium text-brand-600 hover:underline">Terms of Service</Link> and acknowledge our <Link to="/privacy" className="font-medium text-brand-600 hover:underline">Privacy Policy</Link>.</p>
      </div>
    </div>
  );
}
