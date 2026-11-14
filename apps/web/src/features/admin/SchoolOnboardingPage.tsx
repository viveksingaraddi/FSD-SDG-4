import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  Circle,
  GraduationCap,
  HeartHandshake,
  Layers,
  Save,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import type { OnboardingStepKey } from '@fsd-sdg4/contracts';
import { AppShell } from '@/components/layout/AppShell';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  Heading,
  Input,
  Select,
  Skeleton,
  Text,
  useToast,
} from '@/components/ui';
import {
  activateAcademicYearRequest,
  completeSchoolOnboardingRequest,
  createAcademicYearRequest,
  createClassRequest,
  createSectionRequest,
  createStudentRequest,
  createSubjectRequest,
  fetchAcademicYears,
  fetchClasses,
  fetchSchoolOnboarding,
  fetchStaff,
  fetchStudents,
  fetchSubjects,
  inviteSchoolUserRequest,
  saveOnboardingProgressRequest,
  updateSchoolSettingsRequest,
} from './schoolAdminApi';

interface StepMeta {
  key: OnboardingStepKey;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepMeta[] = [
  {
    key: 'profile',
    label: 'School Profile',
    description: 'Verify institutional identity and administrative contact details.',
    icon: Building2,
  },
  {
    key: 'academic-year',
    label: 'Academic Year',
    description: 'Establish the active academic calendar and term boundaries.',
    icon: Calendar,
  },
  {
    key: 'classes-sections',
    label: 'Classes & Sections',
    description: 'Configure grade levels, class streams, and physical sections.',
    icon: Layers,
  },
  {
    key: 'subjects',
    label: 'Curriculum Subjects',
    description: 'Catalog academic courses, subjects, and departmental credits.',
    icon: BookOpen,
  },
  {
    key: 'teachers',
    label: 'Faculty & Teachers',
    description: 'Invite faculty members and establish instructional capacity.',
    icon: Users,
  },
  {
    key: 'students',
    label: 'Student Enrollment',
    description: 'Enroll initial student cohorts and assign class sections.',
    icon: GraduationCap,
  },
  {
    key: 'parents',
    label: 'Parents & Guardians',
    description: 'Invite family guardians and establish verified student links.',
    icon: HeartHandshake,
  },
  {
    key: 'summary',
    label: 'Setup Summary',
    description: 'Review institutional telemetry and finalize school launch.',
    icon: Sparkles,
  },
];

export function SchoolOnboardingPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeStep, setActiveStep] = useState<OnboardingStepKey>('profile');
  const [hasInitializedStep, setHasInitializedStep] = useState(false);

  // Queries
  const {
    data: onboarding,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['school-admin', 'onboarding'],
    queryFn: async ({ signal }) => {
      const result = await fetchSchoolOnboarding(signal);
      if (!hasInitializedStep && result.currentStep) {
        setActiveStep(result.currentStep);
        setHasInitializedStep(true);
      }
      return result;
    },
  });

  const { data: academicYears = [] } = useQuery({
    queryKey: ['school-admin', 'academic-years'],
    queryFn: ({ signal }) => fetchAcademicYears(signal),
    enabled:
      activeStep === 'academic-year' ||
      activeStep === 'classes-sections' ||
      activeStep === 'students',
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['school-admin', 'classes'],
    queryFn: ({ signal }) => fetchClasses(signal),
    enabled: activeStep === 'classes-sections' || activeStep === 'students',
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['school-admin', 'subjects'],
    queryFn: ({ signal }) => fetchSubjects(signal),
    enabled: activeStep === 'subjects',
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ['school-admin', 'staff'],
    queryFn: ({ signal }) => fetchStaff({}, signal),
    enabled: activeStep === 'teachers',
  });

  const { data: studentList = [] } = useQuery({
    queryKey: ['school-admin', 'students'],
    queryFn: ({ signal }) => fetchStudents(undefined, signal),
    enabled: activeStep === 'students' || activeStep === 'parents',
  });

  // Save Progress Mutation
  const saveProgressMutation = useMutation({
    mutationFn: (step: OnboardingStepKey) => saveOnboardingProgressRequest({ step }),
    onSuccess: (_, step) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin', 'onboarding'] });
      showToast({
        title: 'Progress Saved',
        description: `Your onboarding bookmark has been recorded at ${STEPS.find((s) => s.key === step)?.label ?? step}.`,
        variant: 'success',
      });
    },
    onError: (err: Error) => {
      showToast({
        title: 'Save Failed',
        description: err.message || 'Unable to persist setup progress to backend.',
        variant: 'danger',
      });
    },
  });

  // Complete Onboarding Mutation
  const completeMutation = useMutation({
    mutationFn: completeSchoolOnboardingRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin', 'overview'] });
      void queryClient.invalidateQueries({ queryKey: ['school-admin', 'onboarding'] });
      showToast({
        title: 'Onboarding Complete!',
        description: 'Your school academic workspace is now active and ready for daily operations.',
        variant: 'success',
      });
      navigate('/admin');
    },
    onError: (err: Error) => {
      showToast({
        title: 'Completion Blocked',
        description:
          err.message || 'Please complete the required academic configuration before launching.',
        variant: 'danger',
      });
    },
  });

  const currentStepIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.key === activeStep),
  );
  const currentStepMeta: StepMeta = STEPS[currentStepIndex] ?? STEPS[0]!;

  const goToNextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      const nextStep = STEPS[currentStepIndex + 1]?.key ?? 'summary';
      setActiveStep(nextStep);
      saveProgressMutation.mutate(nextStep);
    }
  };

  const goToPrevStep = () => {
    if (currentStepIndex > 0) {
      const prevStep = STEPS[currentStepIndex - 1]?.key ?? 'profile';
      setActiveStep(prevStep);
      saveProgressMutation.mutate(prevStep);
    }
  };

  if (isLoading) {
    return (
      <AppShell
        title="School Onboarding & Setup"
        breadcrumbs={[{ label: 'School Administrator', to: '/admin' }, { label: 'Setup Wizard' }]}
      >
        <div aria-label="Loading onboarding wizard" className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <Skeleton className="h-96 w-full lg:col-span-1" />
            <Skeleton className="h-96 w-full lg:col-span-3" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (isError || !onboarding) {
    return (
      <AppShell
        title="School Onboarding & Setup"
        breadcrumbs={[{ label: 'School Administrator', to: '/admin' }, { label: 'Setup Wizard' }]}
      >
        <ErrorState
          title="Failed to Load Setup State"
          description={
            error instanceof Error ? error.message : 'Unable to connect to school setup service.'
          }
          onRetry={() => void refetch()}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="School Onboarding & Setup"
      breadcrumbs={[{ label: 'School Administrator', to: '/admin' }, { label: 'Setup Wizard' }]}
    >
      <div className="space-y-6">
        {/* Header Banner with Progress Meter */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Heading level={1} size="h2">
                  Initial School Setup Guide
                </Heading>
                <Badge variant={onboarding.isComplete ? 'success' : 'brand'}>
                  {onboarding.completionPercentage}% Configured
                </Badge>
              </div>
              <Text variant="small" className="mt-1 text-muted-foreground">
                Institutional setup for <strong>{onboarding.schoolName}</strong>. Configure your
                academic structure, faculty, and student cohorts.
              </Text>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveProgressMutation.mutate(activeStep)}
                disabled={saveProgressMutation.isPending}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Save Progress
              </Button>
              <Link to="/admin">
                <Button variant="ghost" size="sm">
                  Exit to Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Accessible Progress Bar */}
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>
                Setup Progress ({onboarding.completedSteps.length} of {STEPS.length - 1} sections
                ready)
              </span>
              <span>{onboarding.completionPercentage}%</span>
            </div>
            <div
              role="progressbar"
              aria-label="School onboarding setup completion"
              aria-valuenow={onboarding.completionPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
            >
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${onboarding.completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Wizard Main Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Step Navigation Sidebar */}
          <nav
            aria-label="Onboarding Steps"
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm lg:col-span-1"
          >
            <h2 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Setup Steps
            </h2>
            <ul className="mt-3 space-y-1">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isCurrent = step.key === activeStep;
                const isStepCompleted = onboarding.completedSteps.includes(step.key);

                return (
                  <li key={step.key}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStep(step.key);
                        saveProgressMutation.mutate(step.key);
                      }}
                      className={`flex w-full items-center justify-between rounded-[var(--radius-md)] px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                        isCurrent ? 'bg-primary text-white' : 'text-foreground hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`h-4 w-4 ${isCurrent ? 'text-white' : 'text-muted-foreground'}`}
                        />
                        <span>
                          {idx + 1}. {step.label}
                        </span>
                      </div>
                      {isStepCompleted ? (
                        <CheckCircle2
                          className={`h-4 w-4 ${isCurrent ? 'text-white' : 'text-emerald-600'}`}
                          aria-label="Completed"
                        />
                      ) : (
                        <Circle
                          className={`h-3 w-3 ${isCurrent ? 'text-white/60' : 'text-slate-300'}`}
                          aria-label="Pending"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Active Step Panel */}
          <main className="space-y-6 lg:col-span-3">
            <Card className="p-6">
              {/* Step Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {currentStepIndex + 1}
                    </span>
                    <Heading level={2} size="h3">
                      {currentStepMeta.label}
                    </Heading>
                    {onboarding.completedSteps.includes(activeStep) && (
                      <Badge variant="success">Completed</Badge>
                    )}
                  </div>
                  <Text variant="small" className="mt-1 text-muted-foreground">
                    {currentStepMeta.description}
                  </Text>
                </div>
              </div>

              {/* Step Body */}
              <div className="pt-6">
                {activeStep === 'profile' && (
                  <StepSchoolProfile
                    profile={onboarding.steps.profile}
                    onUpdated={() =>
                      void queryClient.invalidateQueries({
                        queryKey: ['school-admin', 'onboarding'],
                      })
                    }
                  />
                )}

                {activeStep === 'academic-year' && (
                  <StepAcademicYear
                    academicYears={academicYears}
                    onChanged={() => {
                      void queryClient.invalidateQueries({
                        queryKey: ['school-admin', 'academic-years'],
                      });
                      void queryClient.invalidateQueries({
                        queryKey: ['school-admin', 'onboarding'],
                      });
                    }}
                  />
                )}

                {activeStep === 'classes-sections' && (
                  <StepClassesSections
                    classes={classes}
                    academicYears={academicYears}
                    onChanged={() => {
                      void queryClient.invalidateQueries({
                        queryKey: ['school-admin', 'classes'],
                      });
                      void queryClient.invalidateQueries({
                        queryKey: ['school-admin', 'onboarding'],
                      });
                    }}
                  />
                )}

                {activeStep === 'subjects' && (
                  <StepSubjects
                    subjects={subjects}
                    onChanged={() => {
                      void queryClient.invalidateQueries({
                        queryKey: ['school-admin', 'subjects'],
                      });
                      void queryClient.invalidateQueries({
                        queryKey: ['school-admin', 'onboarding'],
                      });
                    }}
                  />
                )}

                {activeStep === 'teachers' && (
                  <StepTeachers
                    staffMembers={staffList}
                    onChanged={() => {
                      void queryClient.invalidateQueries({
                        queryKey: ['school-admin', 'staff'],
                      });
                      void queryClient.invalidateQueries({
                        queryKey: ['school-admin', 'onboarding'],
                      });
                    }}
                  />
                )}

                {activeStep === 'students' && (
                  <StepStudents
                    students={studentList}
                    classes={classes}
                    onChanged={() => {
                      void queryClient.invalidateQueries({
                        queryKey: ['school-admin', 'students'],
                      });
                      void queryClient.invalidateQueries({
                        queryKey: ['school-admin', 'onboarding'],
                      });
                    }}
                  />
                )}

                {activeStep === 'parents' && (
                  <StepParents
                    students={studentList}
                    onChanged={() => {
                      void queryClient.invalidateQueries({
                        queryKey: ['school-admin', 'onboarding'],
                      });
                    }}
                  />
                )}

                {activeStep === 'summary' && (
                  <StepSummary
                    onboarding={onboarding}
                    isCompleting={completeMutation.isPending}
                    onComplete={() => completeMutation.mutate()}
                  />
                )}
              </div>

              {/* Navigation Footer */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-border)] pt-4">
                <Button
                  variant="outline"
                  onClick={goToPrevStep}
                  disabled={currentStepIndex === 0}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Previous Step
                </Button>

                <div className="flex items-center gap-3">
                  {activeStep !== 'summary' ? (
                    <Button
                      variant="primary"
                      onClick={goToNextStep}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Continue to Next Step
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => completeMutation.mutate()}
                      disabled={completeMutation.isPending}
                      rightIcon={<CheckCircle2 className="h-4 w-4" />}
                    >
                      {completeMutation.isPending
                        ? 'Finalizing Setup...'
                        : 'Complete Setup & Launch Dashboard'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </main>
        </div>
      </div>
    </AppShell>
  );
}

// ============================================================================
// STEP 1: SCHOOL PROFILE
// ============================================================================
function StepSchoolProfile({
  profile,
  onUpdated,
}: {
  profile: { name: string; code: string; subdomain: string; contactEmail: string; status: string };
  onUpdated: () => void;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState(profile.name);
  const [contactEmail, setContactEmail] = useState(profile.contactEmail);
  const [isEditing, setIsEditing] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      updateSchoolSettingsRequest({ name: name.trim(), contactEmail: contactEmail.trim() }),
    onSuccess: () => {
      showToast({
        title: 'Profile Updated',
        description: 'School profile details saved successfully.',
        variant: 'success',
      });
      setIsEditing(false);
      onUpdated();
    },
    onError: (err: Error) => {
      showToast({ title: 'Update Failed', description: err.message, variant: 'danger' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4">
          <Text variant="small" className="font-medium text-slate-500">
            School Code
          </Text>
          <Text className="mt-1 font-mono font-bold text-slate-900">{profile.code}</Text>
        </div>
        <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4">
          <Text variant="small" className="font-medium text-slate-500">
            Subdomain
          </Text>
          <Text className="mt-1 font-mono font-bold text-slate-900">
            {profile.subdomain}.platform.edu
          </Text>
        </div>
        <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4">
          <Text variant="small" className="font-medium text-slate-500">
            Tenant Status
          </Text>
          <div className="mt-1">
            <Badge variant="success">{profile.status}</Badge>
          </div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4">
          <Text variant="small" className="font-medium text-slate-500">
            Isolation Layer
          </Text>
          <Text className="mt-1 font-semibold text-emerald-800">Verified Active</Text>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
      >
        <Heading level={3} size="h4">
          Institutional Information
        </Heading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Official School Name" required>
            {(props) => (
              <Input
                {...props}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing}
                required
              />
            )}
          </FormField>
          <FormField label="Administrative Contact Email" required>
            {(props) => (
              <Input
                {...props}
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                disabled={!isEditing}
                required
              />
            )}
          </FormField>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" type="button" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" type="button" onClick={() => setIsEditing(true)}>
              Edit Profile Info
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// STEP 2: ACADEMIC YEAR
// ============================================================================
function StepAcademicYear({
  academicYears,
  onChanged,
}: {
  academicYears: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  }>;
  onChanged: () => void;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const createMutation = useMutation({
    mutationFn: () => createAcademicYearRequest({ name: name.trim(), startDate, endDate }),
    onSuccess: () => {
      showToast({
        title: 'Academic Year Added',
        description: 'Calendar year configured.',
        variant: 'success',
      });
      setName('');
      setStartDate('');
      setEndDate('');
      onChanged();
    },
    onError: (err: Error) =>
      showToast({ title: 'Error', description: err.message, variant: 'danger' }),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => activateAcademicYearRequest(id),
    onSuccess: () => {
      showToast({
        title: 'Active Year Set',
        description: 'Academic year marked active.',
        variant: 'success',
      });
      onChanged();
    },
  });

  return (
    <div className="space-y-6">
      {/* Existing Academic Years List */}
      <div>
        <Heading level={3} size="h4" className="mb-3">
          Configured Academic Years
        </Heading>
        {academicYears.length === 0 ? (
          <EmptyState
            title="No Academic Years Configured"
            description="Create your school's current academic year below to activate scheduling and section enrollments."
          />
        ) : (
          <div className="space-y-2">
            {academicYears.map((year) => (
              <div
                key={year.id}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-slate-200 bg-white p-3 shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{year.name}</span>
                    <Badge variant={year.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {year.status}
                    </Badge>
                  </div>
                  <Text variant="small" className="text-slate-500">
                    {year.startDate} to {year.endDate}
                  </Text>
                </div>
                {year.status !== 'ACTIVE' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => activateMutation.mutate(year.id)}
                    disabled={activateMutation.isPending}
                  >
                    Set as Active
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Year Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
        className="space-y-4 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4"
      >
        <Heading level={4} size="h4">
          Add Academic Year
        </Heading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Year Name (e.g. 2026-2027)" required>
            {(props) => (
              <Input
                {...props}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="2026-2027 Academic Year"
                required
              />
            )}
          </FormField>
          <FormField label="Start Date" required>
            {(props) => (
              <Input
                {...props}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            )}
          </FormField>
          <FormField label="End Date" required>
            {(props) => (
              <Input
                {...props}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            )}
          </FormField>
        </div>
        <div className="flex justify-end">
          <Button variant="primary" size="sm" type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Academic Year'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// STEP 3: CLASSES AND SECTIONS
// ============================================================================
function StepClassesSections({
  classes,
  academicYears,
  onChanged,
}: {
  classes: Array<{
    id: string;
    name: string;
    stage: string;
    sections: Array<{ id: string; name: string }>;
  }>;
  academicYears: Array<{ id: string; name: string; status: string }>;
  onChanged: () => void;
}) {
  const { showToast } = useToast();
  const [className, setClassName] = useState('');
  const [stage, setStage] = useState('SECONDARY');

  // Section fields
  const [selectedClassId, setSelectedClassId] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [sectionYearId, setSectionYearId] = useState(
    academicYears.find((y) => y.status === 'ACTIVE')?.id ?? academicYears[0]?.id ?? '',
  );

  const createClassMutation = useMutation({
    mutationFn: () => createClassRequest({ name: className.trim(), stage, sortOrder: 0 }),
    onSuccess: () => {
      showToast({
        title: 'Class Created',
        description: 'Grade/Class stream added.',
        variant: 'success',
      });
      setClassName('');
      onChanged();
    },
    onError: (err: Error) =>
      showToast({ title: 'Error', description: err.message, variant: 'danger' }),
  });

  const createSectionMutation = useMutation({
    mutationFn: () =>
      createSectionRequest({
        classId: selectedClassId,
        name: sectionName.trim(),
        academicYearId: sectionYearId,
      }),
    onSuccess: () => {
      showToast({
        title: 'Section Created',
        description: 'Section added to class.',
        variant: 'success',
      });
      setSectionName('');
      onChanged();
    },
    onError: (err: Error) =>
      showToast({ title: 'Error', description: err.message, variant: 'danger' }),
  });

  return (
    <div className="space-y-6">
      {/* Existing Classes and Sections */}
      <div>
        <Heading level={3} size="h4" className="mb-3">
          Current Classes &amp; Sections
        </Heading>
        {classes.length === 0 ? (
          <EmptyState
            title="No Classes Configured"
            description="Create class grade levels and assign sections below."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {classes.map((c) => (
              <div
                key={c.id}
                className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{c.name}</span>
                  <Badge variant="neutral">{c.stage}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.sections.length === 0 ? (
                    <span className="text-xs text-slate-400">No sections yet</span>
                  ) : (
                    c.sections.map((s) => (
                      <Badge key={s.id} variant="brand" className="text-xs">
                        Section {s.name}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creation Forms Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Add Class */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createClassMutation.mutate();
          }}
          className="space-y-3 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4"
        >
          <Heading level={4} size="h4">
            1. Add Class / Grade
          </Heading>
          <FormField label="Class Name" required>
            {(props) => (
              <Input
                {...props}
                placeholder="e.g. Grade 9, Year 10"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
              />
            )}
          </FormField>
          <FormField label="Education Stage" required>
            {(props) => (
              <Select
                {...props}
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                options={[
                  { value: 'PRIMARY', label: 'Primary / Elementary' },
                  { value: 'MIDDLE', label: 'Middle School' },
                  { value: 'SECONDARY', label: 'Secondary / High School' },
                  { value: 'HIGHER_SECONDARY', label: 'Higher Secondary' },
                ]}
              />
            )}
          </FormField>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={createClassMutation.isPending || !className.trim()}
          >
            Create Class
          </Button>
        </form>

        {/* Add Section */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createSectionMutation.mutate();
          }}
          className="space-y-3 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4"
        >
          <Heading level={4} size="h4">
            2. Add Section to Class
          </Heading>
          <FormField label="Target Class" required>
            {(props) => (
              <Select
                {...props}
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                options={[
                  { value: '', label: '-- Select a Class --' },
                  ...classes.map((c) => ({ value: c.id, label: c.name })),
                ]}
                required
              />
            )}
          </FormField>
          <FormField label="Section Name" required>
            {(props) => (
              <Input
                {...props}
                placeholder="e.g. A, B, Blue, Red"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                required
              />
            )}
          </FormField>
          <FormField label="Academic Year" required>
            {(props) => (
              <Select
                {...props}
                value={sectionYearId}
                onChange={(e) => setSectionYearId(e.target.value)}
                options={academicYears.map((y) => ({
                  value: y.id,
                  label: `${y.name} (${y.status})`,
                }))}
                required
              />
            )}
          </FormField>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={createSectionMutation.isPending || !selectedClassId || !sectionYearId}
          >
            Create Section
          </Button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 4: SUBJECTS
// ============================================================================
function StepSubjects({
  subjects,
  onChanged,
}: {
  subjects: Array<{ id: string; name: string; code: string; description?: string | null }>;
  onChanged: () => void;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      createSubjectRequest({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      showToast({
        title: 'Subject Created',
        description: 'Curriculum subject added.',
        variant: 'success',
      });
      setName('');
      setCode('');
      setDescription('');
      onChanged();
    },
    onError: (err: Error) =>
      showToast({ title: 'Error', description: err.message, variant: 'danger' }),
  });

  return (
    <div className="space-y-6">
      {/* Existing Subjects */}
      <div>
        <Heading level={3} size="h4" className="mb-3">
          Curriculum Subjects
        </Heading>
        {subjects.length === 0 ? (
          <EmptyState
            title="No Subjects Configured"
            description="Add foundational courses (e.g. Mathematics, Sciences, English, Social Studies) below."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-3 shadow-xs"
              >
                <span className="font-semibold text-slate-900">{sub.name}</span>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono">{sub.code}</span>
                  <span>{sub.description ?? 'Curriculum course'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Subject Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
        className="space-y-3 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4"
      >
        <Heading level={4} size="h4">
          Add New Subject
        </Heading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Subject Name" required>
            {(props) => (
              <Input
                {...props}
                placeholder="e.g. Mathematics"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
          </FormField>
          <FormField label="Subject Code" required>
            {(props) => (
              <Input
                {...props}
                placeholder="e.g. MATH-101"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            )}
          </FormField>
          <FormField label="Description (Optional)">
            {(props) => (
              <Input
                {...props}
                placeholder="e.g. Algebra & Trigonometry"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            )}
          </FormField>
        </div>
        <div className="flex justify-end">
          <Button variant="primary" size="sm" type="submit" disabled={createMutation.isPending}>
            Add Subject
          </Button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// STEP 5: TEACHERS
// ============================================================================
function StepTeachers({
  staffMembers,
  onChanged,
}: {
  staffMembers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    specialization?: string | null;
  }>;
  onChanged: () => void;
}) {
  const { showToast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [specialization, setSpecialization] = useState('');

  const inviteMutation = useMutation({
    mutationFn: () =>
      inviteSchoolUserRequest({
        role: 'TEACHER',
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        employeeId: employeeId.trim() || undefined,
        specialization: specialization.trim() || undefined,
      }),
    onSuccess: () => {
      showToast({
        title: 'Teacher Invited',
        description:
          'An invitation email has been dispatched via the official mail delivery service.',
        variant: 'success',
      });
      setFirstName('');
      setLastName('');
      setEmail('');
      setEmployeeId('');
      setSpecialization('');
      onChanged();
    },
    onError: (err: Error) =>
      showToast({ title: 'Error', description: err.message, variant: 'danger' }),
  });

  return (
    <div className="space-y-6">
      {/* Existing Teachers */}
      <div>
        <Heading level={3} size="h4" className="mb-3">
          Registered Faculty
        </Heading>
        {staffMembers.length === 0 ? (
          <EmptyState
            title="No Teachers Registered Yet"
            description="Invite faculty members using the invitation dispatch form below."
          />
        ) : (
          <div className="space-y-2">
            {staffMembers.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-slate-200 bg-white p-3 shadow-xs"
              >
                <div>
                  <span className="font-semibold text-slate-900">
                    {t.firstName} {t.lastName}
                  </span>
                  <div className="text-xs text-slate-500">
                    {t.email} {t.specialization ? `· ${t.specialization}` : ''}
                  </div>
                </div>
                <Badge variant="success">Active Faculty</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Teacher Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          inviteMutation.mutate();
        }}
        className="space-y-3 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4"
      >
        <Heading level={4} size="h4">
          Invite Teacher / Faculty Member
        </Heading>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="First Name" required>
            {(props) => (
              <Input
                {...props}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            )}
          </FormField>
          <FormField label="Last Name" required>
            {(props) => (
              <Input
                {...props}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            )}
          </FormField>
          <FormField label="Email Address" required>
            {(props) => (
              <Input
                {...props}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            )}
          </FormField>
          <FormField label="Employee ID (Optional)">
            {(props) => (
              <Input
                {...props}
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            )}
          </FormField>
          <FormField label="Specialization / Subject (Optional)" className="sm:col-span-2">
            {(props) => (
              <Input
                {...props}
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
              />
            )}
          </FormField>
        </div>
        <div className="flex justify-end">
          <Button variant="primary" size="sm" type="submit" disabled={inviteMutation.isPending}>
            {inviteMutation.isPending ? 'Sending Invitation...' : 'Send Invitation Email'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// STEP 6: STUDENTS
// ============================================================================
function StepStudents({
  students,
  classes,
  onChanged,
}: {
  students: Array<{
    id: string;
    firstName: string;
    lastName: string;
    studentIdNumber: string;
    currentSection?: string | null;
  }>;
  classes: Array<{ id: string; name: string; sections: Array<{ id: string; name: string }> }>;
  onChanged: () => void;
}) {
  const { showToast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [studentIdNumber, setStudentIdNumber] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().slice(0, 10));

  const allSections = classes.flatMap((c) =>
    c.sections.map((s) => ({ value: s.id, label: `${c.name} - Section ${s.name}` })),
  );

  const createMutation = useMutation({
    mutationFn: () =>
      createStudentRequest({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        studentIdNumber: studentIdNumber.trim(),
        admissionDate,
        sectionId: sectionId || undefined,
        temporaryPassword: 'InitialPass!123',
      }),
    onSuccess: () => {
      showToast({
        title: 'Student Enrolled',
        description: 'Student registered in school.',
        variant: 'success',
      });
      setFirstName('');
      setLastName('');
      setEmail('');
      setStudentIdNumber('');
      onChanged();
    },
    onError: (err: Error) =>
      showToast({ title: 'Error', description: err.message, variant: 'danger' }),
  });

  return (
    <div className="space-y-6">
      {/* Existing Students */}
      <div>
        <Heading level={3} size="h4" className="mb-3">
          Enrolled Students
        </Heading>
        {students.length === 0 ? (
          <EmptyState
            title="No Students Registered"
            description="Register your first cohort of students using the form below."
          />
        ) : (
          <div className="space-y-2">
            {students.slice(0, 5).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-slate-200 bg-white p-3 shadow-xs"
              >
                <div>
                  <span className="font-semibold text-slate-900">
                    {s.firstName} {s.lastName}
                  </span>
                  <div className="text-xs text-slate-500">
                    ID: {s.studentIdNumber} · {s.currentSection ?? 'Unassigned Section'}
                  </div>
                </div>
                <Badge variant="success">Enrolled</Badge>
              </div>
            ))}
            {students.length > 5 && (
              <div className="text-center text-xs text-slate-500">
                + {students.length - 5} more students registered
              </div>
            )}
          </div>
        )}
      </div>

      {/* Register Student Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
        className="space-y-3 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4"
      >
        <Heading level={4} size="h4">
          Enroll Student
        </Heading>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="First Name" required>
            {(props) => (
              <Input
                {...props}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            )}
          </FormField>
          <FormField label="Last Name" required>
            {(props) => (
              <Input
                {...props}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            )}
          </FormField>
          <FormField label="Student Email" required>
            {(props) => (
              <Input
                {...props}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            )}
          </FormField>
          <FormField label="Student ID Number" required>
            {(props) => (
              <Input
                {...props}
                value={studentIdNumber}
                onChange={(e) => setStudentIdNumber(e.target.value)}
                required
              />
            )}
          </FormField>
          <FormField label="Admission Date" required>
            {(props) => (
              <Input
                {...props}
                type="date"
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                required
              />
            )}
          </FormField>
          <FormField label="Class Section (Optional)">
            {(props) => (
              <Select
                {...props}
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                options={[{ value: '', label: '-- Select Section (Optional) --' }, ...allSections]}
              />
            )}
          </FormField>
        </div>
        <div className="flex justify-end">
          <Button variant="primary" size="sm" type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Enrolling...' : 'Enroll Student'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// STEP 7: PARENTS & GUARDIANS
// ============================================================================
function StepParents({
  students,
  onChanged,
}: {
  students: Array<{ id: string; firstName: string; lastName: string; studentIdNumber: string }>;
  onChanged: () => void;
}) {
  const { showToast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [studentId, setStudentId] = useState('');

  const inviteMutation = useMutation({
    mutationFn: () =>
      inviteSchoolUserRequest({
        role: 'PARENT',
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        studentId: studentId || undefined,
      }),
    onSuccess: () => {
      showToast({
        title: 'Guardian Invited',
        description: 'Invitation sent and student relationship linked.',
        variant: 'success',
      });
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setStudentId('');
      onChanged();
    },
    onError: (err: Error) =>
      showToast({ title: 'Error', description: err.message, variant: 'danger' }),
  });

  return (
    <div className="space-y-6">
      <Alert variant="info" title="Zero Trust Guardian Links">
        Parent and guardian invitations require linking to an enrolled student profile. This
        establishes authorized access boundaries for student grades, attendance, and progress
        records.
      </Alert>

      {/* Invite Guardian Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          inviteMutation.mutate();
        }}
        className="space-y-3 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4"
      >
        <Heading level={4} size="h4">
          Invite Parent / Guardian
        </Heading>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Guardian First Name" required>
            {(props) => (
              <Input
                {...props}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            )}
          </FormField>
          <FormField label="Guardian Last Name" required>
            {(props) => (
              <Input
                {...props}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            )}
          </FormField>
          <FormField label="Guardian Email" required>
            {(props) => (
              <Input
                {...props}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            )}
          </FormField>
          <FormField label="Phone Number (Optional)">
            {(props) => (
              <Input {...props} value={phone} onChange={(e) => setPhone(e.target.value)} />
            )}
          </FormField>
          <FormField label="Linked Student" className="sm:col-span-2" required>
            {(props) => (
              <Select
                {...props}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                options={[
                  { value: '', label: '-- Select Enrolled Student --' },
                  ...students.map((s) => ({
                    value: s.id,
                    label: `${s.firstName} ${s.lastName} (${s.studentIdNumber})`,
                  })),
                ]}
                required
              />
            )}
          </FormField>
        </div>
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={inviteMutation.isPending || !studentId}
          >
            {inviteMutation.isPending ? 'Sending...' : 'Invite Guardian & Link Student'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// STEP 8: SETUP SUMMARY
// ============================================================================
function StepSummary({
  onboarding,
  isCompleting,
  onComplete,
}: {
  onboarding: {
    schoolName: string;
    completionPercentage: number;
    summary: {
      totalStudents: number;
      totalTeachers: number;
      totalClasses: number;
      totalSections: number;
      totalSubjects: number;
      hasActiveYear: boolean;
    };
    steps: {
      profile: { isComplete: boolean };
      academicYear: { isComplete: boolean };
      classesSections: { isComplete: boolean };
      subjects: { isComplete: boolean };
      teachers: { isComplete: boolean };
      students: { isComplete: boolean };
      parents: { isComplete: boolean };
    };
  };
  isCompleting: boolean;
  onComplete: () => void;
}) {
  const allReady =
    onboarding.steps.academicYear.isComplete && onboarding.steps.classesSections.isComplete;

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius-lg)] border border-emerald-200 bg-emerald-50 p-6 text-emerald-950">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-emerald-600" />
          <div>
            <Heading level={3} size="h3" className="text-emerald-900">
              Institutional Setup Summary
            </Heading>
            <Text variant="small" className="text-emerald-800">
              Review configuration metrics below before finalizing onboarding for{' '}
              {onboarding.schoolName}.
            </Text>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-4 text-center">
          <Text variant="small" className="text-slate-500">
            Academic Year
          </Text>
          <Text className="mt-1 font-bold text-slate-900">
            {onboarding.summary.hasActiveYear ? 'Active' : 'Missing'}
          </Text>
        </div>
        <div className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-4 text-center">
          <Text variant="small" className="text-slate-500">
            Classes
          </Text>
          <Text className="mt-1 font-bold text-slate-900">{onboarding.summary.totalClasses}</Text>
        </div>
        <div className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-4 text-center">
          <Text variant="small" className="text-slate-500">
            Sections
          </Text>
          <Text className="mt-1 font-bold text-slate-900">{onboarding.summary.totalSections}</Text>
        </div>
        <div className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-4 text-center">
          <Text variant="small" className="text-slate-500">
            Subjects
          </Text>
          <Text className="mt-1 font-bold text-slate-900">{onboarding.summary.totalSubjects}</Text>
        </div>
        <div className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-4 text-center">
          <Text variant="small" className="text-slate-500">
            Teachers
          </Text>
          <Text className="mt-1 font-bold text-slate-900">{onboarding.summary.totalTeachers}</Text>
        </div>
        <div className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-4 text-center">
          <Text variant="small" className="text-slate-500">
            Students
          </Text>
          <Text className="mt-1 font-bold text-slate-900">{onboarding.summary.totalStudents}</Text>
        </div>
      </div>

      {!allReady && (
        <Alert variant="warning" title="Minimum Setup Required">
          At least one Academic Year and Class Section are required to complete onboarding. You can
          continue adding teachers, students, and parents at any time from the School Dashboard.
        </Alert>
      )}

      <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-6 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-primary" />
        <Heading level={4} size="h4" className="mt-2">
          Ready to Launch Your School Operations?
        </Heading>
        <Text variant="small" className="mx-auto mt-1 max-w-md text-slate-600">
          Completing onboarding marks your tenant as fully initialized and activates the School
          Administrator Dashboard with real-time analytics.
        </Text>
        <div className="mt-5">
          <Button
            variant="primary"
            size="lg"
            onClick={onComplete}
            disabled={isCompleting || !allReady}
            leftIcon={<CheckCircle2 className="h-5 w-5" />}
          >
            {isCompleting ? 'Finalizing Setup...' : 'Complete Onboarding & Enter Dashboard'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SchoolOnboardingPage;
