import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(name, email, password);
      navigate('/boards');
    } catch (err) {
      const message = err.response?.data?.error || 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink mb-1 text-center">DevFlow</h1>
        <p className="font-body text-charcoal text-center mb-8">Create your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-xs text-charcoal mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-charcoal/20 rounded-lg bg-white font-body text-ink focus:outline-none focus:ring-2 focus:ring-rust"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-charcoal mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-charcoal/20 rounded-lg bg-white font-body text-ink focus:outline-none focus:ring-2 focus:ring-rust"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-charcoal mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-charcoal/20 rounded-lg bg-white font-body text-ink focus:outline-none focus:ring-2 focus:ring-rust"
              placeholder="At least 6 characters"
            />
          </div>

          {error && (
            <p className="text-sm text-rust-dark font-body">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-rust text-paper rounded-lg font-body font-medium hover:bg-rust-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="text-center text-sm text-charcoal mt-6 font-body">
          Already have an account?{' '}
          <Link to="/login" className="text-rust hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
