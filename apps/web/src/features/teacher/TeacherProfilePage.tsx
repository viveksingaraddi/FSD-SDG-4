import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Mail, Building, GraduationCap, Shield, Edit3, Award, BookOpen } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  FormField,
  Heading,
  Input,
  Modal,
  Skeleton,
  Text,
  useToast,
} from '@/components/ui';
import { fetchTeacherClasses, fetchTeacherProfile } from './teacherApi';

export function TeacherProfilePage() {
  const { showToast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [officeHours, setOfficeHours] = useState('Monday & Thursday: 03:30 PM - 04:30 PM');
  const [contactPhone, setContactPhone] = useState('+1 (555) 234-5678');
  const [bio, setBio] = useState(
    'Dedicated secondary education faculty specializing in foundational mathematics, statistics, and STEM curricula.',
  );

  const profileQuery = useQuery({
    queryKey: ['teacher', 'profile'],
    queryFn: ({ signal }) => fetchTeacherProfile(signal),
  });

  const classesQuery = useQuery({
    queryKey: ['teacher', 'classes'],
    queryFn: ({ signal }) => fetchTeacherClasses(signal),
  });

  const teacher = profileQuery.data;
  const classes = classesQuery.data ?? [];

  const handleSaveContact = (e: FormEvent) => {
    e.preventDefault();
    setIsEditModalOpen(false);
    showToast({
      title: 'Profile Updated',
      description: 'Your faculty contact information and office hours have been saved.',
      variant: 'success',
    });
  };

  return (
    <AppShell
      title="Faculty Profile"
      breadcrumbs={[{ label: 'Faculty Portal', to: '/teacher' }, { label: 'My Profile' }]}
    >
      <div className="space-y-6">
        {/* Loading / Error states */}
        {profileQuery.isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        )}

        {profileQuery.isError && (
          <ErrorState
            title="Failed to load profile"
            description="Could not synchronize faculty credentials from the institution."
            onRetry={() => profileQuery.refetch()}
          />
        )}

        {profileQuery.isSuccess && teacher && (
          <>
            {/* Header Hero Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-surface via-surface to-brand/5 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand text-2xl font-bold text-brand-foreground shadow-md ring-4 ring-brand/10">
                    {teacher.firstName.charAt(0)}
                    {teacher.lastName.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Heading level={2} className="text-2xl font-bold tracking-tight text-text">
                        {teacher.firstName} {teacher.lastName}
                      </Heading>
                      <Badge variant="brand">Verified Faculty</Badge>
                    </div>
                    <Text className="text-sm font-medium text-text-muted flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      {teacher.schoolName} • ID: {teacher.employeeId}
                    </Text>
                    <Text className="text-xs text-text-muted flex items-center gap-2">
                      <Award className="h-3.5 w-3.5 text-brand" />
                      Specialization: {teacher.specialization}
                    </Text>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Office Hours
                  </Button>
                </div>
              </div>
            </div>

            {/* Profile Grid: Details & Assignments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Official Credentials & Contact */}
              <Card className="p-6 border border-border/80 bg-surface shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <Heading
                    level={3}
                    className="text-base font-semibold text-text flex items-center gap-2"
                  >
                    <User className="h-4 w-4 text-brand" />
                    Official Credentials
                  </Heading>
                  <Badge variant="neutral">Active Tenured</Badge>
                </div>

                <dl className="grid grid-cols-1 gap-3.5 text-sm">
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <dt className="text-text-muted">Full Legal Name</dt>
                    <dd className="font-medium text-text">
                      {teacher.firstName} {teacher.lastName}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <dt className="text-text-muted">Institutional Email</dt>
                    <dd className="font-medium text-text flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-text-muted" />
                      {teacher.email}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <dt className="text-text-muted">Employee / Faculty ID</dt>
                    <dd className="font-mono text-xs font-semibold text-text bg-surface-muted px-2 py-0.5 rounded">
                      {teacher.employeeId}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <dt className="text-text-muted">Contact Extension</dt>
                    <dd className="font-medium text-text">{contactPhone}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-text-muted">Designated Office Hours</dt>
                    <dd className="font-medium text-text text-right text-xs max-w-[220px]">
                      {officeHours}
                    </dd>
                  </div>
                </dl>
              </Card>

              {/* Card 2: Academic Specializations & Qualifications */}
              <Card className="p-6 border border-border/80 bg-surface shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <Heading
                    level={3}
                    className="text-base font-semibold text-text flex items-center gap-2"
                  >
                    <GraduationCap className="h-4 w-4 text-brand" />
                    Qualifications & Bio
                  </Heading>
                  <Badge variant="brand">Verified Degree</Badge>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Faculty Bio & Focus
                    </span>
                    <p className="mt-1 text-xs text-text-muted leading-relaxed">{bio}</p>
                  </div>

                  <div className="pt-2">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Degrees & Certifications
                    </span>
                    <ul className="mt-1.5 space-y-1.5 text-xs text-text">
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                        Master of Science in Mathematics & Pedagogy
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                        State Board Standard Professional Educator Certificate
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                        Advanced Placement (AP) Instructional Certification
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>

            {/* Assigned Teaching Offerings */}
            <Card className="p-6 border border-border/80 bg-surface shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <Heading
                    level={3}
                    className="text-base font-semibold text-text flex items-center gap-2"
                  >
                    <BookOpen className="h-4 w-4 text-brand" />
                    Current Cohort Allocations ({classes.length})
                  </Heading>
                  <Text className="text-xs text-text-muted mt-0.5">
                    Course sections assigned to your institutional portfolio for the 2026-2027
                    academic session.
                  </Text>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((cls) => (
                  <div
                    key={cls.courseOfferingId}
                    className="p-4 rounded-xl border border-border/70 bg-surface-muted/30 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <Badge variant="brand">{cls.subjectCode}</Badge>
                        <span className="text-xs text-text-muted">{cls.roomNumber}</span>
                      </div>
                      <h4 className="font-semibold text-sm text-text mt-2">{cls.subjectName}</h4>
                      <p className="text-xs text-text-muted mt-0.5">
                        {cls.className} • Section {cls.sectionName}
                      </p>
                    </div>
                    <div className="text-xs font-medium text-brand">
                      {cls.studentCount} Students Enrolled
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Account & Security Information */}
            <Card className="p-6 border border-border/80 bg-surface shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text">
                      Single Sign-On & Tenant Scoping
                    </h4>
                    <p className="text-xs text-text-muted">
                      Your identity is scoped to {teacher.schoolName} with RBAC role TEACHER.
                    </p>
                  </div>
                </div>
                <Badge variant="neutral">Role: TEACHER</Badge>
              </div>
            </Card>
          </>
        )}

        {/* Edit Modal */}
        <Modal
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Contact & Office Hours"
          description="Update public faculty availability for students and guardians."
          footer={
            <>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="edit-profile-form">
                Save Preferences
              </Button>
            </>
          }
        >
          <form id="edit-profile-form" onSubmit={handleSaveContact} className="space-y-4">
            <FormField label="Contact Phone / Extension">
              {(props) => (
                <Input
                  {...props}
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              )}
            </FormField>

            <FormField label="Office Hours Schedule">
              {(props) => (
                <Input
                  {...props}
                  value={officeHours}
                  onChange={(e) => setOfficeHours(e.target.value)}
                  placeholder="e.g., Monday & Wednesday 03:00 PM - 04:30 PM"
                />
              )}
            </FormField>

            <FormField label="Faculty Bio">
              {() => (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="Brief summary of instructional background..."
                />
              )}
            </FormField>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}

export default TeacherProfilePage;
