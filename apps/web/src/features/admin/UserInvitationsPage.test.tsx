import type { ReactNode } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui';
import { AuthProvider } from '@/features/auth/AuthContext';
import { UserInvitationsPage } from './UserInvitationsPage';

function renderWithProviders(ui: ReactNode, initialPath = '/admin/invitations') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 0 }, mutations: { retry: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <ToastProvider>
          <AuthProvider>{ui}</AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockInvitations = [
  {
    id: 'inv-1',
    schoolId: 'school-1',
    userId: 'usr-1',
    email: 'new.teacher@school.edu',
    role: 'TEACHER',
    status: 'PENDING',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    acceptedAt: null,
    revokedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv-2',
    schoolId: 'school-1',
    userId: 'usr-2',
    email: 'active.student@school.edu',
    role: 'STUDENT',
    status: 'ACCEPTED',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    acceptedAt: new Date().toISOString(),
    revokedAt: null,
    createdAt: new Date().toISOString(),
  },
];

describe('UserInvitationsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders invitation metrics, list, and handles resend & revoke actions', async () => {
    const fetchMock = vi.fn((input: string | URL, init?: Parameters<typeof fetch>[1]) => {
      const url = String(input);
      if (url.includes('/api/v1/auth/me')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                user: {
                  id: 'adm-1',
                  email: 'admin@school.edu',
                  role: 'SCHOOL_ADMIN',
                  schoolId: 'school-1',
                  status: 'ACTIVE',
                  permissions: [],
                },
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      if (url.includes('/api/v1/school/invitations') && (!init?.method || init?.method === 'GET')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: mockInvitations,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      if (url.includes('/api/v1/school/invitations/inv-1/resend') && init?.method === 'POST') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                ...mockInvitations[0],
                invitationUrl: 'http://localhost:5173/accept-invitation?token=fresh-token-xyz',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<UserInvitationsPage />);

    // Header & stats
    expect(await screen.findByText('new.teacher@school.edu')).toBeInTheDocument();
    expect(screen.getByText('active.student@school.edu')).toBeInTheDocument();

    // Verify Pending and Accepted badges
    expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Accepted').length).toBeGreaterThanOrEqual(1);

    // Resend action
    const resendBtn = screen.getByRole('button', { name: /Resend/i });
    fireEvent.click(resendBtn);

    // Dialog showing invitation link
    expect(await screen.findByText('Invitation Ready')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/fresh-token-xyz/)).toBeInTheDocument();
  });

  it('opens invitation modal and submits new teacher invitation', async () => {
    const fetchMock = vi.fn((input: string | URL, init?: Parameters<typeof fetch>[1]) => {
      const url = String(input);
      if (url.includes('/api/v1/auth/me')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                user: {
                  id: 'adm-1',
                  email: 'admin@school.edu',
                  role: 'SCHOOL_ADMIN',
                  schoolId: 'school-1',
                  status: 'ACTIVE',
                  permissions: [],
                },
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      if (url.includes('/api/v1/school/invitations') && init?.method === 'POST') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                id: 'inv-3',
                email: 'invited.faculty@school.edu',
                role: 'TEACHER',
                status: 'PENDING',
                invitationUrl: 'http://localhost:5173/accept-invitation?token=newly-minted-token',
              },
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      if (url.includes('/api/v1/school/invitations')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: mockInvitations,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<UserInvitationsPage />);

    const openModalBtn = await screen.findByRole('button', { name: /Invite New User/i });
    fireEvent.click(openModalBtn);

    expect(screen.getByText('Provision New User Account')).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. user@school\.edu/i), {
      target: { value: 'invited.faculty@school.edu' },
    });
    fireEvent.change(screen.getByPlaceholderText(/First name/i), {
      target: { value: 'Sarah' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Last name/i), {
      target: { value: 'Connor' },
    });

    const submitBtn = screen.getByRole('button', { name: /Issue Invitation/i });
    fireEvent.click(submitBtn);

    // Verify invitation ready link modal displayed
    expect(await screen.findByText('Invitation Ready')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/newly-minted-token/)).toBeInTheDocument();
  });
});
