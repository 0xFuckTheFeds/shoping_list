'use client';

import { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { loginAdmin } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await loginAdmin(email, password);
      if (success) {
        onClose();
      } else {
        setError('Invalid email or password');
      }
    } catch (error) {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-dashGreen-dark p-6 rounded-lg w-full max-w-md border border-dashYellow/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-dashYellow flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Admin Login
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-200 p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-dashYellow-light text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className="w-full px-4 py-2 rounded-md bg-dashGreen-darkest border border-dashGreen-light focus:border-dashYellow focus:outline-none"
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-dashYellow-light text-sm font-bold mb-2" htmlFor="password">
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
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}