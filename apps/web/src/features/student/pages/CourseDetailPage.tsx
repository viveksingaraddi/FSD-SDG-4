import { Link, useParams } from 'react-router-dom';
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ClockIcon,
  FolderLibraryIcon,
  UserIcon,
} from '../../../components/icons/Icons.js';
import { EmptyState, LoadingState, StudentLayout } from '../../../components/student/index.js';
import { Badge, Button, Card, useToast } from '../../../components/ui/index.js';
import {
  useStudentCourse,
  useStudentResources,
  useToggleLessonCompletion,
} from '../hooks/useStudentPortal.js';

export function CourseDetailPage() {
  const { courseId = '' } = useParams();
  const { showToast } = useToast();
  const { data: course, isLoading } = useStudentCourse(courseId);
  const { data: allResources } = useStudentResources();
  const toggleLessonMutation = useToggleLessonCompletion();

  const courseResources = (allResources ?? []).filter((r) => r.courseId === courseId);

  const handleToggleLesson = (lessonId: string, currentlyDone: boolean, title: string) => {
    toggleLessonMutation.mutate(
      { courseId, lessonId },
      {
        onSuccess: () => {
          showToast({
            type: 'success',
            title: currentlyDone ? 'Lesson marked incomplete' : 'Lesson completed',
            description: title,
          });
        },
      },
    );
  };

  return (
    <StudentLayout
      breadcrumbs={[
        { label: 'Student Portal', to: '/student' },
        { label: 'My Courses', to: '/student/courses' },
        { label: course?.subjectName ?? 'Course Details' },
      ]}
    >
      {isLoading ? (
        <LoadingState variant="detail" label="Loading course details..." />
      ) : !course ? (
        <EmptyState
          title="Course not found"
          description="The requested subject could not be found in your current enrollment."
          action={
            <Link
              to="/student/courses"
              className="inline-flex items-center rounded-[var(--radius-md)] bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-medium text-white"
            >
              Back to My Courses
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/student/courses"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)]"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span>Back to My Courses</span>
            </Link>
          </div>

          {/* Course Overview Header */}
          <Card>
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="brand">{course.code}</Badge>
                  <Badge variant="neutral">{course.category}</Badge>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {course.scheduleSummary}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {course.subjectName}
                </h1>
                <p className="max-w-2xl text-sm text-[var(--color-text-secondary)]">
                  {course.description}
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[var(--color-text-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <UserIcon className="h-4 w-4" />
                    {course.teacher.name}
                  </span>
                  <span>Office Hours: {course.teacher.officeHours}</span>
                </div>
              </div>

              <div className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] p-4 lg:w-72">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-[var(--color-text-secondary)]">Overall Progress</span>
                  <span className="text-sm font-bold text-[var(--color-brand-primary)]">
                    {course.progressPercent}%
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-brand-primary)] transition-all"
                    style={{ width: `${course.progressPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  {course.completedLessons} of {course.totalLessons} lessons completed
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Modules & Lessons */}
            <div className="space-y-4 lg:col-span-8">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Course Modules &amp; Lessons
              </h2>
              {course.modules.map((mod) => (
                <Card key={mod.id}>
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                    {mod.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{mod.description}</p>

                  <ul className="mt-4 divide-y divide-[var(--color-border-subtle)]">
                    {mod.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex flex-col justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={lesson.completed ? 'success' : 'neutral'}>
                              {lesson.type}
                            </Badge>
                            <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                              <ClockIcon className="h-3.5 w-3.5" />
                              {lesson.durationMinutes} min
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                            {lesson.title}
                          </p>
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            {lesson.summary}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant={lesson.completed ? 'secondary' : 'primary'}
                          onClick={() =>
                            handleToggleLesson(lesson.id, lesson.completed, lesson.title)
                          }
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          <span>{lesson.completed ? 'Completed' : 'Mark complete'}</span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>

            {/* Linked Learning Materials */}
            <div className="space-y-4 lg:col-span-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Study Materials
                </h2>
                <Link
                  to={`/student/resources?subject=${encodeURIComponent(course.subjectName)}`}
                  className="text-xs font-semibold text-[var(--color-brand-primary)] hover:underline"
                >
                  All resources
                </Link>
              </div>

              {courseResources.length === 0 ? (
                <Card>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    No course materials linked yet.
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {courseResources.map((res) => (
                    <Card key={res.id} padding="sm">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="brand">{res.format}</Badge>
                        <span className="text-[11px] text-[var(--color-text-muted)]">
                          {res.durationOrSize}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">
                        {res.title}
                      </h3>
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                        {res.description}
                      </p>
                      <Link
                        to={`/student/resources?search=${encodeURIComponent(res.title)}`}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-brand-primary)] hover:underline"
                      >
                        <FolderLibraryIcon className="h-3.5 w-3.5" />
                        <span>Open in Resources</span>
                      </Link>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
