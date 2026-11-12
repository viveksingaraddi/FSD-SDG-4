/**
 * Application shell — routes and layout wrapper.
 * Phase 4: Minimal shell only. Role-based routing implemented in Phase 13.
 */

import type { JSX } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/feedback/ErrorBoundary.js';
import { AppShellPlaceholder } from './components/layout/AppShellPlaceholder.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

export function App(): JSX.Element {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<AppShellPlaceholder />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </>
  );
}
