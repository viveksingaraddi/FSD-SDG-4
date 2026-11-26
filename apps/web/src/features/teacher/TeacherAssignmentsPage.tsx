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
  createTeacherAssignment,
  fetchTeacherAssignments,
  fetchTeacherClasses,
} from './teacherApi';
import type { CreateTeacherAssignmentInput } from '@fsd-sdg4/validation';

export function TeacherAssignmentsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  const assignmentsQuery = useQuery({
    queryKey: ['teacher', 'assignments'],
    queryFn: ({ signal }) => fetchTeacherAssignments(signal),
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
    instructions: string;
    maxPoints: number;
    dueDate: string;
  }>({
    defaultValues: {
      courseOfferingId: '',
      title: '',
      instructions: '',
      maxPoints: 50,
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateTeacherAssignmentInput) => createTeacherAssignment(values),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['teacher'] });
      showToast({
        title: 'Assignment Created',
        description: `"${created.title}" has been published to student portals.`,
        variant: 'success',
      });
      setModalOpen(false);
      reset();
    },
  });

  return (
    <AppShell
      title="Assignments"
      breadcrumbs={[{ label: 'Faculty Portal', to: '/teacher' }, { label: 'Assignments' }]}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2" className="text-xl font-bold">
              Coursework &amp; Assignments
            </Heading>
            <Text variant="small" className="text-[var(--color-text-muted)] mt-1">
              Create homework sets, monitor submission counts, and evaluate student work.
            </Text>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setModalOpen(true)}
          >
            Create Assignment
          </Button>
        </div>

        {assignmentsQuery.isError ? (
          <ErrorState
            title="Failed to load assignments"
            description="Could not fetch coursework records."
            onRetry={() => void assignmentsQuery.refetch()}
          />
        ) : (
          <DataTable
            ariaLabel="Assignments list"
            loading={assignmentsQuery.isLoading}
            rows={assignmentsQuery.data ?? []}
            getRowKey={(r) => r.id}
            emptyTitle="No assignments created yet"
            emptyDescription="Create your first assignment to assign deliverables to your students."
            columns={[
              {
                key: 'title',
                header: 'Assignment Title',
                render: (r) => (
                  <div>
                    <p className="font-semibold text-sm text-[var(--color-text-primary)]">
                      {r.title}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] line-clamp-1">
                      {r.instructions}
                    </p>
                  </div>
                ),
              },
              {
                key: 'cohort',
                header: 'Class & Subject',
                render: (r) => (
                  <div>
                    <span className="font-medium text-xs text-[var(--color-text-primary)]">
                      {r.className} - {r.sectionName}
                    </span>
                    <p className="text-[11px] text-[var(--color-text-muted)]">{r.subjectName}</p>
                  </div>
                ),
              },
              {
                key: 'maxPoints',
                header: 'Max Points',
                render: (r) => (
                  <span className="font-mono text-xs font-semibold">{r.maxPoints} pts</span>
                ),
              },
              {
                key: 'submissions',
                header: 'Submissions',
                render: (r) => (
                  <div className="text-xs">
                    <span className="font-semibold text-emerald-600">{r.gradedSubmissions}</span> /{' '}
                    <span>{r.totalSubmissions} graded</span>
                  </div>
                ),
              },
              {
                key: 'dueDate',
                header: 'Due Date',
                render: (r) => (
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    {new Date(r.dueDate).toLocaleDateString()}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (r) => (
                  <Badge variant={r.status === 'PUBLISHED' ? 'success' : 'neutral'}>
                    {r.status}
                  </Badge>
                ),
              },
            ]}
          />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Course Assignment"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="assignment-create-form"
              variant="primary"
              loading={isSubmitting || createMutation.isPending}
            >
              Publish Assignment
            </Button>
          </>
        }
      >
        <form
          id="assignment-create-form"
          onSubmit={handleSubmit((data) =>
            createMutation.mutate(data as CreateTeacherAssignmentInput),
          )}
          className="space-y-4"
        >
          <FormField
            label="Assigned Cohort / Offering"
            error={errors.courseOfferingId?.message}
            required
          >
            {(props) => (
              <Select
                {...props}
                {...register('courseOfferingId', { required: 'Please select a course offering' })}
                options={[
                  { value: '', label: 'Select assigned class & subject...' },
                  ...(classesQuery.data?.map((c) => ({
                    value: c.courseOfferingId,
                    label: `${c.className} - ${c.sectionName} : ${c.subjectName} (${c.subjectCode})`,
                  })) ?? []),
                ]}
              />
            )}
          </FormField>

          <FormField label="Assignment Title" error={errors.title?.message} required>
            {(props) => (
              <Input
                {...props}
                {...register('title', { required: 'Title is required' })}
                placeholder="e.g. Chapter 5 Practice Worksheet"
              />
            )}
          </FormField>

          <FormField label="Instructions" error={errors.instructions?.message} required>
            {(props) => (
              <textarea
                {...props}
                {...register('instructions', { required: 'Instructions are required' })}
                rows={3}
                className="w-full rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand-primary)]"
                placeholder="Provide instructions and criteria..."
              />
            )}
          </FormField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Maximum Marks" error={errors.maxPoints?.message} required>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  {...register('maxPoints', { valueAsNumber: true })}
                />
              )}
            </FormField>

            <FormField label="Due Date" error={errors.dueDate?.message} required>
              {(props) => (
                <Input
                  {...props}
                  type="datetime-local"
                  {...register('dueDate', { required: 'Due date is required' })}
                />
              )}
            </FormField>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

export default TeacherAssignmentsPage;
