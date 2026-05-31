'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app/error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-white text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-gray-400 text-sm mb-6">
          Failed to load market data. This is usually temporary — please try again.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
