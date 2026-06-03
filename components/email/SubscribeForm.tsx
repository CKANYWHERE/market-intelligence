'use client';

import { useState } from 'react';

export default function SubscribeForm() {
  const [email,   setEmail]   = useState('');
  const [status,  setStatus]  = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        setMessage('You\'re in! Expect your first digest next Monday.');
        setEmail('');
      } else {
        throw new Error('Failed');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm">
        <span>✓</span>
        <span>{message}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-48"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
      >
        {status === 'loading' ? '...' : 'Get Weekly Digest'}
      </button>
      {status === 'error' && (
        <span className="text-red-400 text-xs">{message}</span>
      )}
    </form>
  );
}
