import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { emailSchema, nonEmptyString, z } from '@fsd-sdg4/validation';
import { ShieldCheck } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  FormField,
  Heading,
  Input,
  PasswordInput,
  Text,
} from '@/components/ui';
import { ApiClientError } from '@/lib/apiClient';
import { createZodResolver } from '@/lib/zodResolver';
import { getRoleHomePath, useAuth } from './AuthContext';

const loginFormSchema = z.object({
  email: emailSchema,
  password: nonEmptyString('Password'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginPage() {
  const { isAuthenticated, isLoading, user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const locationState = location.state as {
    from?: { pathname?: string };
    email?: string;
    activated?: boolean;
  } | null;

  const [activationSuccess, setActivationSuccess] = useState<boolean>(
    Boolean(locationState?.activated),
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: createZodResolver(loginFormSchema),
    defaultValues: {
      email: locationState?.email ?? '',
      password: '',
    },
  });

  if (!isLoading && isAuthenticated && user) {
    return <Navigate to={getRoleHomePath(user.role)} replace />;
  }

  const fromState = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const signedInUser = await login(values);
      const target =
        fromState && fromState !== '/login' ? fromState : getRoleHomePath(signedInUser.role);
      navigate(target, { replace: true });
    } catch (error) {
      if (error instanceof ApiClientError) {
        setServerError(error.detail || 'Unable to sign in with those credentials.');
      } else {
        setServerError('An unexpected error occurred while signing in. Please try again.');
      }
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--color-surface-canvas)] px-4 py-10">
      <main id="main-content" tabIndex={-1} className="w-full max-w-md outline-none">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-brand-primary)] text-[var(--color-text-inverse)] shadow-sm">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <Heading level={1} size="h1">
            Sign in to FSD-SDG-4
          </Heading>
          <Text variant="small" className="mt-1.5">
            Quality Education SaaS Platform — Multi-tenant academic &amp; student support portal
          </Text>
        </div>

        <Card padding="lg">
          {activationSuccess && !serverError && (
            <Alert
              variant="success"
              title="Account Activated"
              className="mb-4"
              onDismiss={() => setActivationSuccess(false)}
            >
              Your account has been successfully activated. Sign in below with your new password to
              access your portal.
            </Alert>
          )}

          {serverError && (
            <Alert
              variant="danger"
              title="Sign-in failed"
              className="mb-4"
              onDismiss={() => setServerError(null)}
            >
              {serverError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <FormField label="Institutional email" error={errors.email?.message} required>
              {(controlProps) => (
                <Input
                  {...controlProps}
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="name@school.edu"
                  hasError={Boolean(errors.email)}
                />
              )}
            </FormField>

            <FormField label="Password" error={errors.password?.message} required>
              {(controlProps) => (
                <PasswordInput
                  {...controlProps}
                  {...register('password')}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  hasError={Boolean(errors.password)}
                />
              )}
            </FormField>

            <Button type="submit" fullWidth loading={isSubmitting} className="mt-2">
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
