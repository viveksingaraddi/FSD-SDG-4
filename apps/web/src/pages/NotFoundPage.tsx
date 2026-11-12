/**
 * 404 Not Found page — Phase 4 foundation.
 * WCAG: Clear explanation, no technical jargon, keyboard-accessible back link.
 */

import type { JSX } from 'react';
import { Link } from 'react-router-dom';

export function NotFoundPage(): JSX.Element {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-slate-50 flex items-center justify-center p-8"
      tabIndex={-1}
    >
      <div className="text-center max-w-md space-y-4">
        <p className="text-6xl font-bold text-blue-700" aria-hidden="true">
          404
        </p>
        <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
        <p className="text-slate-600">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block mt-4 px-6 py-3 bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </main>
  );
}
