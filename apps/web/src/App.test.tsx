import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';

function renderWithProviders(initialPath: string = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 0 }, mutations: { retry: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('App — shared frontend foundation', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            type: 'https://httpstatuses.com/401',
            title: 'Unauthorized',
            status: 401,
            detail: 'Not authenticated',
          }),
          { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the skip-to-main-content link as first focusable element', () => {
    renderWithProviders('/login');
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink.tagName).toBe('A');
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('redirects unauthenticated root requests to the login page', async () => {
    renderWithProviders('/');
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: /sign in to fsd-sdg-4/i }),
      ).toBeInTheDocument();
    });
  });

  it('renders the 404 page for an unknown route', () => {
    renderWithProviders('/this-route-does-not-exist');
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });
});
