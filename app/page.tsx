
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function Home() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (data: { phone: string; password: string }) => {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }
      return result;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      router.push('/dashboard');
    },
    onError: (error) => {
      const message =
        (typeof error === 'object' && error?.message) ||
        (typeof error === 'string' && error) ||
        (error && error.toString && error.toString()) ||
        'An error occurred';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Phone must be exactly 9 digits
    if (!/^\d{9}$/.test(phone)) {
      toast.error('Phone must be exactly 9 digits');
      return;
    }
    // Password must be at least 6 characters
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    mutation.mutate({ phone, password });
  };

  return (
    <div className="min-h-screen bg-green-100 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl mb-4 text-center">Login</h2>
        <input
          type="tel"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

