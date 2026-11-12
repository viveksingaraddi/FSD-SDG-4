import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAcademicYearSchema,
  createClassSchema,
  createSectionSchema,
  createSubjectSchema,
  type CreateAcademicYearInput,
  type CreateClassInput,
  type CreateSectionInput,
  type CreateSubjectInput,
} from '@fsd-sdg4/validation';
import type { AcademicYearDto } from '@fsd-sdg4/contracts';
import { Plus } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  ErrorState,
  FormField,
  Heading,
  Input,
  Modal,
  Select,
  Tabs,
  Text,
  useToast,
} from '@/components/ui';
import { ApiClientError } from '@/lib/apiClient';
import { createZodResolver } from '@/lib/zodResolver';
import {
  activateAcademicYearRequest,
  createAcademicYearRequest,
  createClassRequest,
  createSectionRequest,
  createSubjectRequest,
  fetchAcademicYears,
  fetchClasses,
  fetchSubjects,
} from './schoolAdminApi';

export function AcademicSetupPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('years');
  const [yearModalOpen, setYearModalOpen] = useState(false);
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [activateTarget, setActivateTarget] = useState<AcademicYearDto | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const yearsQuery = useQuery({
    queryKey: ['school-admin', 'academic-years'],
    queryFn: ({ signal }) => fetchAcademicYears(signal),
  });

  const classesQuery = useQuery({
    queryKey: ['school-admin', 'classes'],
    queryFn: ({ signal }) => fetchClasses(signal),
  });

  const subjectsQuery = useQuery({
    queryKey: ['school-admin', 'subjects'],
    queryFn: ({ signal }) => fetchSubjects(signal),
  });

  const yearForm = useForm<CreateAcademicYearInput>({
    resolver: createZodResolver(createAcademicYearSchema),
    defaultValues: { name: '', startDate: '', endDate: '' },
  });

  const classForm = useForm<CreateClassInput>({
    resolver: createZodResolver(createClassSchema),
    defaultValues: { name: '', stage: '', sortOrder: 0 },
  });

  const sectionForm = useForm<CreateSectionInput>({
    resolver: createZodResolver(createSectionSchema),
    defaultValues: { classId: '', academicYearId: '', name: '', capacity: 30, roomNumber: '' },
  });

  const subjectForm = useForm<CreateSubjectInput>({
    resolver: createZodResolver(createSubjectSchema),
    defaultValues: { name: '', code: '', description: '' },
  });

  const createYearMutation = useMutation({
    mutationFn: createAcademicYearRequest,
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({ title: 'Academic year created', description: created.name, variant: 'success' });
      setYearModalOpen(false);
      setModalError(null);
      yearForm.reset();
    },
    onError: (err) => {
      setModalError(err instanceof ApiClientError ? err.detail : 'Unable to create academic year.');
    },
  });

  const activateYearMutation = useMutation({
    mutationFn: activateAcademicYearRequest,
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({
        title: 'Active academic year updated',
        description: `${updated.name} is now Active.`,
        variant: 'success',
      });
      setActivateTarget(null);
    },
    onError: (err) => {
      showToast({
        title: 'Activation failed',
        description: err instanceof ApiClientError ? err.detail : 'Unable to activate term.',
        variant: 'danger',
      });
      setActivateTarget(null);
    },
  });

  const createClassMutation = useMutation({
    mutationFn: createClassRequest,
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({ title: 'Class created', description: created.name, variant: 'success' });
      setClassModalOpen(false);
      setModalError(null);
      classForm.reset();
    },
    onError: (err) => {
      setModalError(err instanceof ApiClientError ? err.detail : 'Unable to create class.');
    },
  });

  const createSectionMutation = useMutation({
    mutationFn: createSectionRequest,
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({ title: 'Section created', description: created.name, variant: 'success' });
      setSectionModalOpen(false);
      setModalError(null);
      sectionForm.reset();
    },
    onError: (err) => {
      setModalError(err instanceof ApiClientError ? err.detail : 'Unable to create section.');
    },
  });

  const createSubjectMutation = useMutation({
    mutationFn: createSubjectRequest,
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({
        title: 'Subject added to curriculum',
        description: `${created.code} — ${created.name}`,
        variant: 'success',
      });
      setSubjectModalOpen(false);
      setModalError(null);
      subjectForm.reset();
    },
    onError: (err) => {
      setModalError(err instanceof ApiClientError ? err.detail : 'Unable to add subject.');
    },
  });

  return (
    <AppShell
      title="Academic Setup"
      breadcrumbs={[{ label: 'School Administrator', to: '/admin' }, { label: 'Academic Setup' }]}
    >
      <div className="space-y-5">
        <div>
          <Heading level={2} size="h2">
            Academic Structure &amp; Curriculum
          </Heading>
          <Text variant="small" className="mt-1">
            Configure academic years, grade-level classes, sections, and curriculum subjects.
          </Text>
        </div>

        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          ariaLabel="Academic setup sections"
          items={[
            { id: 'years', label: 'Academic Years', badge: yearsQuery.data?.length },
            { id: 'classes', label: 'Classes & Sections', badge: classesQuery.data?.length },
            { id: 'subjects', label: 'Subjects', badge: subjectsQuery.data?.length },
          ]}
        />

        {activeTab === 'years' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setModalError(null);
                  setYearModalOpen(true);
                }}
              >
                New Academic Year
              </Button>
            </div>
            {yearsQuery.isError ? (
              <ErrorState
                description="Unable to load academic years."
                onRetry={() => void yearsQuery.refetch()}
              />
            ) : (
              <DataTable
                ariaLabel="Academic years"
                loading={yearsQuery.isLoading}
                rows={yearsQuery.data ?? []}
                getRowKey={(row) => row.id}
                emptyTitle="No academic years configured"
                emptyDescription="Create your first academic year to begin scheduling sections."
                columns={[
                  { key: 'name', header: 'Academic Year', render: (r) => r.name },
                  {
                    key: 'dates',
                    header: 'Term Window',
                    render: (r) => `${r.startDate} to ${r.endDate}`,
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (r) => (
                      <Badge variant={r.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {r.status}
                      </Badge>
                    ),
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    align: 'right',
                    render: (r) =>
                      r.status !== 'ACTIVE' ? (
                        <Button size="sm" variant="outline" onClick={() => setActivateTarget(r)}>
                          Set Active
                        </Button>
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)]">Current</span>
                      ),
                  },
                ]}
              />
            )}
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setModalError(null);
                  setSectionModalOpen(true);
                }}
                disabled={!classesQuery.data?.length || !yearsQuery.data?.length}
              >
                Add Section
              </Button>
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setModalError(null);
                  setClassModalOpen(true);
                }}
              >
                New Class
              </Button>
            </div>

            {classesQuery.isError ? (
              <ErrorState
                description="Unable to load classes."
                onRetry={() => void classesQuery.refetch()}
              />
            ) : (classesQuery.data ?? []).length === 0 && !classesQuery.isLoading ? (
              <Card>
                <Text variant="small">No classes configured yet. Add a grade level to start.</Text>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {(classesQuery.data ?? []).map((cls) => (
                  <Card key={cls.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <Heading level={3} size="h4">
                          {cls.name}
                        </Heading>
                        <Text variant="caption">{cls.stage}</Text>
                      </div>
                      <Badge variant="brand">{cls.sections.length} sections</Badge>
                    </div>
                    {cls.sections.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--color-border-default)] pt-3">
                        {cls.sections.map((sec) => (
                          <Badge key={sec.id} variant="neutral">
                            {sec.name} ({sec.academicYearName})
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setModalError(null);
                  setSubjectModalOpen(true);
                }}
              >
                Add Subject
              </Button>
            </div>
            {subjectsQuery.isError ? (
              <ErrorState
                description="Unable to load subjects."
                onRetry={() => void subjectsQuery.refetch()}
              />
            ) : (
              <DataTable
                ariaLabel="Curriculum subjects"
                loading={subjectsQuery.isLoading}
                rows={subjectsQuery.data ?? []}
                getRowKey={(r) => r.id}
                emptyTitle="No subjects added to curriculum"
                emptyDescription="Register subjects with institutional codes such as MATH-8."
                columns={[
                  {
                    key: 'code',
                    header: 'Code',
                    render: (r) => <Badge variant="brand">{r.code}</Badge>,
                  },
                  { key: 'name', header: 'Subject Name', render: (r) => r.name },
                  {
                    key: 'desc',
                    header: 'Description',
                    render: (r) => r.description ?? '—',
                  },
                ]}
              />
            )}
          </div>
        )}
      </div>

      {/* Create Academic Year Modal */}
      <Modal
        open={yearModalOpen}
        onClose={() => setYearModalOpen(false)}
        title="Create Academic Year"
        footer={
          <>
            <Button variant="outline" onClick={() => setYearModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="year-form" loading={createYearMutation.isPending}>
              Create Term
            </Button>
          </>
        }
      >
        {modalError && (
          <Alert variant="danger" className="mb-3">
            {modalError}
          </Alert>
        )}
        <form
          id="year-form"
          onSubmit={yearForm.handleSubmit((v) => createYearMutation.mutate(v))}
          className="space-y-4"
        >
          <FormField label="Term name" error={yearForm.formState.errors.name?.message} required>
            {(props) => (
              <Input
                {...props}
                {...yearForm.register('name')}
                placeholder="e.g. 2026-2027"
                hasError={Boolean(yearForm.formState.errors.name)}
              />
            )}
          </FormField>
          <FormField
            label="Start date (YYYY-MM-DD)"
            error={yearForm.formState.errors.startDate?.message}
            required
          >
            {(props) => (
              <Input
                {...props}
                {...yearForm.register('startDate')}
                type="date"
                hasError={Boolean(yearForm.formState.errors.startDate)}
              />
            )}
          </FormField>
          <FormField
            label="End date (YYYY-MM-DD)"
            error={yearForm.formState.errors.endDate?.message}
            required
          >
            {(props) => (
              <Input
                {...props}
                {...yearForm.register('endDate')}
                type="date"
                hasError={Boolean(yearForm.formState.errors.endDate)}
              />
            )}
          </FormField>
        </form>
      </Modal>

      {/* Create Class Modal */}
      <Modal
        open={classModalOpen}
        onClose={() => setClassModalOpen(false)}
        title="Create Class / Grade Level"
        footer={
          <>
            <Button variant="outline" onClick={() => setClassModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="class-form" loading={createClassMutation.isPending}>
              Save Class
            </Button>
          </>
        }
      >
        {modalError && (
          <Alert variant="danger" className="mb-3">
            {modalError}
          </Alert>
        )}
        <form
          id="class-form"
          onSubmit={classForm.handleSubmit((v) => createClassMutation.mutate(v))}
          className="space-y-4"
        >
          <FormField label="Class name" error={classForm.formState.errors.name?.message} required>
            {(props) => (
              <Input
                {...props}
                {...classForm.register('name')}
                placeholder="e.g. Grade 8"
                hasError={Boolean(classForm.formState.errors.name)}
              />
            )}
          </FormField>
          <FormField label="Stage" error={classForm.formState.errors.stage?.message} required>
            {(props) => (
              <Input
                {...props}
                {...classForm.register('stage')}
                placeholder="e.g. Middle School"
                hasError={Boolean(classForm.formState.errors.stage)}
              />
            )}
          </FormField>
        </form>
      </Modal>

      {/* Create Section Modal */}
      <Modal
        open={sectionModalOpen}
        onClose={() => setSectionModalOpen(false)}
        title="Create Class Section"
        footer={
          <>
            <Button variant="outline" onClick={() => setSectionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="section-form" loading={createSectionMutation.isPending}>
              Save Section
            </Button>
          </>
        }
      >
        {modalError && (
          <Alert variant="danger" className="mb-3">
            {modalError}
          </Alert>
        )}
        <form
          id="section-form"
          onSubmit={sectionForm.handleSubmit((v) => createSectionMutation.mutate(v))}
          className="space-y-4"
        >
          <FormField label="Class" error={sectionForm.formState.errors.classId?.message} required>
            {(props) => (
              <Select
                {...props}
                {...sectionForm.register('classId')}
                placeholder="Select class"
                options={(classesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
                hasError={Boolean(sectionForm.formState.errors.classId)}
              />
            )}
          </FormField>
          <FormField
            label="Academic year"
            error={sectionForm.formState.errors.academicYearId?.message}
            required
          >
            {(props) => (
              <Select
                {...props}
                {...sectionForm.register('academicYearId')}
                placeholder="Select academic year"
                options={(yearsQuery.data ?? []).map((y) => ({ value: y.id, label: y.name }))}
                hasError={Boolean(sectionForm.formState.errors.academicYearId)}
              />
            )}
          </FormField>
          <FormField
            label="Section name"
            error={sectionForm.formState.errors.name?.message}
            required
          >
            {(props) => (
              <Input
                {...props}
                {...sectionForm.register('name')}
                placeholder="e.g. Section A"
                hasError={Boolean(sectionForm.formState.errors.name)}
              />
            )}
          </FormField>
          <FormField label="Room number" error={sectionForm.formState.errors.roomNumber?.message}>
            {(props) => (
              <Input {...props} {...sectionForm.register('roomNumber')} placeholder="e.g. B-204" />
            )}
          </FormField>
        </form>
      </Modal>

      {/* Create Subject Modal */}
      <Modal
        open={subjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
        title="Register Curriculum Subject"
        footer={
          <>
            <Button variant="outline" onClick={() => setSubjectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="subject-form" loading={createSubjectMutation.isPending}>
              Add Subject
            </Button>
          </>
        }
      >
        {modalError && (
          <Alert variant="danger" className="mb-3">
            {modalError}
          </Alert>
        )}
        <form
          id="subject-form"
          onSubmit={subjectForm.handleSubmit((v) => createSubjectMutation.mutate(v))}
          className="space-y-4"
        >
          <FormField
            label="Subject code"
            error={subjectForm.formState.errors.code?.message}
            required
          >
            {(props) => (
              <Input
                {...props}
                {...subjectForm.register('code')}
                placeholder="e.g. MATH-8"
                hasError={Boolean(subjectForm.formState.errors.code)}
              />
            )}
          </FormField>
          <FormField
            label="Subject name"
            error={subjectForm.formState.errors.name?.message}
            required
          >
            {(props) => (
              <Input
                {...props}
                {...subjectForm.register('name')}
                placeholder="e.g. Mathematics Grade 8"
                hasError={Boolean(subjectForm.formState.errors.name)}
              />
            )}
          </FormField>
          <FormField label="Description" error={subjectForm.formState.errors.description?.message}>
            {(props) => (
              <Input
                {...props}
                {...subjectForm.register('description')}
                placeholder="Optional curriculum summary"
              />
            )}
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={activateTarget !== null}
        onClose={() => setActivateTarget(null)}
        onConfirm={() => {
          if (activateTarget) {
            activateYearMutation.mutate(activateTarget.id);
          }
        }}
        title="Transition active academic year?"
        description={`Setting "${activateTarget?.name ?? ''}" as Active will archive the currently active academic year.`}
        confirmLabel="Set Active"
        variant="primary"
        loading={activateYearMutation.isPending}
      />
    </AppShell>
  );
}

export default AcademicSetupPage;
