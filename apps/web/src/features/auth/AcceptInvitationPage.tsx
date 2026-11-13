import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API_ROUTES, type InvitationVerificationDto, type UserRole } from '@fsd-sdg4/contracts';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  School as SchoolIcon,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { Button, Card, Input, Skeleton } from '@/components/ui';
import { apiGet, apiPost } from '@/lib/apiClient';

const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  SUPER_ADMIN: 'Platform Super Administrator',
  SCHOOL_ADMIN: 'School Administrator',
  TEACHER: 'Teacher / Faculty Member',
  STUDENT: 'Student',
  PARENT: 'Parent / Guardian',
};

interface PasswordValidation {
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [verification, setVerification] = useState<InvitationVerificationDto | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isActivated, setIsActivated] = useState(false);

  const passwordId = useId();
  const confirmPasswordId = useId();

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setVerifyError('No invitation token was provided in the link.');
      return;
    }

    const abortController = new AbortController();
    setIsLoading(true);
    setVerifyError(null);

    apiGet<InvitationVerificationDto>(
      `${API_ROUTES.AUTH.INVITATIONS_VERIFY}?token=${encodeURIComponent(token)}`,
      { signal: abortController.signal },
    )
      .then((res) => {
        setVerification(res);
      })
      .catch((err) => {
        if (!abortController.signal.aborted) {
          setVerifyError(err instanceof Error ? err.message : 'Unable to verify invitation link.');
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [token]);

  const criteria: PasswordValidation = useMemo(
    () => ({
      hasMinLength: password.length >= 12,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    }),
    [password],
  );

  const isValidPassword =
    criteria.hasMinLength &&
    criteria.hasUpper &&
    criteria.hasLower &&
    criteria.hasNumber &&
    criteria.hasSpecial;

  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = isValidPassword && passwordsMatch && !isSubmitting;

  const strengthScore = useMemo(() => {
    let score = 0;
    if (criteria.hasMinLength) score++;
    if (criteria.hasUpper) score++;
    if (criteria.hasLower) score++;
    if (criteria.hasNumber) score++;
    if (criteria.hasSpecial) score++;
    return score;
  }, [criteria]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await apiPost(API_ROUTES.AUTH.INVITATIONS_ACCEPT, {
        token,
        password,
      });
      setIsActivated(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to activate account. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--color-surface-canvas)] p-4 sm:p-6 lg:p-8">
      {/* Platform Brand Header */}
      <div className="mb-6 flex items-center gap-3 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-brand-primary)] text-white shadow-md">
          <GraduationCap className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="text-left">
          <h1 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
            FSD-SDG-4
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Quality Education SaaS Platform
          </p>
        </div>
      </div>

      <div className="w-full max-w-lg">
        {/* State A: Loading Skeleton */}
        {isLoading && (
          <Card padding="none" className="border-[var(--color-border-default)] shadow-lg">
            <div className="space-y-4 p-8 text-center" aria-busy="true">
              <Skeleton className="mx-auto h-12 w-12 rounded-full" />
              <Skeleton className="mx-auto h-6 w-48" />
              <Skeleton className="mx-auto h-4 w-72" />
              <div className="pt-4 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </Card>
        )}

        {/* State B: Verification Error / Non-token error */}
        {!isLoading && verifyError && (
          <Card padding="none" className="border-[var(--color-border-danger)] shadow-lg">
            <div className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertCircle className="h-8 w-8" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                Invalid Invitation Link
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{verifyError}</p>
              <div className="mt-6">
                <Link to="/login">
                  <Button variant="primary" className="w-full justify-center">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* State C: Verification Invalid States (EXPIRED, REVOKED, ACCEPTED, NOT_FOUND) */}
        {!isLoading && verification && !verification.valid && (
          <Card padding="none" className="border-[var(--color-border-default)] shadow-lg">
            <div className="p-8 text-center">
              {verification.reason === 'EXPIRED' && (
                <>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                    <Clock className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                    Invitation Has Expired
                  </h2>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    This account invitation link expired after 7 days for security reasons. Please
                    contact your school or platform administrator to request a new invitation.
                  </p>
                </>
              )}

              {verification.reason === 'REVOKED' && (
                <>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <ShieldAlert className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                    Invitation Revoked
                  </h2>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    This invitation has been revoked by an administrator. Please reach out to your
                    school administrator if you believe this is an error.
                  </p>
                </>
              )}

              {verification.reason === 'ACCEPTED' && (
                <>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                    Account Already Activated
                  </h2>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    This invitation was already accepted and your account is active. You can log in
                    directly with your email and password.
                  </p>
                  <div className="mt-6">
                    <Link to="/login">
                      <Button variant="primary" className="w-full justify-center">
                        Proceed to Sign In
                      </Button>
                    </Link>
                  </div>
                </>
              )}

              {(!verification.reason ||
                verification.reason === 'NOT_FOUND' ||
                verification.reason === 'INVALID') && (
                <>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                    <AlertCircle className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                    Invitation Not Found
                  </h2>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    The requested account invitation could not be found or has been removed.
                  </p>
                </>
              )}

              {verification.reason !== 'ACCEPTED' && (
                <div className="mt-6">
                  <Link to="/login">
                    <Button variant="outline" className="w-full justify-center">
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* State D: Successfully Activated Success Screen */}
        {!isLoading && isActivated && (
          <Card
            padding="none"
            className="border-[var(--color-border-success)] bg-emerald-50/20 shadow-xl"
          >
            <div className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-sm">
                <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                Account Successfully Activated!
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Your password has been securely configured with Argon2id encryption. Your account is
                now active and ready for your first login.
              </p>

              <div className="mt-8">
                <Button
                  variant="primary"
                  className="w-full justify-center gap-2 py-3 text-base shadow-sm"
                  onClick={() => navigate('/login')}
                >
                  <span>Sign In to Platform</span>
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* State E: Valid Invitation Form */}
        {!isLoading && verification?.valid && !isActivated && (
          <Card padding="none" className="border-[var(--color-border-default)] shadow-xl">
            <div className="border-b border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                    Set Up Your Account
                  </h2>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    Please create a strong password to activate your access.
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-primary-subtle)] text-[var(--color-brand-primary)]">
                  <KeyRound className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>

              {/* Account Metadata Badge */}
              <div className="mt-4 grid grid-cols-1 gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] p-3 text-xs">
                {verification.email && (
                  <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                    <Mail className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                    <span className="font-medium text-[var(--color-text-primary)] truncate">
                      {verification.email}
                    </span>
                  </div>
                )}
                {verification.role && (
                  <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                    <UserCheck className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                    <span>Role: </span>
                    <span className="font-semibold text-[var(--color-brand-primary)]">
                      {ROLE_DISPLAY_NAMES[verification.role] ?? verification.role}
                    </span>
                  </div>
                )}
                {verification.schoolName && (
                  <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                    <SchoolIcon className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                    <span>Institution: </span>
                    <span className="font-semibold text-[var(--color-text-primary)] truncate">
                      {verification.schoolName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              {submitError && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2.5 rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-xs text-red-800"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Password Input */}
                <div>
                  <label
                    htmlFor={passwordId}
                    className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5"
                  >
                    Create Password
                  </label>
                  <div className="relative">
                    <Input
                      id={passwordId}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter minimum 12 characters"
                      required
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <div className="space-y-1.5" aria-live="polite">
                    <div className="flex justify-between text-[11px] text-[var(--color-text-secondary)]">
                      <span>Password Strength</span>
                      <span className="font-medium">
                        {strengthScore <= 2 && <span className="text-red-600">Weak</span>}
                        {strengthScore >= 3 && strengthScore < 5 && (
                          <span className="text-amber-600">Good</span>
                        )}
                        {strengthScore === 5 && <span className="text-emerald-600">Strong</span>}
                      </span>
                    </div>
                    <div className="flex h-1.5 gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-full flex-1 rounded-full transition-colors ${
                            level <= strengthScore
                              ? strengthScore <= 2
                                ? 'bg-red-500'
                                : strengthScore < 5
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-600'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Password Policy Checklist */}
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] p-3 text-xs space-y-1.5">
                  <p className="font-semibold text-[var(--color-text-primary)] mb-1">
                    Security Requirements:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <div
                      className={`flex items-center gap-1.5 ${
                        criteria.hasMinLength
                          ? 'text-emerald-700 font-medium'
                          : 'text-[var(--color-text-muted)]'
                      }`}
                    >
                      <CheckCircle2
                        className={`h-3.5 w-3.5 ${criteria.hasMinLength ? 'text-emerald-600' : 'text-gray-300'}`}
                      />
                      <span>12+ characters</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        criteria.hasUpper
                          ? 'text-emerald-700 font-medium'
                          : 'text-[var(--color-text-muted)]'
                      }`}
                    >
                      <CheckCircle2
                        className={`h-3.5 w-3.5 ${criteria.hasUpper ? 'text-emerald-600' : 'text-gray-300'}`}
                      />
                      <span>1 uppercase letter (A-Z)</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        criteria.hasLower
                          ? 'text-emerald-700 font-medium'
                          : 'text-[var(--color-text-muted)]'
                      }`}
                    >
                      <CheckCircle2
                        className={`h-3.5 w-3.5 ${criteria.hasLower ? 'text-emerald-600' : 'text-gray-300'}`}
                      />
                      <span>1 lowercase letter (a-z)</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        criteria.hasNumber
                          ? 'text-emerald-700 font-medium'
                          : 'text-[var(--color-text-muted)]'
                      }`}
                    >
                      <CheckCircle2
                        className={`h-3.5 w-3.5 ${criteria.hasNumber ? 'text-emerald-600' : 'text-gray-300'}`}
                      />
                      <span>1 number (0-9)</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 col-span-1 sm:col-span-2 ${
                        criteria.hasSpecial
                          ? 'text-emerald-700 font-medium'
                          : 'text-[var(--color-text-muted)]'
                      }`}
                    >
                      <CheckCircle2
                        className={`h-3.5 w-3.5 ${criteria.hasSpecial ? 'text-emerald-600' : 'text-gray-300'}`}
                      />
                      <span>1 special symbol (!@#$%^&*...)</span>
                    </div>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label
                    htmlFor={confirmPasswordId}
                    className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      id={confirmPasswordId}
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      required
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
                  )}
                  {passwordsMatch && (
                    <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Passwords match.
                    </p>
                  )}
                </div>

                {/* Submit CTA */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!canSubmit}
                    loading={isSubmitting}
                    className="w-full justify-center gap-2 py-2.5 text-sm font-semibold shadow-md"
                  >
                    <Lock className="h-4 w-4" />
                    <span>Activate Account & Set Password</span>
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        )}

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
          <span>Already activated? </span>
          <Link
            to="/login"
            className="font-medium text-[var(--color-brand-primary)] hover:underline"
          >
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AcceptInvitationPage;
