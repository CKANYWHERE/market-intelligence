import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">📊</div>
        <h2 className="text-white text-xl font-bold mb-2">Page not found</h2>
        <p className="text-gray-400 text-sm mb-6">
          The page you&apos;re looking for doesn&apos;t exist. Head back to the dashboard.
        </p>
        <Link
          href="/"
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors inline-block"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
