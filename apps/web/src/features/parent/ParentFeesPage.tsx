import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Receipt } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Heading,
  Select,
  Skeleton,
  Text,
} from '@/components/ui';
import { fetchLinkedChildren } from './parentApi';

export function ParentFeesPage() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const childrenQuery = useQuery({
    queryKey: ['parent', 'children'],
    queryFn: ({ signal }) => fetchLinkedChildren(signal),
  });

  const children = childrenQuery.data ?? [];
  const activeStudentId = selectedStudentId || children[0]?.id || '';

  return (
    <AppShell
      title="Fees & Payments"
      breadcrumbs={[{ label: 'Parent / Guardian', to: '/parent' }, { label: 'Fees & Payments' }]}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2">
              Fees &amp; Payments
            </Heading>
            <Text variant="small" className="mt-1">
              Review fee summaries, category breakdowns, payment history, and official receipts.
            </Text>
          </div>
          {children.length > 0 && (
            <Select
              aria-label="Select child"
              value={activeStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              options={children.map((c) => ({
                value: c.id,
                label: `${c.firstName} ${c.lastName} (${c.className})`,
              }))}
            />
          )}
        </div>

        <Alert variant="warning" title="Online Billing & Payment Gateway Unavailable">
          Fee ledger models, invoicing endpoints, and payment gateway integration are not yet
          enabled in this platform. No payment can be initiated here, and card details are never
          collected or stored. Please contact your school administration office for fee inquiries.
        </Alert>

        {childrenQuery.isLoading && <Skeleton className="h-48 w-full" />}

        {childrenQuery.isError && (
          <ErrorState
            title="Unable to verify linked children"
            description="Please try again later."
            onRetry={() => void childrenQuery.refetch()}
          />
        )}

        {!childrenQuery.isLoading && !childrenQuery.isError && children.length === 0 && (
          <EmptyState
            title="No verified linked students"
            description="Contact your school administrator to verify your guardian relationship."
          />
        )}

        {!childrenQuery.isLoading && !childrenQuery.isError && activeStudentId && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <Text variant="small">Total Fees</Text>
                <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">—</p>
                <Badge variant="neutral" className="mt-2">
                  Ledger Not Connected
                </Badge>
              </Card>
              <Card>
                <Text variant="small">Paid Amount</Text>
                <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">—</p>
                <Badge variant="neutral" className="mt-2">
                  No Verified Transactions
                </Badge>
              </Card>
              <Card>
                <Text variant="small">Pending Amount</Text>
                <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">—</p>
                <Badge variant="neutral" className="mt-2">
                  Unavailable
                </Badge>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <div className="flex items-center gap-2 border-b border-[var(--color-border-default)] pb-3">
                  <CreditCard
                    className="h-5 w-5 text-[var(--color-brand-primary)]"
                    aria-hidden="true"
                  />
                  <Heading level={3} size="h3">
                    Fee Category Breakdown
                  </Heading>
                </div>
                <div className="mt-4">
                  <EmptyState
                    title="No fee schedule published"
                    description="Fee categories and due dates will appear once school billing is enabled."
                  />
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-2 border-b border-[var(--color-border-default)] pb-3">
                  <Receipt
                    className="h-5 w-5 text-[var(--color-brand-primary)]"
                    aria-hidden="true"
                  />
                  <Heading level={3} size="h3">
                    Payment History &amp; Receipts
                  </Heading>
                </div>
                <div className="mt-4">
                  <EmptyState
                    title="No payment transactions"
                    description="Verified payment receipts will appear here after confirmed transactions."
                  />
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default ParentFeesPage;
