import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, FileText } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Heading,
  Modal,
  Select,
  Skeleton,
  Text,
} from '@/components/ui';
import { fetchChildGrades, fetchLinkedChildren } from './parentApi';

interface ExamReportPreview {
  title: string;
  subjectName: string;
  assessmentDate: string;
  score: number;
  maxMarks: number;
  gradeLetter: string | null;
  academicYear: string;
}

export function ParentDocumentsPage() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [previewDoc, setPreviewDoc] = useState<ExamReportPreview | null>(null);

  const childrenQuery = useQuery({
    queryKey: ['parent', 'children'],
    queryFn: ({ signal }) => fetchLinkedChildren(signal),
  });

  const children = childrenQuery.data ?? [];
  const activeStudentId = selectedStudentId || children[0]?.id || '';

  const gradesQuery = useQuery({
    queryKey: ['parent', 'grades', activeStudentId],
    queryFn: ({ signal }) => fetchChildGrades(activeStudentId, signal),
    enabled: Boolean(activeStudentId),
  });

  const report = gradesQuery.data;
  const examReports: ExamReportPreview[] = (report?.subjects ?? []).flatMap((subj) =>
    subj.assessments.map((a) => ({
      title: `${a.title} — ${subj.subjectName}`,
      subjectName: subj.subjectName,
      assessmentDate: a.assessmentDate,
      score: a.score,
      maxMarks: a.maxMarks,
      gradeLetter: a.gradeLetter,
      academicYear: report?.academicYearName ?? 'Current Year',
    })),
  );

  const visibleReports =
    categoryFilter === 'ALL' || categoryFilter === 'EXAMINATION_REPORT' ? examReports : [];

  return (
    <AppShell
      title="Report Cards & Documents"
      breadcrumbs={[{ label: 'Parent / Guardian', to: '/parent' }, { label: 'Documents' }]}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading level={2} size="h2">
              Report Cards &amp; Official Documents
            </Heading>
            <Text variant="small" className="mt-1">
              Access published examination reports, term report cards, and school certificates.
            </Text>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {children.length > 0 && (
              <Select
                aria-label="Select child"
                value={activeStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                options={children.map((c) => ({
                  value: c.id,
                  label: `${c.firstName} ${c.lastName} (${c.className})`,
                }))}
              />
            )}
            <Select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Categories' },
                { value: 'EXAMINATION_REPORT', label: 'Examination Reports' },
                { value: 'REPORT_CARD', label: 'Report Cards' },
                { value: 'CERTIFICATE', label: 'School Certificates' },
              ]}
            />
          </div>
        </div>

        <Alert variant="info" title="Document Storage Status">
          Published examination result summaries are shown below. Downloadable PDF report cards
          and school certificates require a dedicated document storage service (not yet provisioned
          in the backend).
        </Alert>

        {(childrenQuery.isLoading || gradesQuery.isLoading) && (
          <Skeleton className="h-48 w-full" />
        )}

        {(childrenQuery.isError || gradesQuery.isError) && (
          <ErrorState
            title="Unable to load documents"
            description="Please try again later."
            onRetry={() => void gradesQuery.refetch()}
          />
        )}

        {!childrenQuery.isLoading && children.length === 0 && (
          <EmptyState
            title="No verified linked students"
            description="Contact your school administrator to verify your guardian relationship."
          />
        )}

        {!gradesQuery.isLoading && !gradesQuery.isError && activeStudentId && (
          <Card>
            <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border-default)] pb-3">
              <div className="flex items-center gap-2">
                <FileText
                  className="h-5 w-5 text-[var(--color-brand-primary)]"
                  aria-hidden="true"
                />
                <Heading level={3} size="h3">
                  Available Reports &amp; Documents
                </Heading>
              </div>
              <Badge variant="neutral">{visibleReports.length} items</Badge>
            </div>

            {visibleReports.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="No documents available"
                  description="No published reports or certificates match your selected category."
                />
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-[var(--color-border-default)]">
                {visibleReports.map((doc, idx) => (
                  <li
                    key={`${doc.title}-${idx}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {doc.title}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Examination Report · Academic Year {doc.academicYear} · Published:{' '}
                        {doc.assessmentDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.gradeLetter && <Badge variant="brand">Grade {doc.gradeLetter}</Badge>}
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Eye className="h-3.5 w-3.5" />}
                        onClick={() => setPreviewDoc(doc)}
                      >
                        Preview
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        <Modal
          open={previewDoc !== null}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc?.title ?? 'Examination Report'}
        >
          {previewDoc && (
            <div className="space-y-4">
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-4 text-sm">
                <p>
                  <strong>Student:</strong> {report?.studentName}
                </p>
                <p>
                  <strong>Academic Year:</strong> {previewDoc.academicYear}
                </p>
                <p>
                  <strong>Subject:</strong> {previewDoc.subjectName}
                </p>
                <p>
                  <strong>Assessment Date:</strong> {previewDoc.assessmentDate}
                </p>
                <p>
                  <strong>Score:</strong> {previewDoc.score} / {previewDoc.maxMarks}
                  {previewDoc.gradeLetter ? ` (${previewDoc.gradeLetter})` : ''}
                </p>
              </div>
              <div className="flex justify-end">
                <Button variant="primary" onClick={() => setPreviewDoc(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}

export default ParentDocumentsPage;
