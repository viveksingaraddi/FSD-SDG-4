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
const PlatformUsersPage = lazy(() => import('@/features/super-admin/PlatformUsersPage'));
const SchoolAdminDashboardPage = lazy(() => import('@/features/admin/SchoolAdminDashboardPage'));
const AcademicSetupPage = lazy(() => import('@/features/admin/AcademicSetupPage'));
const StaffDirectoryPage = lazy(() => import('@/features/admin/StaffDirectoryPage'));
const AdminTeacherProfilePage = lazy(() => import('@/features/admin/TeacherProfilePage'));
const StudentDirectoryPage = lazy(() => import('@/features/admin/StudentDirectoryPage'));
const SchoolSettingsPage = lazy(() => import('@/features/admin/SchoolSettingsPage'));
const ParentDashboardPage = lazy(() => import('@/features/parent/ParentDashboardPage'));
const ParentAttendancePage = lazy(() => import('@/features/parent/ParentAttendancePage'));
const ParentProgressPage = lazy(() => import('@/features/parent/ParentProgressPage'));
const ParentAssignmentsPage = lazy(() => import('@/features/parent/ParentAssignmentsPage'));
const ParentSupportPage = lazy(() => import('@/features/parent/ParentSupportPage'));
const ParentMessagesPage = lazy(() => import('@/features/parent/ParentMessagesPage'));
const ParentNotificationsPage = lazy(() => import('@/features/parent/ParentNotificationsPage'));
const ParentCalendarPage = lazy(() => import('@/features/parent/ParentCalendarPage'));
const ParentFeesPage = lazy(() => import('@/features/parent/ParentFeesPage'));
const ParentDocumentsPage = lazy(() => import('@/features/parent/ParentDocumentsPage'));
const UserInvitationsPage = lazy(() => import('@/features/admin/UserInvitationsPage'));
const UserManagementPage = lazy(() => import('@/features/admin/UserManagementPage'));
const BulkImportPage = lazy(() =>
  import('@/features/admin/BulkImportPage').then((m) => ({ default: m.BulkImportPage })),
);
const SchoolOnboardingPage = lazy(() => import('@/features/admin/SchoolOnboardingPage'));
const AcceptInvitationPage = lazy(() => import('@/features/auth/AcceptInvitationPage'));

const TeacherDashboardPage = lazy(() => import('@/features/teacher/TeacherDashboardPage'));
const TeacherClassesPage = lazy(() => import('@/features/teacher/TeacherClassesPage'));
const TeacherStudentsPage = lazy(() => import('@/features/teacher/TeacherStudentsPage'));
const TeacherAttendancePage = lazy(() => import('@/features/teacher/TeacherAttendancePage'));
const TeacherAssignmentsPage = lazy(() => import('@/features/teacher/TeacherAssignmentsPage'));
const TeacherGradesPage = lazy(() => import('@/features/teacher/TeacherGradesPage'));
const TeacherTimetablePage = lazy(() => import('@/features/teacher/TeacherTimetablePage'));
const TeacherAnnouncementsPage = lazy(() => import('@/features/teacher/TeacherAnnouncementsPage'));
const TeacherMessagesPage = lazy(() => import('@/features/teacher/TeacherMessagesPage'));
const TeacherProfilePage = lazy(() => import('@/features/teacher/TeacherProfilePage'));
const TeacherSettingsPage = lazy(() => import('@/features/teacher/TeacherSettingsPage'));

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
                path="/super-admin/users"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <PlatformUsersPage />
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
                path="/admin/onboarding"
                element={
                  <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
                    <SchoolOnboardingPage />
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
                    <AdminTeacherProfilePage />
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
                path="/admin/bulk-import"
                element={
                  <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
                    <BulkImportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
                    <UserManagementPage />
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

              {/* Teacher Portal Routes */}
              <Route
                path="/teacher"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER']}>
                    <TeacherDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/classes"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER']}>
                    <TeacherClassesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/students"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER']}>
                    <TeacherStudentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/attendance"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER']}>
                    <TeacherAttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/assignments"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER']}>
                    <TeacherAssignmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/grades"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER']}>
                    <TeacherGradesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/timetable"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER']}>
                    <TeacherTimetablePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/announcements"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER']}>
                    <TeacherAnnouncementsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/messages"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER']}>
                    <TeacherMessagesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/profile"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER']}>
                    <TeacherProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/settings"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER']}>
                    <TeacherSettingsPage />
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
                path="/parent"
                element={
                  <ProtectedRoute allowedRoles={['PARENT']}>
                    <ParentDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/attendance"
                element={
                  <ProtectedRoute allowedRoles={['PARENT']}>
                    <ParentAttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/progress"
                element={
                  <ProtectedRoute allowedRoles={['PARENT']}>
                    <ParentProgressPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/assignments"
                element={
                  <ProtectedRoute allowedRoles={['PARENT']}>
                    <ParentAssignmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/support"
                element={
                  <ProtectedRoute allowedRoles={['PARENT']}>
                    <ParentSupportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/messages"
                element={
                  <ProtectedRoute allowedRoles={['PARENT']}>
                    <ParentMessagesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/notifications"
                element={
                  <ProtectedRoute allowedRoles={['PARENT']}>
                    <ParentNotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/calendar"
                element={
                  <ProtectedRoute allowedRoles={['PARENT']}>
                    <ParentCalendarPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/fees"
                element={
                  <ProtectedRoute allowedRoles={['PARENT']}>
                    <ParentFeesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/documents"
                element={
                  <ProtectedRoute allowedRoles={['PARENT']}>
                    <ParentDocumentsPage />
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
