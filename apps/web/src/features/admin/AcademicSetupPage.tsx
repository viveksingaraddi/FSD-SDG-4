import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignOfferingTeacherSchema,
  createAcademicYearSchema,
  createClassSchema,
  createOfferingSchema,
  createSectionSchema,
  createSubjectSchema,
  updateAcademicYearSchema,
  updateClassSchema,
  updateSectionSchema,
  updateSubjectSchema,
  type AssignOfferingTeacherInput,
  type CreateAcademicYearInput,
  type CreateClassInput,
  type CreateOfferingInput,
  type CreateSectionInput,
  type CreateSubjectInput,
  type UpdateAcademicYearInput,
  type UpdateClassInput,
  type UpdateSectionInput,
  type UpdateSubjectInput,
} from '@fsd-sdg4/validation';
import type {
  AcademicYearDto,
  ClassDto,
  CourseOfferingDto,
  SectionDto,
  SubjectDto,
} from '@fsd-sdg4/contracts';
import { BookOpen, Edit2, Plus, School, Trash2, UserCheck, Users } from 'lucide-react';
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
  assignOfferingTeacherRequest,
  createAcademicYearRequest,
  createClassRequest,
  createCourseOfferingRequest,
  createSectionRequest,
  createSubjectRequest,
  deleteClassRequest,
  deleteCourseOfferingRequest,
  deleteSectionRequest,
  deleteSubjectRequest,
  fetchAcademicYears,
  fetchClasses,
  fetchCourseOfferings,
  fetchStaff,
  fetchSubjects,
  removeOfferingTeacherRequest,
  updateAcademicYearRequest,
  updateClassRequest,
  updateSectionRequest,
  updateSubjectRequest,
} from './schoolAdminApi';

