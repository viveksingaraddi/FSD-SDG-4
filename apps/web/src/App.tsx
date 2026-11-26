import { Suspense, type JSX } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/feedback/ErrorBoundary.js';
import { LoadingState } from './components/student/LoadingState.js';
import { ToastProvider } from './components/ui/Toast.js';
import {
  AnnouncementsPage,
  AssessmentsPage,
  AssignmentDetailPage,
  AssignmentsPage,
  AttendancePage,
  CourseDetailPage,
  CoursesPage,
  LearningResourcesPage,
  ProgressPage,
  SettingsPage,
  StudentDashboardPage,
  SupportPage,
  TimetablePage,
} from './features/student/pages/index.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

export function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <Suspense
          fallback={
            <div className="mx-auto max-w-[1440px] p-6">
              <LoadingState label="Loading Student Portal..." />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Navigate to="/student" replace />} />
            <Route path="/student" element={<StudentDashboardPage />} />
            <Route path="/student/dashboard" element={<Navigate to="/student" replace />} />
            <Route path="/student/courses" element={<CoursesPage />} />
            <Route path="/student/courses/:courseId" element={<CourseDetailPage />} />
            <Route path="/student/courses/:courseId/resources" element={<CourseDetailPage />} />
            <Route path="/student/assignments" element={<AssignmentsPage />} />
            <Route path="/student/assignments/:assignmentId" element={<AssignmentDetailPage />} />
            <Route
              path="/student/assignments/:assignmentId/submit"
              element={<AssignmentDetailPage />}
            />
            <Route path="/student/assessments" element={<AssessmentsPage />} />
            <Route path="/student/resources" element={<LearningResourcesPage />} />
            <Route path="/student/attendance" element={<AttendancePage />} />
            <Route path="/student/progress" element={<ProgressPage />} />
            <Route path="/student/announcements" element={<AnnouncementsPage />} />
            <Route path="/student/timetable" element={<TimetablePage />} />
            <Route path="/student/support" element={<SupportPage />} />
            <Route path="/student/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
