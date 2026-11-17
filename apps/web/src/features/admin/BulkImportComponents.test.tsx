import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui';
import { AuthProvider } from '@/features/auth/AuthContext';
import { InvitationPreviewModal } from './InvitationPreviewModal';
import { BulkImportModal } from './BulkImportModal';
import { BulkImportPage } from './BulkImportPage';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>{ui}</BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('Bulk Onboarding & Import Component Suite', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('InvitationPreviewModal', () => {
    it('renders student invitation preview with branded template and security notice', () => {
      const onClose = vi.fn();
      renderWithProviders(
        <InvitationPreviewModal
          isOpen={true}
          onClose={onClose}
          defaultRole="STUDENTS"
          schoolName="Apex International Academy"
        />,
      );

      expect(screen.getByText('Email Invitation Preview')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Student Invitation/i })).toBeInTheDocument();
      expect(screen.getByText('STUDENT PORTAL ACCESS')).toBeInTheDocument();
      expect(screen.getByText('Activate Student Account & Set Password')).toBeInTheDocument();
      expect(screen.getByText(/Zero Default Passwords & Security Standards/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Apex International Academy/i).length).toBeGreaterThan(0);
    });

    it('switches preview role tabs to Faculty & Staff and Parent & Guardian', () => {
      const onClose = vi.fn();
      renderWithProviders(
        <InvitationPreviewModal
          isOpen={true}
          onClose={onClose}
          defaultRole="STUDENTS"
          schoolName="Apex International Academy"
        />,
      );

      // Switch to Staff & Faculty
      const staffTab = screen.getByRole('tab', { name: /Staff & Faculty/i });
      fireEvent.click(staffTab);

      expect(screen.getByText('TEACHER PORTAL ACCESS')).toBeInTheDocument();
      expect(screen.getByText('Accept Faculty Invitation & Set Password')).toBeInTheDocument();
      expect(screen.getByText('EMP-FAC-108')).toBeInTheDocument();

      // Switch to Parents & Guardians
      const parentTab = screen.getByRole('tab', { name: /Parent \/ Guardian/i });
      fireEvent.click(parentTab);

      expect(screen.getByText('PARENT PORTAL ACCESS')).toBeInTheDocument();
      expect(screen.getByText('Activate Parent Portal Access')).toBeInTheDocument();
      expect(screen.getByText(/Dev Sharma \(STU-2026-042\)/i)).toBeInTheDocument();
    });
  });

  describe('BulkImportModal', () => {
    it('renders upload drag-and-drop zone and template download options', () => {
      const onClose = vi.fn();
      renderWithProviders(
        <BulkImportModal
          isOpen={true}
          onClose={onClose}
          initialCategory="STUDENTS"
          schoolName="Apex Academy"
        />,
      );

      expect(screen.getByText('Bulk Import Students')).toBeInTheDocument();
      expect(screen.getByText(/Official Students Spreadsheet Template/i)).toBeInTheDocument();
      expect(screen.getByText('Download .CSV')).toBeInTheDocument();
      expect(screen.getByText('Download .XLSX')).toBeInTheDocument();
      expect(screen.getByText(/Click to select or drag and drop spreadsheet/i)).toBeInTheDocument();
    });
  });

  describe('BulkImportPage', () => {
    it('renders the bulk onboarding portal with KPI summary and category cards', () => {
      renderWithProviders(<BulkImportPage />);

      expect(screen.getByText('Institutional Bulk Onboarding')).toBeInTheDocument();
      expect(screen.getByText('Bulk Student Import')).toBeInTheDocument();
      expect(screen.getByText('Bulk Faculty & Staff Import')).toBeInTheDocument();
      expect(screen.getByText('Bulk Parent / Guardian Import')).toBeInTheDocument();
      expect(screen.getByText('Import Batches')).toBeInTheDocument();
    });
  });
});