export function AcademicSetupPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('years');

  // Modals state
  const [yearModalOpen, setYearModalOpen] = useState(false);
  const [editYearTarget, setEditYearTarget] = useState<AcademicYearDto | null>(null);

  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editClassTarget, setEditClassTarget] = useState<ClassDto | null>(null);
  const [deleteClassTarget, setDeleteClassTarget] = useState<ClassDto | null>(null);

  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [sectionClassPreset, setSectionClassPreset] = useState<string | null>(null);
  const [editSectionTarget, setEditSectionTarget] = useState<SectionDto | null>(null);
  const [deleteSectionTarget, setDeleteSectionTarget] = useState<SectionDto | null>(null);

  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editSubjectTarget, setEditSubjectTarget] = useState<SubjectDto | null>(null);
  const [deleteSubjectTarget, setDeleteSubjectTarget] = useState<SubjectDto | null>(null);

  const [offeringModalOpen, setOfferingModalOpen] = useState(false);
  const [deleteOfferingTarget, setDeleteOfferingTarget] = useState<CourseOfferingDto | null>(null);
  const [assignTeacherTarget, setAssignTeacherTarget] = useState<CourseOfferingDto | null>(null);
  const [deallocateTeacherTarget, setDeallocateTeacherTarget] = useState<{
    offeringId: string;
    teacherId: string;
    teacherName: string;
    courseName: string;
  } | null>(null);

  const [activateTarget, setActivateTarget] = useState<AcademicYearDto | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Filter queries
  const [classSearch, setClassSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [offeringYearFilter, setOfferingYearFilter] = useState('');
  const [offeringClassFilter, setOfferingClassFilter] = useState('');

  // Queries
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

  const staffQuery = useQuery({
    queryKey: ['school-admin', 'staff', 'active-list'],
    queryFn: ({ signal }) => fetchStaff({ status: 'ACTIVE' }, signal),
  });

  const offeringsQuery = useQuery({
    queryKey: [
      'school-admin',
      'offerings',
      offeringYearFilter || undefined,
      offeringClassFilter || undefined,
    ],
    queryFn: ({ signal }) =>
      fetchCourseOfferings(
        {
          academicYearId: offeringYearFilter || undefined,
          classId: offeringClassFilter || undefined,
        },
        signal,
      ),
  });

  // Forms
  const yearForm = useForm<CreateAcademicYearInput>({
    resolver: createZodResolver(createAcademicYearSchema),
    defaultValues: { name: '', startDate: '', endDate: '' },
  });

  const editYearForm = useForm<UpdateAcademicYearInput>({
    resolver: createZodResolver(updateAcademicYearSchema),
  });

  const classForm = useForm<CreateClassInput>({
    resolver: createZodResolver(createClassSchema),
    defaultValues: { name: '', stage: '', sortOrder: 0 },
  });

  const editClassForm = useForm<UpdateClassInput>({
    resolver: createZodResolver(updateClassSchema),
  });

  const sectionForm = useForm<CreateSectionInput>({
    resolver: createZodResolver(createSectionSchema),
    defaultValues: { classId: '', academicYearId: '', name: '', capacity: 30, roomNumber: '' },
  });

  const editSectionForm = useForm<UpdateSectionInput>({
    resolver: createZodResolver(updateSectionSchema),
  });

  const subjectForm = useForm<CreateSubjectInput>({
    resolver: createZodResolver(createSubjectSchema),
    defaultValues: { name: '', code: '', description: '' },
  });

  const editSubjectForm = useForm<UpdateSubjectInput>({
    resolver: createZodResolver(updateSubjectSchema),
  });

  const offeringForm = useForm<CreateOfferingInput>({
    resolver: createZodResolver(createOfferingSchema),
    defaultValues: {
      academicYearId: '',
      sectionId: '',
      subjectId: '',
      syllabus: '',
      teacherId: undefined,
      role: 'PRIMARY',
    },
  });

  const assignTeacherForm = useForm<AssignOfferingTeacherInput>({
    resolver: createZodResolver(assignOfferingTeacherSchema),
    defaultValues: { teacherId: '', role: 'PRIMARY' },
  });

  // Mutations
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

  const updateYearMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAcademicYearInput }) =>
      updateAcademicYearRequest(id, input),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({ title: 'Academic year updated', description: updated.name, variant: 'success' });
      setEditYearTarget(null);
      setModalError(null);
    },
    onError: (err) => {
      setModalError(err instanceof ApiClientError ? err.detail : 'Unable to update academic year.');
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

  const updateClassMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateClassInput }) =>
      updateClassRequest(id, input),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({ title: 'Class updated', description: updated.name, variant: 'success' });
      setEditClassTarget(null);
      setModalError(null);
    },
    onError: (err) => {
      setModalError(err instanceof ApiClientError ? err.detail : 'Unable to update class.');
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id: string) => deleteClassRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({ title: 'Class deleted', variant: 'success' });
      setDeleteClassTarget(null);
    },
    onError: (err) => {
      showToast({
        title: 'Delete failed',
        description: err instanceof ApiClientError ? err.detail : 'Unable to delete class.',
        variant: 'danger',
      });
      setDeleteClassTarget(null);
    },
  });

  const createSectionMutation = useMutation({
    mutationFn: createSectionRequest,
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({ title: 'Section created', description: created.name, variant: 'success' });
      setSectionModalOpen(false);
      setSectionClassPreset(null);
      setModalError(null);
      sectionForm.reset();
    },
    onError: (err) => {
      setModalError(err instanceof ApiClientError ? err.detail : 'Unable to create section.');
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSectionInput }) =>
      updateSectionRequest(id, input),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({ title: 'Section updated', description: updated.name, variant: 'success' });
      setEditSectionTarget(null);
      setModalError(null);
    },
    onError: (err) => {
      setModalError(err instanceof ApiClientError ? err.detail : 'Unable to update section.');
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (id: string) => deleteSectionRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({ title: 'Section deleted', variant: 'success' });
      setDeleteSectionTarget(null);
    },
    onError: (err) => {
      showToast({
        title: 'Delete failed',
        description: err instanceof ApiClientError ? err.detail : 'Unable to delete section.',
        variant: 'danger',
      });
      setDeleteSectionTarget(null);
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

  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSubjectInput }) =>
      updateSubjectRequest(id, input),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({ title: 'Subject updated', description: updated.name, variant: 'success' });
      setEditSubjectTarget(null);
      setModalError(null);
    },
    onError: (err) => {
      setModalError(err instanceof ApiClientError ? err.detail : 'Unable to update subject.');
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: (id: string) => deleteSubjectRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({ title: 'Subject deleted', variant: 'success' });
      setDeleteSubjectTarget(null);
    },
    onError: (err) => {
      showToast({
        title: 'Delete failed',
        description: err instanceof ApiClientError ? err.detail : 'Unable to delete subject.',
        variant: 'danger',
      });
      setDeleteSubjectTarget(null);
    },
  });

  const createOfferingMutation = useMutation({
    mutationFn: createCourseOfferingRequest,
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({
        title: 'Course offering created',
        description: `${created.subjectCode} for ${created.sectionName}`,
        variant: 'success',
      });
      setOfferingModalOpen(false);
      setModalError(null);
      offeringForm.reset();
    },
    onError: (err) => {
      setModalError(
        err instanceof ApiClientError ? err.detail : 'Unable to create course offering.',
      );
    },
  });

  const deleteOfferingMutation = useMutation({
    mutationFn: (id: string) => deleteCourseOfferingRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({ title: 'Course offering removed', variant: 'success' });
      setDeleteOfferingTarget(null);
    },
    onError: (err) => {
      showToast({
        title: 'Deletion failed',
        description: err instanceof ApiClientError ? err.detail : 'Unable to delete offering.',
        variant: 'danger',
      });
      setDeleteOfferingTarget(null);
    },
  });

  const assignTeacherMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: AssignOfferingTeacherInput }) =>
      assignOfferingTeacherRequest(id, input),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({
        title: 'Teacher allocated',
        description: `${res.teacherName} assigned as ${res.role}`,
        variant: 'success',
      });
      setAssignTeacherTarget(null);
      setModalError(null);
      assignTeacherForm.reset();
    },
    onError: (err) => {
      setModalError(err instanceof ApiClientError ? err.detail : 'Unable to allocate teacher.');
    },
  });

  const deallocateTeacherMutation = useMutation({
    mutationFn: ({ offeringId, teacherId }: { offeringId: string; teacherId: string }) =>
      removeOfferingTeacherRequest(offeringId, teacherId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin'] });
      showToast({ title: 'Teacher deallocated', variant: 'success' });
      setDeallocateTeacherTarget(null);
    },
    onError: (err) => {
      showToast({
        title: 'Deallocation failed',
        description: err instanceof ApiClientError ? err.detail : 'Unable to deallocate teacher.',
        variant: 'danger',
      });
      setDeallocateTeacherTarget(null);
    },
  });

  // Filtered lists
  const filteredClasses = useMemo(() => {
    const list = classesQuery.data ?? [];
    if (!classSearch.trim()) return list;
    const q = classSearch.toLowerCase();
    return list.filter(
      (c) => c.name.toLowerCase().includes(q) || c.stage.toLowerCase().includes(q),
    );
  }, [classesQuery.data, classSearch]);

  const filteredSubjects = useMemo(() => {
    const list = subjectsQuery.data ?? [];
    if (!subjectSearch.trim()) return list;
    const q = subjectSearch.toLowerCase();
    return list.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  }, [subjectsQuery.data, subjectSearch]);

  // Flattened sections for offering selection
  const allSections = useMemo(() => {
    const res: { id: string; label: string; academicYearId: string }[] = [];
    for (const cls of classesQuery.data ?? []) {
      for (const sec of cls.sections) {
        res.push({
          id: sec.id,
          label: `${cls.name} — ${sec.name} (${sec.academicYearName})`,
          academicYearId: sec.academicYearId,
        });
      }
    }
    return res;
  }, [classesQuery.data]);

  // Metrics for Offerings
  const offerings = offeringsQuery.data ?? [];
  const assignedOfferingsCount = offerings.filter((o) => o.teachers.length > 0).length;
  const unassignedOfferingsCount = offerings.length - assignedOfferingsCount;

  return (
    <AppShell
      title="Academic Management"
      breadcrumbs={[{ label: 'School Administrator', to: '/admin' }, { label: 'Academic Setup' }]}
    >
      <div className="space-y-6">
        <div>
          <Heading level={2} size="h2">
            Academic Structure &amp; Curriculum
          </Heading>
          <Text variant="small" className="mt-1 text-[var(--color-text-secondary)]">
            Configure institutional academic terms, grade-level classes, sections, curriculum
            subjects, and teacher course allocations.
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
            { id: 'offerings', label: 'Course Allocations', badge: offerings.length },
          ]}
        />

        {/* ============================================================== */}
        {/* TAB 1: ACADEMIC YEARS */}
        {/* ============================================================== */}
        {activeTab === 'years' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Heading level={3} size="h4">
                  Academic Terms
                </Heading>
                <Text variant="caption" className="text-[var(--color-text-muted)]">
                  Only one term can be active at a time. All class schedules and enrollments anchor
                  to an academic year.
                </Text>
              </div>
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
                  {
                    key: 'name',
                    header: 'Academic Year',
                    render: (r) => (
                      <div className="font-semibold text-[var(--color-text-primary)]">{r.name}</div>
                    ),
                  },
                  {
                    key: 'dates',
                    header: 'Term Window',
                    render: (r) => (
                      <span className="text-xs text-[var(--color-text-secondary)] font-mono">
                        {r.startDate} to {r.endDate}
                      </span>
                    ),
                  },
                  {
                    key: 'sections',
                    header: 'Sections',
                    render: (r) => <Badge variant="neutral">{r.sectionCount ?? 0} sections</Badge>,
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
                    render: (r) => (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                          onClick={() => {
                            setModalError(null);
                            setEditYearTarget(r);
                            editYearForm.reset({
                              name: r.name,
                              startDate: r.startDate,
                              endDate: r.endDate,
                              status: r.status,
                            });
                          }}
                          aria-label={`Edit ${r.name}`}
                        >
                          Edit
                        </Button>
                        {r.status !== 'ACTIVE' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setActivateTarget(r)}
                            aria-label={`Set ${r.name} as active`}
                          >
                            Set Active
                          </Button>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: CLASSES & SECTIONS */}
        {/* ============================================================== */}
        {activeTab === 'classes' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="w-full max-w-xs">
                <Input
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  placeholder="Search classes or stages..."
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => {
                    setModalError(null);
                    setSectionClassPreset(null);
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
            </div>

            {classesQuery.isError ? (
              <ErrorState
                description="Unable to load classes."
                onRetry={() => void classesQuery.refetch()}
              />
            ) : filteredClasses.length === 0 && !classesQuery.isLoading ? (
              <Card>
                <div className="p-8 text-center">
                  <School className="mx-auto h-8 w-8 text-[var(--color-text-muted)]" />
                  <p className="mt-2 text-sm font-medium text-[var(--color-text-primary)]">
                    No classes found
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    Create grade levels (e.g., Grade 8) and configure sections to group students.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredClasses.map((cls) => (
                  <Card key={cls.id} className="flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border-default)] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Heading level={3} size="h4">
                              {cls.name}
                            </Heading>
                            <Badge variant="neutral">Order {cls.sortOrder}</Badge>
                          </div>
                          <Text variant="caption" className="text-[var(--color-text-muted)]">
                            {cls.stage} • {cls.studentCount ?? 0} total enrolled students
                          </Text>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setModalError(null);
                              setEditClassTarget(cls);
                              editClassForm.reset({
                                name: cls.name,
                                stage: cls.stage,
                                sortOrder: cls.sortOrder,
                              });
                            }}
                            aria-label={`Edit ${cls.name}`}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteClassTarget(cls)}
                            disabled={cls.sections.length > 0}
                            aria-label={`Delete ${cls.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setModalError(null);
                              setSectionClassPreset(cls.id);
                              sectionForm.reset({
                                classId: cls.id,
                                academicYearId: yearsQuery.data?.[0]?.id ?? '',
                                name: '',
                                capacity: 30,
                                roomNumber: '',
                              });
                              setSectionModalOpen(true);
                            }}
                            aria-label={`Add section to ${cls.name}`}
                          >
                            + Section
                          </Button>
                        </div>
                      </div>

                      {/* Sections List */}
                      <div className="mt-3 space-y-2">
                        {cls.sections.length === 0 ? (
                          <div className="p-3 text-center text-xs text-[var(--color-text-muted)] border border-dashed rounded-[var(--radius-md)]">
                            No sections configured for this class yet.
                          </div>
                        ) : (
                          <div className="divide-y divide-[var(--color-border-default)] rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-slate-50">
                            {cls.sections.map((sec) => (
                              <div
                                key={sec.id}
                                className="flex items-center justify-between px-3 py-2 text-xs"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-[var(--color-text-primary)]">
                                      Section {sec.name}
                                    </span>
                                    <Badge variant="brand">{sec.academicYearName}</Badge>
                                    {sec.roomNumber && (
                                      <span className="text-[var(--color-text-muted)]">
                                        Room {sec.roomNumber}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[var(--color-text-secondary)]">
                                    Enrolled: {sec.studentCount ?? 0}
                                    {sec.capacity ? ` / ${sec.capacity} max` : ''}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setModalError(null);
                                      setEditSectionTarget(sec);
                                      editSectionForm.reset({
                                        name: sec.name,
                                        capacity: sec.capacity,
                                        roomNumber: sec.roomNumber ?? '',
                                      });
                                    }}
                                    className="p-1 rounded text-slate-500 hover:text-slate-800"
                                    aria-label={`Edit section ${sec.name}`}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteSectionTarget(sec)}
                                    className="p-1 rounded text-red-500 hover:text-red-700"
                                    aria-label={`Delete section ${sec.name}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: SUBJECTS */}
        {/* ============================================================== */}
        {activeTab === 'subjects' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="w-full max-w-xs">
                <Input
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  placeholder="Search code or subject..."
                />
              </div>
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
                rows={filteredSubjects}
                getRowKey={(r) => r.id}
                emptyTitle="No subjects added to curriculum"
                emptyDescription="Register subjects with institutional codes such as MATH-8."
                columns={[
                  {
                    key: 'code',
                    header: 'Code',
                    render: (r) => <Badge variant="brand">{r.code}</Badge>,
                  },
                  {
                    key: 'name',
                    header: 'Subject Name',
                    render: (r) => (
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {r.name}
                      </span>
                    ),
                  },
                  {
                    key: 'desc',
                    header: 'Description',
                    render: (r) => (
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {r.description || '—'}
                      </span>
                    ),
                  },
                  {
                    key: 'credits',
                    header: 'Credits',
                    render: (r) => r.credits ?? '—',
                  },
                  {
                    key: 'offerings',
                    header: 'Active Offerings',
                    render: (r) => <Badge variant="neutral">{r.offeringCount ?? 0} courses</Badge>,
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    align: 'right',
                    render: (r) => (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                          onClick={() => {
                            setModalError(null);
                            setEditSubjectTarget(r);
                            editSubjectForm.reset({
                              name: r.name,
                              code: r.code,
                              description: r.description ?? '',
                              credits: r.credits ? Number(r.credits) : null,
                            });
                          }}
                          aria-label={`Edit ${r.name}`}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteSubjectTarget(r)}
                          disabled={(r.offeringCount ?? 0) > 0}
                          aria-label={`Delete ${r.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: COURSE ALLOCATIONS */}
        {/* ============================================================== */}
        {activeTab === 'offerings' && (
          <div className="space-y-5">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card padding="md">
                <div className="flex items-center justify-between">
                  <Text variant="caption">Total Offerings</Text>
                  <BookOpen className="h-4 w-4 text-[var(--color-brand-primary)]" />
                </div>
                <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                  {offerings.length}
                </p>
                <Text variant="caption" className="text-[var(--color-text-muted)] mt-0.5">
                  Curriculum courses
                </Text>
              </Card>

              <Card padding="md">
                <div className="flex items-center justify-between">
                  <Text variant="caption">Assigned Faculty</Text>
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{assignedOfferingsCount}</p>
                <Text variant="caption" className="text-[var(--color-text-muted)] mt-0.5">
                  With allocated teachers
                </Text>
              </Card>

              <Card padding="md">
                <div className="flex items-center justify-between">
                  <Text variant="caption">Unassigned Courses</Text>
                  <Users className="h-4 w-4 text-amber-600" />
                </div>
                <p className="mt-1 text-2xl font-bold text-amber-600">{unassignedOfferingsCount}</p>
                <Text variant="caption" className="text-[var(--color-text-muted)] mt-0.5">
                  Requiring primary instructor
                </Text>
              </Card>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={offeringYearFilter}
                  onChange={(e) => setOfferingYearFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Academic Years' },
                    ...(yearsQuery.data ?? []).map((y) => ({ value: y.id, label: y.name })),
                  ]}
                  className="w-48 text-xs"
                />
                <Select
                  value={offeringClassFilter}
                  onChange={(e) => setOfferingClassFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Classes' },
                    ...(classesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name })),
                  ]}
                  className="w-48 text-xs"
                />
              </div>

              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setModalError(null);
                  offeringForm.reset({
                    academicYearId: yearsQuery.data?.[0]?.id ?? '',
                    sectionId: allSections[0]?.id ?? '',
                    subjectId: subjectsQuery.data?.[0]?.id ?? '',
                    syllabus: '',
                    teacherId: undefined,
                    role: 'PRIMARY',
                  });
                  setOfferingModalOpen(true);
                }}
                disabled={
                  !yearsQuery.data?.length || !allSections.length || !subjectsQuery.data?.length
                }
              >
                Create Course Offering
              </Button>
            </div>

            {/* Offerings Table */}
            {offeringsQuery.isError ? (
              <ErrorState
                description="Unable to load course offerings."
                onRetry={() => void offeringsQuery.refetch()}
              />
            ) : (
              <DataTable
                ariaLabel="Course offerings and teacher allocations"
                loading={offeringsQuery.isLoading}
                rows={offerings}
                getRowKey={(r) => r.id}
                emptyTitle="No course offerings found"
                emptyDescription="Assign subjects to class sections and allocate teachers."
                columns={[
                  {
                    key: 'term',
                    header: 'Academic Term',
                    render: (r) => <Badge variant="neutral">{r.academicYearName}</Badge>,
                  },
                  {
                    key: 'section',
                    header: 'Class & Section',
                    render: (r) => (
                      <div>
                        <div className="font-semibold text-[var(--color-text-primary)]">
                          {r.className}
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)]">
                          Section {r.sectionName}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'subject',
                    header: 'Subject & Code',
                    render: (r) => (
                      <div>
                        <div className="font-semibold text-[var(--color-text-primary)]">
                          {r.subjectName}
                        </div>
                        <Badge variant="brand">{r.subjectCode}</Badge>
                      </div>
                    ),
                  },
                  {
                    key: 'teachers',
                    header: 'Allocated Faculty',
                    render: (r) => (
                      <div className="flex flex-wrap gap-1.5">
                        {r.teachers.length === 0 ? (
                          <span className="text-xs text-amber-700 font-medium">
                            No teacher allocated
                          </span>
                        ) : (
                          r.teachers.map((t) => (
                            <div
                              key={t.allocationId}
                              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs shadow-xs"
                            >
                              <span className="font-medium text-[var(--color-text-primary)]">
                                {t.teacherName}
                              </span>
                              <Badge variant={t.role === 'PRIMARY' ? 'brand' : 'neutral'}>
                                {t.role}
                              </Badge>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeallocateTeacherTarget({
                                    offeringId: r.id,
                                    teacherId: t.teacherId,
                                    teacherName: t.teacherName,
                                    courseName: `${r.subjectName} (${r.sectionName})`,
                                  })
                                }
                                className="ml-1 text-slate-400 hover:text-red-600"
                                aria-label={`Remove ${t.teacherName} from course`}
                              >
                                ×
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    align: 'right',
                    render: (r) => (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Plus className="h-3.5 w-3.5" />}
                          onClick={() => {
                            setModalError(null);
                            setAssignTeacherTarget(r);
                            assignTeacherForm.reset({
                              teacherId: staffQuery.data?.[0]?.id ?? '',
                              role: 'PRIMARY',
                            });
                          }}
                          aria-label={`Allocate teacher to ${r.subjectName}`}
                        >
                          Assign Teacher
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteOfferingTarget(r)}
                          aria-label={`Delete course offering ${r.subjectCode}`}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL: CREATE ACADEMIC YEAR */}
      {/* ============================================================== */}
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

      {/* ============================================================== */}
      {/* MODAL: EDIT ACADEMIC YEAR */}
      {/* ============================================================== */}
      <Modal
        open={editYearTarget !== null}
        onClose={() => setEditYearTarget(null)}
        title={`Edit Academic Year — ${editYearTarget?.name ?? ''}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditYearTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" form="edit-year-form" loading={updateYearMutation.isPending}>
              Save Changes
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
          id="edit-year-form"
          onSubmit={editYearForm.handleSubmit((v) => {
            if (editYearTarget) {
              updateYearMutation.mutate({ id: editYearTarget.id, input: v });
            }
          })}
          className="space-y-4"
        >
          <FormField label="Term name" error={editYearForm.formState.errors.name?.message} required>
            {(props) => (
              <Input
                {...props}
                {...editYearForm.register('name')}
                hasError={Boolean(editYearForm.formState.errors.name)}
              />
            )}
          </FormField>
          <FormField
            label="Start date"
            error={editYearForm.formState.errors.startDate?.message}
            required
          >
            {(props) => (
              <Input
                {...props}
                {...editYearForm.register('startDate')}
                type="date"
                hasError={Boolean(editYearForm.formState.errors.startDate)}
              />
            )}
          </FormField>
          <FormField
            label="End date"
            error={editYearForm.formState.errors.endDate?.message}
            required
          >
            {(props) => (
              <Input
                {...props}
                {...editYearForm.register('endDate')}
                type="date"
                hasError={Boolean(editYearForm.formState.errors.endDate)}
              />
            )}
          </FormField>
          <FormField label="Status" error={editYearForm.formState.errors.status?.message} required>
            {(props) => (
              <Select
                {...props}
                {...editYearForm.register('status')}
                options={[
                  { value: 'ACTIVE', label: 'ACTIVE (Sets other terms to ARCHIVED)' },
                  { value: 'UPCOMING', label: 'UPCOMING' },
                  { value: 'ARCHIVED', label: 'ARCHIVED' },
                ]}
              />
            )}
          </FormField>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL: CREATE CLASS */}
      {/* ============================================================== */}
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
          <FormField label="Sort order" error={classForm.formState.errors.sortOrder?.message}>
            {(props) => (
              <Input
                {...props}
                {...classForm.register('sortOrder')}
                type="number"
                placeholder="0"
              />
            )}
          </FormField>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL: EDIT CLASS */}
      {/* ============================================================== */}
      <Modal
        open={editClassTarget !== null}
        onClose={() => setEditClassTarget(null)}
        title={`Edit Class — ${editClassTarget?.name ?? ''}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditClassTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" form="edit-class-form" loading={updateClassMutation.isPending}>
              Update Class
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
          id="edit-class-form"
          onSubmit={editClassForm.handleSubmit((v) => {
            if (editClassTarget) {
              updateClassMutation.mutate({ id: editClassTarget.id, input: v });
            }
          })}
          className="space-y-4"
        >
          <FormField
            label="Class name"
            error={editClassForm.formState.errors.name?.message}
            required
          >
            {(props) => (
              <Input
                {...props}
                {...editClassForm.register('name')}
                hasError={Boolean(editClassForm.formState.errors.name)}
              />
            )}
          </FormField>
          <FormField label="Stage" error={editClassForm.formState.errors.stage?.message} required>
            {(props) => (
              <Input
                {...props}
                {...editClassForm.register('stage')}
                hasError={Boolean(editClassForm.formState.errors.stage)}
              />
            )}
          </FormField>
          <FormField label="Sort order" error={editClassForm.formState.errors.sortOrder?.message}>
            {(props) => <Input {...props} {...editClassForm.register('sortOrder')} type="number" />}
          </FormField>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL: CREATE SECTION */}
      {/* ============================================================== */}
      <Modal
        open={sectionModalOpen}
        onClose={() => {
          setSectionModalOpen(false);
          setSectionClassPreset(null);
        }}
        title="Create Class Section"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setSectionModalOpen(false);
                setSectionClassPreset(null);
              }}
            >
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
                disabled={sectionClassPreset !== null}
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
                options={(yearsQuery.data ?? []).map((y) => ({
                  value: y.id,
                  label: `${y.name} (${y.status})`,
                }))}
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
                placeholder="e.g. 8-A"
                hasError={Boolean(sectionForm.formState.errors.name)}
              />
            )}
          </FormField>
          <FormField
            label="Capacity (max students)"
            error={sectionForm.formState.errors.capacity?.message}
          >
            {(props) => (
              <Input
                {...props}
                {...sectionForm.register('capacity')}
                type="number"
                placeholder="30"
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

      {/* ============================================================== */}
      {/* MODAL: EDIT SECTION */}
      {/* ============================================================== */}
      <Modal
        open={editSectionTarget !== null}
        onClose={() => setEditSectionTarget(null)}
        title={`Edit Section — ${editSectionTarget?.name ?? ''}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditSectionTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" form="edit-sec-form" loading={updateSectionMutation.isPending}>
              Update Section
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
          id="edit-sec-form"
          onSubmit={editSectionForm.handleSubmit((v) => {
            if (editSectionTarget) {
              updateSectionMutation.mutate({ id: editSectionTarget.id, input: v });
            }
          })}
          className="space-y-4"
        >
          <FormField
            label="Section name"
            error={editSectionForm.formState.errors.name?.message}
            required
          >
            {(props) => (
              <Input
                {...props}
                {...editSectionForm.register('name')}
                hasError={Boolean(editSectionForm.formState.errors.name)}
              />
            )}
          </FormField>
          <FormField label="Capacity" error={editSectionForm.formState.errors.capacity?.message}>
            {(props) => (
              <Input {...props} {...editSectionForm.register('capacity')} type="number" />
            )}
          </FormField>
          <FormField
            label="Room number"
            error={editSectionForm.formState.errors.roomNumber?.message}
          >
            {(props) => <Input {...props} {...editSectionForm.register('roomNumber')} />}
          </FormField>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL: CREATE SUBJECT */}
      {/* ============================================================== */}
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
                placeholder="Curriculum summary"
              />
            )}
          </FormField>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL: EDIT SUBJECT */}
      {/* ============================================================== */}
      <Modal
        open={editSubjectTarget !== null}
        onClose={() => setEditSubjectTarget(null)}
        title={`Edit Subject — ${editSubjectTarget?.code ?? ''}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditSubjectTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" form="edit-subj-form" loading={updateSubjectMutation.isPending}>
              Update Subject
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
          id="edit-subj-form"
          onSubmit={editSubjectForm.handleSubmit((v) => {
            if (editSubjectTarget) {
              updateSubjectMutation.mutate({ id: editSubjectTarget.id, input: v });
            }
          })}
          className="space-y-4"
        >
          <FormField
            label="Subject code"
            error={editSubjectForm.formState.errors.code?.message}
            required
          >
            {(props) => (
              <Input
                {...props}
                {...editSubjectForm.register('code')}
                hasError={Boolean(editSubjectForm.formState.errors.code)}
              />
            )}
          </FormField>
          <FormField
            label="Subject name"
            error={editSubjectForm.formState.errors.name?.message}
            required
          >
            {(props) => (
              <Input
                {...props}
                {...editSubjectForm.register('name')}
                hasError={Boolean(editSubjectForm.formState.errors.name)}
              />
            )}
          </FormField>
          <FormField
            label="Description"
            error={editSubjectForm.formState.errors.description?.message}
          >
            {(props) => <Input {...props} {...editSubjectForm.register('description')} />}
          </FormField>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL: CREATE COURSE OFFERING */}
      {/* ============================================================== */}
      <Modal
        open={offeringModalOpen}
        onClose={() => setOfferingModalOpen(false)}
        title="Create Course Offering"
        footer={
          <>
            <Button variant="outline" onClick={() => setOfferingModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="offering-form" loading={createOfferingMutation.isPending}>
              Create Course
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
          id="offering-form"
          onSubmit={offeringForm.handleSubmit((v) => createOfferingMutation.mutate(v))}
          className="space-y-4"
        >
          <FormField
            label="Academic Year"
            error={offeringForm.formState.errors.academicYearId?.message}
            required
          >
            {(props) => (
              <Select
                {...props}
                {...offeringForm.register('academicYearId')}
                options={(yearsQuery.data ?? []).map((y) => ({
                  value: y.id,
                  label: `${y.name} (${y.status})`,
                }))}
                hasError={Boolean(offeringForm.formState.errors.academicYearId)}
              />
            )}
          </FormField>

          <FormField
            label="Class & Section"
            error={offeringForm.formState.errors.sectionId?.message}
            required
          >
            {(props) => (
              <Select
                {...props}
                {...offeringForm.register('sectionId')}
                options={allSections.map((s) => ({ value: s.id, label: s.label }))}
                hasError={Boolean(offeringForm.formState.errors.sectionId)}
              />
            )}
          </FormField>

          <FormField
            label="Curriculum Subject"
            error={offeringForm.formState.errors.subjectId?.message}
            required
          >
            {(props) => (
              <Select
                {...props}
                {...offeringForm.register('subjectId')}
                options={(subjectsQuery.data ?? []).map((s) => ({
                  value: s.id,
                  label: `${s.code} — ${s.name}`,
                }))}
                hasError={Boolean(offeringForm.formState.errors.subjectId)}
              />
            )}
          </FormField>

          <div className="border-t border-[var(--color-border-default)] pt-3">
            <Text variant="caption" className="font-semibold text-[var(--color-text-primary)]">
              Initial Faculty Assignment (Optional)
            </Text>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                label="Assigned Teacher"
                error={offeringForm.formState.errors.teacherId?.message}
              >
                {(props) => (
                  <Select
                    {...props}
                    {...offeringForm.register('teacherId')}
                    options={[
                      { value: '', label: 'None (Assign later)' },
                      ...(staffQuery.data ?? []).map((t) => ({
                        value: t.id,
                        label: `${t.firstName} ${t.lastName} (${t.employeeId})`,
                      })),
                    ]}
                  />
                )}
              </FormField>

              <FormField label="Teaching Role" error={offeringForm.formState.errors.role?.message}>
                {(props) => (
                  <Select
                    {...props}
                    {...offeringForm.register('role')}
                    options={[
                      { value: 'PRIMARY', label: 'Primary Instructor' },
                      { value: 'ASSISTANT', label: 'Teaching Assistant' },
                    ]}
                  />
                )}
              </FormField>
            </div>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL: ASSIGN TEACHER TO EXISTING OFFERING */}
      {/* ============================================================== */}
      <Modal
        open={assignTeacherTarget !== null}
        onClose={() => setAssignTeacherTarget(null)}
        title={`Assign Teacher — ${assignTeacherTarget?.subjectName ?? ''}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setAssignTeacherTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" form="assign-tch-form" loading={assignTeacherMutation.isPending}>
              Confirm Allocation
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
          id="assign-tch-form"
          onSubmit={assignTeacherForm.handleSubmit((v) => {
            if (assignTeacherTarget) {
              assignTeacherMutation.mutate({ id: assignTeacherTarget.id, input: v });
            }
          })}
          className="space-y-4"
        >
          <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <span className="font-semibold">Target Section:</span> {assignTeacherTarget?.className}{' '}
            — {assignTeacherTarget?.sectionName} ({assignTeacherTarget?.academicYearName})
          </div>

          <FormField
            label="Select Teacher"
            error={assignTeacherForm.formState.errors.teacherId?.message}
            required
          >
            {(props) => (
              <Select
                {...props}
                {...assignTeacherForm.register('teacherId')}
                options={(staffQuery.data ?? []).map((t) => ({
                  value: t.id,
                  label: `${t.firstName} ${t.lastName} (${t.employeeId}) — ${t.specialization ?? 'General'}`,
                }))}
                hasError={Boolean(assignTeacherForm.formState.errors.teacherId)}
              />
            )}
          </FormField>

          <FormField
            label="Allocation Role"
            error={assignTeacherForm.formState.errors.role?.message}
            required
          >
            {(props) => (
              <Select
                {...props}
                {...assignTeacherForm.register('role')}
                options={[
                  { value: 'PRIMARY', label: 'Primary Instructor' },
                  { value: 'ASSISTANT', label: 'Teaching Assistant' },
                ]}
              />
            )}
          </FormField>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* CONFIRMATION DIALOGS */}
      {/* ============================================================== */}
      {/* Activate Year */}
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

      {/* Delete Class */}
      <ConfirmDialog
        open={deleteClassTarget !== null}
        onClose={() => setDeleteClassTarget(null)}
        onConfirm={() => {
          if (deleteClassTarget) {
            deleteClassMutation.mutate(deleteClassTarget.id);
          }
        }}
        title={`Delete Class "${deleteClassTarget?.name ?? ''}"?`}
        description="This will permanently delete this grade level class definition. Classes containing active sections cannot be deleted."
        confirmLabel="Delete Class"
        variant="danger"
        loading={deleteClassMutation.isPending}
      />

      {/* Delete Section */}
      <ConfirmDialog
        open={deleteSectionTarget !== null}
        onClose={() => setDeleteSectionTarget(null)}
        onConfirm={() => {
          if (deleteSectionTarget) {
            deleteSectionMutation.mutate(deleteSectionTarget.id);
          }
        }}
        title={`Delete Section "${deleteSectionTarget?.name ?? ''}"?`}
        description="Sections with active student enrollments, course offerings, or attendance logs cannot be deleted."
        confirmLabel="Delete Section"
        variant="danger"
        loading={deleteSectionMutation.isPending}
      />

      {/* Delete Subject */}
      <ConfirmDialog
        open={deleteSubjectTarget !== null}
        onClose={() => setDeleteSubjectTarget(null)}
        onConfirm={() => {
          if (deleteSubjectTarget) {
            deleteSubjectMutation.mutate(deleteSubjectTarget.id);
          }
        }}
        title={`Delete Subject "${deleteSubjectTarget?.name ?? ''}"?`}
        description="Curriculum subjects that are active in course offerings cannot be deleted."
        confirmLabel="Delete Subject"
        variant="danger"
        loading={deleteSubjectMutation.isPending}
      />

      {/* Delete Offering */}
      <ConfirmDialog
        open={deleteOfferingTarget !== null}
        onClose={() => setDeleteOfferingTarget(null)}
        onConfirm={() => {
          if (deleteOfferingTarget) {
            deleteOfferingMutation.mutate(deleteOfferingTarget.id);
          }
        }}
        title={`Delete Course Offering "${deleteOfferingTarget?.subjectCode ?? ''}"?`}
        description={`Removing this course offering will also deallocate all assigned instructors from ${deleteOfferingTarget?.sectionName ?? ''}.`}
        confirmLabel="Delete Course"
        variant="danger"
        loading={deleteOfferingMutation.isPending}
      />

      {/* Deallocate Teacher */}
      <ConfirmDialog
        open={deallocateTeacherTarget !== null}
        onClose={() => setDeallocateTeacherTarget(null)}
        onConfirm={() => {
          if (deallocateTeacherTarget) {
            deallocateTeacherMutation.mutate({
              offeringId: deallocateTeacherTarget.offeringId,
              teacherId: deallocateTeacherTarget.teacherId,
            });
          }
        }}
        title={`Deallocate ${deallocateTeacherTarget?.teacherName ?? ''}?`}
        description={`Are you sure you want to remove ${deallocateTeacherTarget?.teacherName ?? ''} from ${deallocateTeacherTarget?.courseName ?? ''}? Historical attendance and grading records will remain preserved.`}
        confirmLabel="Remove Teacher"
        variant="danger"
        loading={deallocateTeacherMutation.isPending}
      />
    </AppShell>
  );
}

export default AcademicSetupPage;
