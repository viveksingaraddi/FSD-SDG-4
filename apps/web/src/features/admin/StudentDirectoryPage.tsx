import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createStudentSchema, type CreateStudentInput } from '@fsd-sdg4/validation';
import { UserPlus } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Alert,
  Badge,
  Button,
  DataTable,
  ErrorState,
  FormField,
  Heading,
  Input,
  Modal,
  PasswordInput,
  SearchInput,
  Select,
  Text,
  useToast,
} from '@/components/ui';
import { ApiClientError } from '@/lib/apiClient';
import { createZodResolver } from '@/lib/zodResolver';
import { createStudentRequest, fetchClasses, fetchStudents } from './schoolAdminApi';

export function StudentDirectoryPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const studentsQuery = useQuery({
    queryKey: ['school-admin', 'students', search],
    queryFn: ({ signal }) => fetchStudents(search, signal),
  });

  const classesQuery = useQuery({
    queryKey: ['school-admin', 'classes'],
    queryFn: ({ signal }) => fetchClasses(signal),
  });

  const sectionOptions = (classesQuery.data ?? []).flatMap((cls) =>
    cls.sections.map((sec) => ({
      value: sec.id,
      label: `${cls.name} — ${sec.name} (${sec.academicYearName})`,
    })),
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateStudentInput>({
    resolver: createZodResolver(createStudentSchema),
    defaultValues: {
      email: '',
      studentIdNumber: '',
      firstName: '',
      lastName: '',
      admissionDate: new Date().toISOString().slice(0, 10),
      temporaryPassword: '',
      sectionId: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateStudentInput) =>
      createStudentRequest({
        ...values,
        ...(values.sectionId ? { sectionId: values.sectionId } : { sectionId: undefined }),
      }),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({
        title: 'Student registered',
        description: `${created.firstName} ${created.lastName} (${created.studentIdNumber}) added.`,
        variant: 'success',
      });
      setModalOpen(false);
      setFormError(null);
      reset();
    },
    onError: (err) => {
      setFormError(err instanceof ApiClientError ? err.detail : 'Unable to register student.');
    },
  });

  return (
    <AppShell
      title="Students"
      breadcrumbs={[{ label: 'School Administrator', to: '/admin' }, { label: 'Students' }]}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2">
              Student Directory &amp; Intake
            </Heading>
            <Text variant="small" className="mt-1">
              Register student admissions and assign them to active class sections.
            </Text>
          </div>
          <Button
            leftIcon={<UserPlus className="h-4 w-4" />}
            onClick={() => {
              setFormError(null);
              setModalOpen(true);
            }}
          >
            Register Student
          </Button>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          label="Search students"
          placeholder="Search by student name or ID..."
          className="max-w-md"
        />

        {studentsQuery.isError ? (
          <ErrorState
            title="Unable to load student directory"
            description="Failed to retrieve enrolled students."
            onRetry={() => void studentsQuery.refetch()}
          />
        ) : (
          <DataTable
            ariaLabel="Student directory"
            loading={studentsQuery.isLoading}
            rows={studentsQuery.data ?? []}
            getRowKey={(r) => r.id}
            emptyTitle="No students registered in directory"
            emptyDescription="Register a student admission to begin tracking enrollment."
            columns={[
              {
                key: 'name',
                header: 'Student',
                render: (r) => (
                  <div>
                    <p className="font-semibold">
                      {r.firstName} {r.lastName}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">{r.email}</p>
                  </div>
                ),
              },
              { key: 'idNum', header: 'Student ID', render: (r) => r.studentIdNumber },
              {
                key: 'section',
                header: 'Current Section',
                render: (r) => r.currentSection ?? 'Unassigned',
              },
              {
                key: 'status',
                header: 'Status',
                render: (r) => (
                  <Badge variant={r.status === 'ACTIVE' ? 'success' : 'neutral'}>{r.status}</Badge>
                ),
              },
            ]}
          />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Register Student Admission"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="student-form" loading={createMutation.isPending}>
              Register Student
            </Button>
          </>
        }
      >
        {formError && (
          <Alert variant="danger" className="mb-3">
            {formError}
          </Alert>
        )}
        <form
          id="student-form"
          onSubmit={handleSubmit((v) => createMutation.mutate(v))}
          className="space-y-3"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="First name" error={errors.firstName?.message} required>
              {(props) => (
                <Input {...props} {...register('firstName')} hasError={Boolean(errors.firstName)} />
              )}
            </FormField>
            <FormField label="Last name" error={errors.lastName?.message} required>
              {(props) => (
                <Input {...props} {...register('lastName')} hasError={Boolean(errors.lastName)} />
              )}
            </FormField>
          </div>
          <FormField label="Student email" error={errors.email?.message} required>
            {(props) => (
              <Input
                {...props}
                {...register('email')}
                type="email"
                hasError={Boolean(errors.email)}
              />
            )}
          </FormField>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Student ID" error={errors.studentIdNumber?.message} required>
              {(props) => (
                <Input
                  {...props}
                  {...register('studentIdNumber')}
                  hasError={Boolean(errors.studentIdNumber)}
                />
              )}
            </FormField>
            <FormField label="Admission date" error={errors.admissionDate?.message} required>
              {(props) => (
                <Input
                  {...props}
                  {...register('admissionDate')}
                  type="date"
                  hasError={Boolean(errors.admissionDate)}
                />
              )}
            </FormField>
          </div>
          <FormField label="Assign section (optional)" error={errors.sectionId?.message}>
            {(props) => (
              <Select
                {...props}
                {...register('sectionId', {
                  setValueAs: (val: string) => (val === '' ? undefined : val),
                })}
                options={[{ value: '', label: 'Leave unassigned' }, ...sectionOptions]}
              />
            )}
          </FormField>
          <FormField
            label="Temporary password"
            hint="Min 12 chars with uppercase, lowercase, digit, and symbol."
            error={errors.temporaryPassword?.message}
            required
          >
            {(props) => (
              <PasswordInput
                {...props}
                {...register('temporaryPassword')}
                hasError={Boolean(errors.temporaryPassword)}
              />
            )}
          </FormField>
        </form>
      </Modal>
    </AppShell>
  );
}

export default StudentDirectoryPage;
