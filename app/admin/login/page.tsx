'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid email or password');
      } else {
        router.push('/research');
      }
    } catch (error) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dashGreen-darkest">
      <div className="w-full max-w-md">
        <div className="bg-dashGreen-dark shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4 border border-dashYellow/20">
          <h1 className="text-2xl font-bold text-dashYellow mb-6 text-center">Admin Login</h1>
          
          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-200 p-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-500 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                className="w-full px-4 py-2 rounded-md bg-dashGreen-darkest border border-dashGreen-light focus:border-dashYellow focus:outline-none"
                id="email"
                type="email"
                placeholder="input your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block test-gray-500 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <input
                className="w-full px-4 py-2 rounded-md bg-dashGreen-darkest border border-dashGreen-light focus:border-dashYellow focus:outline-none"
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-center">
              <button
                className="bg-dashYellow hover:bg-dashYellow-dark text-dashGreen-darkest font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition-colors"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}