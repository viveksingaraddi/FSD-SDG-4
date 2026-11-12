import type { UserRole } from '@fsd-sdg4/contracts';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, Card, EmptyState, Heading, Text } from '@/components/ui';
import { ROLE_LABELS } from '@/config/navigation';
import { useAuth } from '@/features/auth/AuthContext';

export interface PortalPlaceholderPageProps {
  role: UserRole;
  portalTitle: string;
  description: string;
}

export function PortalPlaceholderPage({
  role,
  portalTitle,
  description,
}: PortalPlaceholderPageProps) {
  const { user } = useAuth();
  const roleLabel = ROLE_LABELS[role];

  return (
    <AppShell title={portalTitle} breadcrumbs={[{ label: roleLabel }, { label: portalTitle }]}>
      <div className="space-y-6">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Heading level={2} size="h2">
                {portalTitle}
              </Heading>
              <Text variant="small" className="mt-1">
                {description}
              </Text>
            </div>
            <Badge variant="brand">{roleLabel}</Badge>
          </div>
          {user && (
            <div className="mt-4 flex flex-wrap gap-4 border-t border-[var(--color-border-default)] pt-4 text-xs text-[var(--color-text-muted)]">
              <span>Signed in as: {user.email}</span>
              <span>Tenant scope: {user.schoolId ?? 'Platform-wide'}</span>
            </div>
          )}
        </Card>

        <EmptyState
          title="Portal foundation ready"
          description="Shared design system, authentication, and navigation shell are active. Role-specific modules will be built in subsequent phases."
        />
      </div>
    </AppShell>
  );
}

export default PortalPlaceholderPage;
