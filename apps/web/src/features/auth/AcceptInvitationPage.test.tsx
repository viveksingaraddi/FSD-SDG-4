import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '@/components/ui';
import { AcceptInvitationPage } from './AcceptInvitationPage';

function renderWithRouter(initialEntry = '/accept-invitation?token=valid-token-123') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ToastProvider>
        <Routes>
          <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('AcceptInvitationPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders invalid link error when no token is present', async () => {
    renderWithRouter('/accept-invitation');
    expect(await screen.findByText(/Invalid Invitation Link/i)).toBeInTheDocument();
    expect(screen.getByText(/No invitation token was provided/i)).toBeInTheDocument();
  });

  it('displays expired invitation state when token is expired', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              valid: false,
              reason: 'EXPIRED',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    renderWithRouter('/accept-invitation?token=expired-token-123');
    expect(await screen.findByText(/Invitation Has Expired/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to Sign In/i })).toBeInTheDocument();
  });

  it('displays revoked invitation state when token is revoked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              valid: false,
              reason: 'REVOKED',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    renderWithRouter('/accept-invitation?token=revoked-token-123');
    expect(await screen.findByText(/Invitation Revoked/i)).toBeInTheDocument();
  });

  it('displays already accepted state when invitation has been redeemed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              valid: false,
              reason: 'ACCEPTED',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    renderWithRouter('/accept-invitation?token=accepted-token-123');
    expect(await screen.findByText(/Account Already Activated/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Proceed to Sign In/i })).toBeInTheDocument();
  });

  it('renders password setup form for valid token, validates criteria, and activates account', async () => {
    const fetchMock = vi.fn((input: string | URL, init?: Parameters<typeof fetch>[1]) => {
      const url = String(input);
      if (url.includes('/api/v1/auth/invitations/verify')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                valid: true,
                email: 'invited.teacher@school.edu',
                role: 'TEACHER',
                schoolName: 'Horizon Academy',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      if (url.includes('/api/v1/auth/invitations/accept') && init?.method === 'POST') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                success: true,
                email: 'invited.teacher@school.edu',
                role: 'TEACHER',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    vi.stubGlobal('fetch', fetchMock);

    renderWithRouter('/accept-invitation?token=valid-token-123');

    // Verify metadata displayed
    expect(await screen.findByText('Horizon Academy')).toBeInTheDocument();
    expect(screen.getByText('invited.teacher@school.edu')).toBeInTheDocument();
    expect(screen.getByText(/Teacher \/ Faculty Member/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Activate Account & Set Password/i });
    expect(submitBtn).toBeDisabled();

    // Type weak password
    const passwordInput = screen.getByPlaceholderText(/Enter minimum 12 characters/i);
    const confirmInput = screen.getByPlaceholderText(/Re-enter your password/i);

    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.change(confirmInput, { target: { value: 'short' } });
    expect(submitBtn).toBeDisabled();

    // Type compliant password
    fireEvent.change(passwordInput, { target: { value: 'SuperSecret123!' } });
    fireEvent.change(confirmInput, { target: { value: 'SuperSecret123!' } });

    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled();
    });

    fireEvent.click(submitBtn);

    // Verify celebration screen
    expect(await screen.findByText(/Account Successfully Activated!/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In to Platform/i })).toBeInTheDocument();
  });
});
