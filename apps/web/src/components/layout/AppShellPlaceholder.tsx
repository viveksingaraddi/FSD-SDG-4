/**
 * Minimal application shell — Phase 4 placeholder only.
 * Demonstrates:
 * - Semantic HTML structure (header, main, footer)
 * - Phase 3 design token colors applied via utility classes
 * - WCAG: single <h1>, landmark regions, skip-link target (#main-content)
 */

import type { JSX } from 'react';

export function AppShellPlaceholder(): JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Global Header */}
      <header
        className="h-16 bg-blue-700 text-white flex items-center px-6 shadow-md"
        role="banner"
      >
        <span className="font-semibold text-lg tracking-tight">
          FSD-SDG-4 | Quality Education Platform
        </span>
        <span className="ml-auto text-sm text-blue-200 font-mono">Phase 4 — Foundation</span>
      </header>

      {/* Main Content */}
      <main
        id="main-content"
        className="flex-1 flex flex-col items-center justify-center p-8"
        tabIndex={-1}
      >
        <div className="max-w-lg w-full text-center space-y-6">
          {/* SDG 4 Brand Accent */}
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
            <span aria-hidden="true">🎯</span>
            <span>Aligned with UN SDG 4 — Quality Education</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-900">Repository scaffold ready</h1>

          <p className="text-slate-600 text-base leading-relaxed">
            Phase 4 scaffolding is complete. The monorepo structure, TypeScript configuration,
            shared packages, and development tooling are established.
          </p>

          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-3 text-left mt-8">
            {[
              { label: 'Frontend', value: 'React + Vite', status: 'ready' },
              { label: 'Backend', value: 'Express + Pino', status: 'ready' },
              { label: 'Shared Packages', value: '4 packages', status: 'ready' },
              { label: 'Next Phase', value: 'Phase 5 — DB Schema', status: 'pending' },
            ].map(({ label, value, status }) => (
              <div
                key={label}
                className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm"
              >
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {label}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
                <span
                  className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                    status === 'ready'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {status === 'ready' ? '✓ Ready' : '⏳ Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200">
        FSD-SDG-4 Quality Education SaaS — Phase 4 Foundation &nbsp;|&nbsp;
        <span className="font-mono">v0.0.0-dev</span>
      </footer>
    </div>
  );
}
