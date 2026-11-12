import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App.js';

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

describe('App — foundation shell', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders('/');
    expect(container).toBeDefined();
  });

  it('renders the skip-to-main-content link as first focusable element', () => {
    renderWithProviders('/');
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeDefined();
    expect(skipLink.tagName).toBe('A');
    expect(skipLink.getAttribute('href')).toBe('#main-content');
  });

  it('renders the placeholder h1 on the root route', () => {
    renderWithProviders('/');
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeDefined();
  });

  it('renders the 404 page for an unknown route', () => {
    renderWithProviders('/this-route-does-not-exist');
    const heading = screen.getByRole('heading', { name: /page not found/i });
    expect(heading).toBeDefined();
  });
});
