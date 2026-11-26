import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Badge,
  Button,
  DataTable,
  ErrorState,
  FormField,
  Heading,
  Input,
  Modal,
  Select,
  Text,
  useToast,
} from '@/components/ui';
import {
  createTeacherAssessment,
  fetchTeacherAssessments,
  fetchTeacherClasses,
} from './teacherApi';
import type { CreateTeacherAssessmentInput } from '@fsd-sdg4/validation';

export function TeacherGradesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  const assessmentsQuery = useQuery({
    queryKey: ['teacher', 'assessments'],
    queryFn: ({ signal }) => fetchTeacherAssessments(signal),
  });

  const classesQuery = useQuery({
    queryKey: ['teacher', 'classes'],
    queryFn: ({ signal }) => fetchTeacherClasses(signal),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{
    courseOfferingId: string;
    title: string;
    assessmentDate: string;
    weightPercentage: number;
    maxMarks: number;
  }>({
    defaultValues: {
      courseOfferingId: '',
      title: '',
      assessmentDate: new Date().toISOString().slice(0, 10),
      weightPercentage: 20,
      maxMarks: 100,
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateTeacherAssessmentInput) => createTeacherAssessment(values),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['teacher'] });
      showToast({
        title: 'Assessment Configured',
        description: `"${created.title}" scheduled for ${created.assessmentDate}.`,
        variant: 'success',
      });
      setModalOpen(false);
      reset();
    },
  });

  return (
    <AppShell
      title="Examinations & Grades"
      breadcrumbs={[
        { label: 'Faculty Portal', to: '/teacher' },
        { label: 'Examinations & Grades' },
      ]}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2" className="text-xl font-bold">
              Examinations &amp; Evaluation Center
            </Heading>
            <Text variant="small" className="text-[var(--color-text-muted)] mt-1">
              Configure curriculum examinations, record scores, and publish academic progress.
            </Text>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setModalOpen(true)}
          >
            Create Assessment
          </Button>
        </div>

        {assessmentsQuery.isError ? (
          <ErrorState
            title="Failed to load examinations"
            description="Could not fetch examination records."
            onRetry={() => void assessmentsQuery.refetch()}
          />
        ) : (
          <DataTable
            ariaLabel="Examinations list"
            loading={assessmentsQuery.isLoading}
            rows={assessmentsQuery.data ?? []}
            getRowKey={(r) => r.id}
            emptyTitle="No examinations configured"
            emptyDescription="Create an examination or quiz to track student academic scores."
            columns={[
              {
                key: 'title',
                header: 'Assessment Title',
                render: (r) => (
                  <div>
                    <p className="font-semibold text-sm text-[var(--color-text-primary)]">
                      {r.title}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {r.className} - {r.sectionName} &bull; {r.subjectName}
                    </p>
                  </div>
                ),
              },
              {
                key: 'date',
                header: 'Date',
                render: (r) => (
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                    {r.assessmentDate}
                  </span>
                ),
              },
              {
                key: 'weight',
                header: 'Term Weight',
                render: (r) => <Badge variant="brand">{r.weightPercentage}%</Badge>,
              },
              {
                key: 'maxMarks',
                header: 'Max Marks',
                render: (r) => (
                  <span className="font-mono text-xs font-semibold">{r.maxMarks}</span>
                ),
              },
              {
                key: 'recorded',
                header: 'Results Logged',
                render: (r) => (
                  <div className="text-xs">
                    <span className="font-semibold text-emerald-600">{r.recordedResultsCount}</span>{' '}
                    / <span>{r.totalEnrolledCount} students</span>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Configure New Examination / Assessment"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-assessment-form"
              variant="primary"
              loading={isSubmitting || createMutation.isPending}
            >
              Save Examination
            </Button>
          </>
        }
      >
        <form
          id="create-assessment-form"
          onSubmit={handleSubmit((data) =>
            createMutation.mutate(data as CreateTeacherAssessmentInput),
          )}
          className="space-y-4"
        >
          <FormField label="Class & Subject" error={errors.courseOfferingId?.message} required>
            {(props) => (
              <Select
                {...props}
                {...register('courseOfferingId', { required: 'Please select an offering' })}
                options={[
                  { value: '', label: 'Select assigned course offering...' },
                  ...(classesQuery.data?.map((c) => ({
                    value: c.courseOfferingId,
                    label: `${c.className} - ${c.sectionName} : ${c.subjectName}`,
                  })) ?? []),
                ]}
              />
            )}
          </FormField>

          <FormField label="Assessment Title" error={errors.title?.message} required>
            {(props) => (
              <Input
                {...props}
                {...register('title', { required: 'Title is required' })}
                placeholder="e.g. Mid-Term Assessment: Algebra & Number Theory"
              />
            )}
          </FormField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FormField label="Exam Date" error={errors.assessmentDate?.message} required>
              {(props) => (
                <Input
                  {...props}
                  type="date"
                  {...register('assessmentDate', { required: 'Date is required' })}
                />
              )}
            </FormField>

            <FormField label="Weight (%)" error={errors.weightPercentage?.message} required>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  {...register('weightPercentage', { valueAsNumber: true })}
                />
              )}
            </FormField>

            <FormField label="Max Marks" error={errors.maxMarks?.message} required>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  {...register('maxMarks', { valueAsNumber: true })}
                />
              )}
            </FormField>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

export default TeacherGradesPage;
