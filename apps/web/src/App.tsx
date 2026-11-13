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
const SuperAdminDashboardPage = lazy(
  () => import('@/features/super-admin/SuperAdminDashboardPage'),
);
const SchoolsDirectoryPage = lazy(() => import('@/features/super-admin/SchoolsDirectoryPage'));
const SchoolInspectionPage = lazy(() => import('@/features/super-admin/SchoolInspectionPage'));
const PlatformGovernancePage = lazy(() => import('@/features/super-admin/PlatformGovernancePage'));
const PlatformSettingsPage = lazy(() => import('@/features/super-admin/PlatformSettingsPage'));
const SchoolAdminDashboardPage = lazy(() => import('@/features/admin/SchoolAdminDashboardPage'));
const AcademicSetupPage = lazy(() => import('@/features/admin/AcademicSetupPage'));
const StaffDirectoryPage = lazy(() => import('@/features/admin/StaffDirectoryPage'));
const TeacherProfilePage = lazy(() => import('@/features/admin/TeacherProfilePage'));
const StudentDirectoryPage = lazy(() => import('@/features/admin/StudentDirectoryPage'));
const SchoolSettingsPage = lazy(() => import('@/features/admin/SchoolSettingsPage'));
const UserInvitationsPage = lazy(() => import('@/features/admin/UserInvitationsPage'));
const AcceptInvitationPage = lazy(() => import('@/features/auth/AcceptInvitationPage'));

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
              <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              <Route
                path="/super-admin"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <SuperAdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/super-admin/schools"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <SchoolsDirectoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/super-admin/schools/:schoolId"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <SchoolInspectionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/super-admin/governance"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <PlatformGovernancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/super-admin/settings"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <PlatformSettingsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
                    <SchoolAdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/academic"
                element={
                  <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
                    <AcademicSetupPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/staff"
                element={
                  <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
                    <StaffDirectoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/staff/:id"
                element={
                  <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
                    <TeacherProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/students"
                element={
                  <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
                    <StudentDirectoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/invitations"
                element={
                  <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
                    <UserInvitationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
                    <SchoolSettingsPage />
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
