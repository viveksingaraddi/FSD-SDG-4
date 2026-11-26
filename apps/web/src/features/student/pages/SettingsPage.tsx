import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { LoadingState, StudentLayout } from '../../../components/student/index.js';
import { Avatar, Badge, Button, Card, useToast } from '../../../components/ui/index.js';
import { createZodResolver } from '../../../lib/zodResolver.js';
import {
  useStudentPreferences,
  useStudentProfile,
  useUpdateStudentPreferences,
  useUpdateStudentProfile,
} from '../hooks/useStudentPortal.js';
import {
  studentProfileSettingsSchema,
  type StudentProfileSettingsFormValues,
} from '../schemas/studentSchemas.js';
import type { StudentPreferences } from '../types/student.types.js';

export function SettingsPage() {
  const { showToast } = useToast();
  const { data: profile, isLoading: profileLoading } = useStudentProfile();
  const { data: preferences, isLoading: prefsLoading } = useStudentPreferences();
  const updateProfileMutation = useUpdateStudentProfile();
  const updatePrefsMutation = useUpdateStudentPreferences();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentProfileSettingsFormValues>({
    resolver: createZodResolver(studentProfileSettingsSchema),
    defaultValues: {
      studyFocus: profile?.studyFocus ?? '',
      bio: profile?.bio ?? '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        studyFocus: profile.studyFocus,
        bio: profile.bio,
      });
    }
  }, [profile, reset]);

  const handleProfileSave = (values: StudentProfileSettingsFormValues) => {
    updateProfileMutation.mutate(values, {
      onSuccess: () => {
        showToast({
          type: 'success',
          title: 'Learning profile updated',
          description: 'Your study focus and learning bio were saved.',
        });
      },
    });
  };

  const handleTogglePreference = (key: keyof StudentPreferences, value: boolean | string) => {
    updatePrefsMutation.mutate({ [key]: value } as Partial<StudentPreferences>, {
      onSuccess: () => {
        showToast({
          type: 'info',
          title: 'Preference saved',
          description: 'Your Student Portal preferences have been updated.',
        });
      },
    });
  };

  return (
    <StudentLayout
      breadcrumbs={[{ label: 'Student Portal', to: '/student' }, { label: 'Settings' }]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Settings
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Manage your student learning profile, notification choices, and portal display
            preferences.
          </p>
        </div>

        {profileLoading || prefsLoading || !profile || !preferences ? (
          <LoadingState label="Loading settings..." cards={3} />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Student Profile Info */}
            <Card className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-4 border-b border-[var(--color-border-subtle)] pb-4">
                <Avatar name={profile.fullName} size="lg" />
                <div>
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    {profile.fullName}
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {profile.schoolName} · {profile.gradeName} · {profile.sectionName}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-[var(--color-text-muted)]">
                    {profile.studentIdNumber} · Roll #{profile.rollNumber}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-[var(--color-text-muted)]">School Email</p>
                  <p className="mt-0.5 text-sm font-medium text-[var(--color-text-primary)]">
                    {profile.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--color-text-muted)]">
                    Homeroom Advisor
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-[var(--color-text-primary)]">
                    {profile.advisorName} ({profile.homeroomRoom})
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSubmit(handleProfileSave)}
                noValidate
                className="mt-6 space-y-4 border-t border-[var(--color-border-subtle)] pt-4"
              >
                <div>
                  <label
                    htmlFor="settings-study-focus"
                    className="block text-xs font-semibold text-[var(--color-text-primary)]"
                  >
                    Learning Focus / Academic Interest
                  </label>
                  <input
                    id="settings-study-focus"
                    type="text"
                    {...register('studyFocus')}
                    aria-invalid={Boolean(errors.studyFocus)}
                    className="mt-1 h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white px-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                  />
                  {errors.studyFocus && (
                    <p role="alert" className="mt-1 text-xs text-[var(--color-semantic-danger)]">
                      {errors.studyFocus.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="settings-bio"
                    className="block text-xs font-semibold text-[var(--color-text-primary)]"
                  >
                    Personal Learning Bio
                  </label>
                  <textarea
                    id="settings-bio"
                    rows={3}
                    {...register('bio')}
                    aria-invalid={Boolean(errors.bio)}
                    className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white p-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                  />
                  {errors.bio && (
                    <p role="alert" className="mt-1 text-xs text-[var(--color-semantic-danger)]">
                      {errors.bio.message}
                    </p>
                  )}
                </div>

                <Button type="submit" isLoading={updateProfileMutation.isPending}>
                  Save Profile Preferences
                </Button>
              </form>
            </Card>

            {/* Notifications, Display & Account UI */}
            <div className="space-y-6 lg:col-span-5">
              <Card>
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Notification Preferences
                </h2>
                <div className="mt-4 space-y-3">
                  {(
                    [
                      {
                        key: 'assignmentAlerts',
                        label: 'Assignment deadline reminders',
                        desc: 'Remind me 48 hours before due dates',
                      },
                      {
                        key: 'announcementAlerts',
                        label: 'School & teacher announcements',
                        desc: 'Highlight new notices in the portal header',
                      },
                      {
                        key: 'weeklyProgressDigest',
                        label: 'Weekly learning summary',
                        desc: 'Receive a weekly recap of study activity',
                      },
                      {
                        key: 'emailReminders',
                        label: 'Email notifications',
                        desc: 'Send important updates to school email',
                      },
                    ] as const
                  ).map((item) => {
                    const checked = preferences[item.key];
                    return (
                      <label
                        key={item.key}
                        className="flex cursor-pointer items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3"
                      >
                        <div>
                          <span className="block text-sm font-medium text-[var(--color-text-primary)]">
                            {item.label}
                          </span>
                          <span className="block text-xs text-[var(--color-text-muted)]">
                            {item.desc}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => handleTogglePreference(item.key, e.target.checked)}
                          className="mt-1 h-4 w-4 accent-[var(--color-brand-primary)]"
                        />
                      </label>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Display Preferences
                </h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="default-timetable-view"
                      className="block text-xs font-semibold text-[var(--color-text-primary)]"
                    >
                      Default Timetable View
                    </label>
                    <select
                      id="default-timetable-view"
                      value={preferences.defaultTimetableView}
                      onChange={(e) =>
                        handleTogglePreference(
                          'defaultTimetableView',
                          e.target.value as 'weekly' | 'daily',
                        )
                      }
                      className="mt-1 h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white px-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                    >
                      <option value="weekly">Weekly Grid</option>
                      <option value="daily">Daily Schedule</option>
                    </select>
                  </div>

                  <label className="flex cursor-pointer items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3">
                    <div>
                      <span className="block text-sm font-medium text-[var(--color-text-primary)]">
                        Show study tips on progress cards
                      </span>
                      <span className="block text-xs text-[var(--color-text-muted)]">
                        Display helpful next-step reminders from teachers
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.showStudyTips}
                      onChange={(e) => handleTogglePreference('showStudyTips', e.target.checked)}
                      className="mt-1 h-4 w-4 accent-[var(--color-brand-primary)]"
                    />
                  </label>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    Account &amp; Security
                  </h2>
                  <Badge variant="neutral">Managed by School</Badge>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  Your institutional sign-in credentials and tenant membership ({profile.schoolCode}
                  ) are managed by Greenfield Academy. Contact Help &amp; Support if you need a
                  password reset link.
                </p>
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      showToast({
                        type: 'info',
                        title: 'Password reset guidance',
                        description:
                          'Please request a school-verified password reset through your homeroom advisor or IT desk.',
                      })
                    }
                  >
                    Request Password Reset Assistance
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
