import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { api } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const data = await api.post('/auth/forgot-password', { email });
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
      <div className="card w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white mb-3">
            <KeyRound size={22} />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Reset your password</h1>
        </div>

        {message && <p className="bg-emerald-50 text-emerald-700 text-sm rounded-lg px-3 py-2 mb-4">{message}</p>}
        {error && <p className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your account email"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button className="btn-primary w-full py-2.5">Send Reset Instructions</button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          <Link to="/login" className="text-brand-600 font-medium hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
