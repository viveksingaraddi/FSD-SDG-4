import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button, Card, Heading, Text } from '@/components/ui';
import { getRoleHomePath, useAuth } from '@/features/auth/AuthContext';

export function NotFoundPage() {
  const { user } = useAuth();
  const homePath = user ? getRoleHomePath(user.role) : '/login';

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--color-surface-canvas)] px-4">
      <main id="main-content" tabIndex={-1} className="w-full max-w-md outline-none">
        <Card padding="lg" className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)]">
            <FileQuestion className="h-6 w-6" aria-hidden="true" />
          </div>
          <Heading level={1} size="h2">
            Page not found
          </Heading>
          <Text variant="small" className="mt-2">
            The page you requested could not be found or may have moved.
          </Text>
          <div className="mt-6 flex justify-center">
            <Link to={homePath}>
              <Button variant="primary">{user ? 'Back to portal' : 'Go to sign in'}</Button>
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
