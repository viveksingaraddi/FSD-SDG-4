import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { Skeleton, ToastProvider } from '@/components/ui';
import { AuthProvider, getRoleHomePath, useAuth } from '@/features/auth/AuthContext';
import { LoginPage } from '@/features/auth/LoginPage';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';

const PortalPlaceholderPage = lazy(() => import('@/pages/PortalPlaceholderPage'));

function RootRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading application"
        className="flex min-h-dvh items-center justify-center bg-[var(--color-surface-canvas)] p-6"
      >
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getRoleHomePath(user.role)} replace />;
}

function PortalLoadingFallback() {
  return (
    <div
      role="status"
      aria-label="Loading portal"
      className="flex min-h-dvh items-center justify-center bg-[var(--color-surface-canvas)] p-6"
    >
      <div className="w-full max-w-lg space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <Suspense fallback={<PortalLoadingFallback />}>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              <Route
                path="/super-admin/*"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <PortalPlaceholderPage
                      role="SUPER_ADMIN"
                      portalTitle="Platform Super Admin Portal"
                      description="Multi-school governance, onboarding, and platform health overview."
                    />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
                    <PortalPlaceholderPage
                      role="SCHOOL_ADMIN"
                      portalTitle="School Administrator Portal"
                      description="Academic year setup, class rosters, staff management, and school reporting."
                    />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/teacher/*"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER']}>
                    <PortalPlaceholderPage
                      role="TEACHER"
                      portalTitle="Teacher Portal"
                      description="Daily attendance, assignments, grading, and human-reviewed student support plans."
                    />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/student/*"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <PortalPlaceholderPage
                      role="STUDENT"
                      portalTitle="Student Portal"
                      description="Learning resources, coursework submissions, and personal academic progress."
                    />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/parent/*"
                element={
                  <ProtectedRoute allowedRoles={['PARENT']}>
                    <PortalPlaceholderPage
                      role="PARENT"
                      portalTitle="Parent & Guardian Portal"
                      description="Student attendance summaries, progress updates, and family support collaboration."
                    />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
