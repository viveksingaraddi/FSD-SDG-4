import { AppShell } from '@/components/layout/AppShell';
import { Badge, Card, Heading, Text } from '@/components/ui';

export function PlatformSettingsPage() {
  return (
    <AppShell
      title="Platform Settings"
      breadcrumbs={[{ label: 'Platform Super Admin', to: '/super-admin' }, { label: 'Settings' }]}
    >
      <div className="space-y-5">
        <div>
          <Heading level={2} size="h2">
            Platform Security &amp; Governance Policies
          </Heading>
          <Text variant="small" className="mt-1">
            Active platform-wide defaults enforced by the backend security layer.
          </Text>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between">
              <Heading level={3} size="h4">
                Session &amp; Cookie Policy
              </Heading>
              <Badge variant="success">Enforced</Badge>
            </div>
            <Text variant="small" className="mt-2">
              HttpOnly, SameSite=Lax session cookies with dual-layer CSRF header validation.
            </Text>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <Heading level={3} size="h4">
                Tenant Isolation
              </Heading>
              <Badge variant="success">Zero Trust</Badge>
            </div>
            <Text variant="small" className="mt-2">
              Every tenant query is scoped exclusively from the authenticated session context.
            </Text>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export default PlatformSettingsPage;
