import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Search } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Alert,
  Card,
  EmptyState,
  ErrorState,
  Heading,
  Input,
  Select,
  Skeleton,
  Text,
} from '@/components/ui';
import { fetchLinkedChildren } from './parentApi';

export function ParentMessagesPage() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const childrenQuery = useQuery({
    queryKey: ['parent', 'children'],
    queryFn: ({ signal }) => fetchLinkedChildren(signal),
  });

  const children = childrenQuery.data ?? [];
  const activeStudentId = selectedStudentId || children[0]?.id || '';

  return (
    <AppShell
      title="Messages"
      breadcrumbs={[{ label: 'Parent / Guardian', to: '/parent' }, { label: 'Messages' }]}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2">
              Parent–Teacher Messages
            </Heading>
            <Text variant="small" className="mt-1">
              Communicate securely with teachers assigned to your verified children.
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

        <Alert variant="warning" title="Messaging Service Unavailable">
          Direct parent–teacher messaging requires backend conversation and message endpoints
          (not yet provisioned in the platform API). Conversations are never fabricated or stored
          client-side.
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

        {!childrenQuery.isLoading && !childrenQuery.isError && children.length > 0 && (
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-default)] pb-4">
              <div className="flex items-center gap-2">
                <MessageSquare
                  className="h-5 w-5 text-[var(--color-brand-primary)]"
                  aria-hidden="true"
                />
                <Heading level={3} size="h3">
                  Conversations
                </Heading>
              </div>
              <div className="relative w-full sm:w-64">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]"
                  aria-hidden="true"
                />
                <Input
                  aria-label="Search conversations"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search teacher or subject..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="mt-6">
              <EmptyState
                title="No conversations available"
                description="Once the school enables the messaging backend, conversations with your child's assigned teachers will appear here."
              />
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

export default ParentMessagesPage;
