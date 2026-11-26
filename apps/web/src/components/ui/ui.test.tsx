import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  PasswordInput,
  SearchInput,
  ToastProvider,
  useToast,
} from './index';

function ToastTrigger() {
  const { showToast } = useToast();
  return (
    <Button
      onClick={() =>
        showToast({
          title: 'Saved changes',
          description: 'Academic settings updated.',
          variant: 'success',
        })
      }
    >
      Trigger toast
    </Button>
  );
}

describe('Shared UI component library', () => {
  it('renders Button loading state with aria-busy and disabled attribute', () => {
    render(<Button loading>Submitting</Button>);
    const button = screen.getByRole('button', { name: /submitting/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('wires FormField aria-invalid and aria-describedby when error is present', () => {
    render(
      <FormField label="Email address" error="Email is required" hint="Use institutional email">
        {(controlProps) => <Input {...controlProps} hasError />}
      </FormField>,
    );

    const input = screen.getByLabelText('Email address');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const describedBy = input.getAttribute('aria-describedby') ?? '';
    expect(describedBy).toContain('-hint');
    expect(describedBy).toContain('-error');
    expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
  });

  it('toggles PasswordInput visibility with accessible button state', () => {
    render(
      <FormField label="Password">
        {(controlProps) => <PasswordInput {...controlProps} />}
      </FormField>,
    );

    const input = screen.getByLabelText('Password') as HTMLInputElement;
    expect(input.type).toBe('password');

    const toggle = screen.getByRole('button', { name: 'Show password' });
    fireEvent.click(toggle);
    expect(input.type).toBe('text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('renders native ConfirmDialog and handles confirm/cancel callbacks', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        title="Archive class"
        description="Are you sure you want to archive this class?"
        confirmLabel="Archive"
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('open');
    expect(screen.getByText('Archive class')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders DataTable rows inside a scrollable region and supports empty/loading states', () => {
    interface Row {
      id: string;
      name: string;
      status: string;
    }

    const columns = [
      { key: 'name', header: 'Name', render: (r: Row) => r.name },
      {
        key: 'status',
        header: 'Status',
        render: (r: Row) => <Badge variant="success">{r.status}</Badge>,
      },
    ];

    const { rerender } = render(
      <DataTable
        ariaLabel="Classes table"
        columns={columns}
        rows={[{ id: '1', name: 'Grade 6A', status: 'Active' }]}
        getRowKey={(r) => r.id}
      />,
    );

    const region = screen.getByRole('region', { name: 'Classes table' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(screen.getByText('Grade 6A')).toBeInTheDocument();

    rerender(
      <DataTable
        ariaLabel="Classes table"
        columns={columns}
        rows={[]}
        getRowKey={(r) => r.id}
        emptyTitle="No classes yet"
      />,
    );
    expect(screen.getByText('No classes yet')).toBeInTheDocument();
  });

  it('renders Alert, EmptyState, ErrorState, SearchInput, and Toast notifications', () => {
    const onRetry = vi.fn();
    const onSearch = vi.fn();

    render(
      <ToastProvider>
        <Alert variant="info" title="Notice">
          Maintenance window tonight.
        </Alert>
        <SearchInput value="math" onChange={onSearch} />
        <EmptyState title="Nothing here" description="Try adjusting filters." />
        <ErrorState description="Network timeout." onRetry={onRetry} />
        <ToastTrigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onSearch).toHaveBeenCalledWith('');

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Trigger toast' }));
    const toastRegion = screen.getByRole('region', { name: 'Notifications' });
    expect(toastRegion).toHaveTextContent('Saved changes');

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss message' }));
    expect(toastRegion).not.toHaveTextContent('Saved changes');
  });
});
