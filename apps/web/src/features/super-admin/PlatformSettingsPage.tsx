import { useQuery } from '@tanstack/react-query';
import { Clock, KeyRound, Layers, Mail, RefreshCw, Server, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, Button, Card, ErrorState, Heading, Skeleton, Text } from '@/components/ui';
import { fetchPlatformSettings } from './superAdminApi';

export function PlatformSettingsPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['super-admin', 'settings'],
    queryFn: ({ signal }) => fetchPlatformSettings(signal),
  });

  const policies = data?.policies;

  return (
    <AppShell
      title="Platform Settings"
      breadcrumbs={[
        { label: 'Platform Super Admin', to: '/super-admin' },
        { label: 'Settings & Security' },
      ]}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2">
              Platform Security &amp; Operational Governance
            </Heading>
            <Text variant="small" className="mt-1">
              Active architectural constraints, cryptographic policies, and platform-wide defaults.
            </Text>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            leftIcon={<RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Refresh Policies
          </Button>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
        )}

        {isError && (
          <ErrorState
            title="Unable to load platform policies"
            description={error instanceof Error ? error.message : 'Settings unavailable.'}
            onRetry={() => void refetch()}
          />
        )}

        {policies && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {/* Session Policy Card */}
            <Card padding="md">
              <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-2.5">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[var(--color-brand-primary)]" />
                  <Heading level={3} size="h4">
                    Session &amp; Cookies
                  </Heading>
                </div>
                <Badge variant="success">Enforced</Badge>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Max Session Window:</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {Math.round(policies.sessionPolicy.maxAgeSeconds / 86400)} Days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Cookie SameSite:</span>
                  <span className="font-mono uppercase text-[var(--color-text-primary)]">
                    {policies.sessionPolicy.sameSite}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">HttpOnly Protection:</span>
                  <span className="font-semibold text-emerald-600">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">CSRF Token Header:</span>
                  <span className="font-mono text-[var(--color-text-primary)]">
                    {policies.csrfProtection.headerName}
                  </span>
                </div>
              </div>
            </Card>

            {/* Tenant Isolation Card */}
            <Card padding="md">
              <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-2.5">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-emerald-600" />
                  <Heading level={3} size="h4">
                    Tenant Isolation
                  </Heading>
                </div>
                <Badge variant="success">Zero Trust</Badge>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div>
                  <span className="text-[var(--color-text-secondary)]">Architecture Model:</span>
                  <p className="mt-0.5 font-medium text-[var(--color-text-primary)]">
                    {policies.tenantIsolation.model}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--color-text-secondary)]">Enforcement Layer:</span>
                  <p className="mt-0.5 font-mono text-[11px] text-[var(--color-text-primary)]">
                    {policies.tenantIsolation.enforcementLayer}
                  </p>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-[var(--color-text-secondary)]">
                    Client-Supplied ID Trust:
                  </span>
                  <span className="font-semibold text-red-600">Zero (Rejected)</span>
                </div>
              </div>
            </Card>

            {/* Password & Crypto Policy Card */}
            <Card padding="md">
              <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-2.5">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-indigo-600" />
                  <Heading level={3} size="h4">
                    Password &amp; Crypto
                  </Heading>
                </div>
                <Badge variant="brand">Argon2id</Badge>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Hashing Algorithm:</span>
                  <span className="font-semibold font-mono text-[var(--color-text-primary)]">
                    {policies.passwordPolicy.hashingAlgorithm}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Minimum Length:</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {policies.passwordPolicy.minLength} Characters
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Complexity Criteria:</span>
                  <span className="text-[var(--color-text-primary)]">
                    Upper, Lower, Number, Symbol
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">
                    Invitation Token Entropy:
                  </span>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    32 Bytes (Hex)
                  </span>
                </div>
              </div>
            </Card>

            {/* Rate Limiting Policy */}
            <Card padding="md">
              <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-600" />
                  <Heading level={3} size="h4">
                    Rate Limiting &amp; DOS
                  </Heading>
                </div>
                <Badge variant="warning">Active</Badge>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">General API Window:</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {policies.rateLimiting.globalLimit} req / 15 min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Auth Endpoints Window:</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {policies.rateLimiting.authLimit} req / 15 min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Abuse Mitigation:</span>
                  <span className="text-emerald-600 font-medium">Automatic Backoff</span>
                </div>
              </div>
            </Card>

            {/* Email Dispatch Configuration */}
            <Card padding="md">
              <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-2.5">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-sky-600" />
                  <Heading level={3} size="h4">
                    Mail &amp; Notifications
                  </Heading>
                </div>
                <Badge variant="info">Gmail SMTP</Badge>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div>
                  <span className="text-[var(--color-text-secondary)]">Delivery Provider:</span>
                  <p className="mt-0.5 font-medium text-[var(--color-text-primary)]">
                    {policies.emailDelivery.provider}
                  </p>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Secure TLS Transport:</span>
                  <span className="font-semibold text-emerald-600">Enabled (TLSv1.2+)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Token URL Dispatch:</span>
                  <span className="font-semibold text-emerald-600">Automated</span>
                </div>
              </div>
            </Card>

            {/* Platform Runtime Specs */}
            <Card padding="md">
              <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-2.5">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-purple-600" />
                  <Heading level={3} size="h4">
                    Runtime Architecture
                  </Heading>
                </div>
                <Badge variant="neutral">v{data?.version ?? '1.0.0'}</Badge>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Platform Version:</span>
                  <span className="font-mono text-[var(--color-text-primary)]">
                    {data?.version ?? '1.0.0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Environment:</span>
                  <span className="font-mono uppercase text-[var(--color-text-primary)]">
                    {data?.environment ?? 'development'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">API Endpoint Surface:</span>
                  <span className="font-mono text-[var(--color-text-primary)]">/api/v1</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default PlatformSettingsPage;
