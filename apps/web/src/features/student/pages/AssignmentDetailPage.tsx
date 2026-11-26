import { useState, type ChangeEvent, type DragEvent } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ClockIcon,
  DownloadIcon,
  FileTextIcon,
  SparklesIcon,
  UploadCloudIcon,
  XIcon,
} from '../../../components/icons/Icons.js';
import {
  ASSIGNMENT_STATUS_META,
  EmptyState,
  LoadingState,
  StudentLayout,
} from '../../../components/student/index.js';
import { Badge, Button, Card, useToast } from '../../../components/ui/index.js';
import { createZodResolver } from '../../../lib/zodResolver.js';
import {
  useStudentAssignment,
  useSubmitAssignment,
  useUpdateAssignmentStatus,
} from '../hooks/useStudentPortal.js';
import {
  assignmentSubmissionSchema,
  type AssignmentSubmissionFormValues,
} from '../schemas/studentSchemas.js';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = Math.round(bytes / 1024);
  if (kb < 1024) return `${kb} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AssignmentDetailPage() {
  const { assignmentId = '' } = useParams();
  const { showToast } = useToast();
  const { data: assignment, isLoading } = useStudentAssignment(assignmentId);
  const submitMutation = useSubmitAssignment();
  const statusMutation = useUpdateAssignmentStatus();

  const [selectedFile, setSelectedFile] = useState<{ name: string; sizeLabel: string } | null>(
    null,
  );
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.txt', '.py'];

  const validateAndSelectFile = (file: File | undefined) => {
    setFileError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const lower = file.name.toLowerCase();
    const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
    if (!hasAllowedExt) {
      setFileError('Unsupported file format. Please upload PDF, DOCX, PNG, JPG, TXT, or PY.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError('File exceeds the 10 MB limit. Please choose a smaller file.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile({
      name: file.name,
      sizeLabel: formatBytes(file.size),
    });
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AssignmentSubmissionFormValues>({
    resolver: createZodResolver(assignmentSubmissionSchema),
    defaultValues: {
      responseText: '',
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    validateAndSelectFile(event.target.files?.[0]);
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    validateAndSelectFile(event.dataTransfer.files?.[0]);
  };

  const onSubmit = (values: AssignmentSubmissionFormValues) => {
    if (!assignment) return;
    submitMutation.mutate(
      {
        assignmentId: assignment.id,
        responseText: values.responseText,
        ...(selectedFile
          ? { fileName: selectedFile.name, fileSizeLabel: selectedFile.sizeLabel }
          : {}),
      },
      {
        onSuccess: () => {
          showToast({
            type: 'success',
            title: 'Assignment submitted!',
            description: `${assignment.title} has been submitted for teacher review.`,
          });
          reset();
          setSelectedFile(null);
        },
      },
    );
  };

  const handleMarkInProgress = () => {
    if (!assignment) return;
    statusMutation.mutate(
      { assignmentId: assignment.id, status: 'IN_PROGRESS' },
      {
        onSuccess: () => {
          showToast({
            type: 'info',
            title: 'Status updated',
            description: 'Marked assignment as In Progress.',
          });
        },
      },
    );
  };

  const handleDownloadAttachment = (name: string) => {
    showToast({
      type: 'info',
      title: 'Attachment ready',
      description: `Downloaded ${name} for offline study.`,
    });
  };

  return (
    <StudentLayout
      breadcrumbs={[
        { label: 'Student Portal', to: '/student' },
        { label: 'Assignments', to: '/student/assignments' },
        { label: assignment?.title ?? 'Assignment Details' },
      ]}
    >
      {isLoading ? (
        <LoadingState variant="detail" label="Loading assignment details..." />
      ) : !assignment ? (
        <EmptyState
          title="Assignment not found"
          description="We could not locate this assignment in your coursework list."
          action={
            <Link
              to="/student/assignments"
              className="inline-flex items-center rounded-[var(--radius-md)] bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-medium text-white"
            >
              Back to Assignments
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          <Link
            to="/student/assignments"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)]"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span>Back to Assignments</span>
          </Link>

          {/* Header Summary Card */}
          <Card>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="brand">{assignment.subjectName}</Badge>
                  <Badge variant={ASSIGNMENT_STATUS_META[assignment.status].variant}>
                    {ASSIGNMENT_STATUS_META[assignment.status].label}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {assignment.title}
                </h1>
                <p className="text-sm text-[var(--color-text-secondary)]">{assignment.summary}</p>
              </div>

              <div className="flex shrink-0 flex-col gap-1.5 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] p-4 text-xs md:min-w-[230px]">
                <span className="font-medium text-[var(--color-text-muted)]">
                  Teacher:{' '}
                  <strong className="text-[var(--color-text-primary)]">
                    {assignment.teacherName}
                  </strong>
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-[var(--color-text-secondary)]">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {assignment.dueLabel}
                </span>
                <span className="font-medium text-[var(--color-text-secondary)]">
                  Total Marks: {assignment.maxMarks} · Est. {assignment.estimatedMinutes} min
                </span>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Instructions & Attachments */}
            <div className="space-y-6 lg:col-span-5">
              <Card>
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Instructions
                </h2>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[var(--color-text-secondary)]">
                  {assignment.instructions.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>

                {assignment.status === 'NOT_STARTED' && (
                  <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleMarkInProgress}
                      isLoading={statusMutation.isPending}
                    >
                      Mark as In Progress
                    </Button>
                  </div>
                )}
              </Card>

              <Card>
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Attachments
                </h2>
                {assignment.attachments.length === 0 ? (
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    No reference files attached for this assignment.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2.5">
                    {assignment.attachments.map((file) => (
                      <li
                        key={file.id}
                        className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <FileTextIcon className="h-4 w-4 shrink-0 text-[var(--color-brand-primary)]" />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-[var(--color-text-primary)]">
                              {file.name}
                            </p>
                            <p className="text-[11px] text-[var(--color-text-muted)]">
                              {file.format} · {file.sizeLabel}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadAttachment(file.name)}
                          aria-label={`Download ${file.name}`}
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            {/* Submission / Confirmation / Reviewed Feedback */}
            <div className="space-y-6 lg:col-span-7">
              {assignment.status === 'REVIEWED' && (
                <Card className="border-emerald-200 bg-emerald-50/40">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="h-5 w-5 text-[var(--color-semantic-success)]" />
                      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                        Teacher Review &amp; Marks
                      </h2>
                    </div>
                    <Badge variant="success">
                      {assignment.marksObtained} / {assignment.maxMarks} marks
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {assignment.teacherFeedback}
                  </p>
                </Card>
              )}

              {assignment.submission ? (
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-5 w-5 text-[var(--color-semantic-success)]" />
                      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                        Submission Confirmation
                      </h2>
                    </div>
                    <Badge variant="success">
                      {assignment.submission.onTime ? 'Submitted on time' : 'Submitted'}
                    </Badge>
                  </div>

                  <dl className="mt-4 space-y-3 text-sm">
                    <div>
                      <dt className="text-xs font-medium text-[var(--color-text-muted)]">
                        Submitted At
                      </dt>
                      <dd className="mt-0.5 font-mono text-xs text-[var(--color-text-primary)]">
                        {assignment.submission.submittedAt}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-medium text-[var(--color-text-muted)]">
                        Written Response
                      </dt>
                      <dd className="mt-1 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] p-3 text-sm text-[var(--color-text-secondary)]">
                        {assignment.submission.responseText}
                      </dd>
                    </div>

                    {assignment.submission.fileName && (
                      <div>
                        <dt className="text-xs font-medium text-[var(--color-text-muted)]">
                          Uploaded File
                        </dt>
                        <dd className="mt-1 inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-white px-3 py-2 text-xs font-medium text-[var(--color-text-primary)]">
                          <FileTextIcon className="h-4 w-4 text-[var(--color-brand-primary)]" />
                          <span>{assignment.submission.fileName}</span>
                          {assignment.submission.fileSizeLabel && (
                            <span className="text-[var(--color-text-muted)]">
                              ({assignment.submission.fileSizeLabel})
                            </span>
                          )}
                        </dd>
                      </div>
                    )}
                  </dl>
                </Card>
              ) : (
                <Card>
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    Submit Your Work
                  </h2>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Enter your written response and optionally attach your completed worksheet or
                    project file (up to 10 MB).
                  </p>

                  <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4">
                    <div>
                      <label
                        htmlFor="submission-response"
                        className="block text-sm font-medium text-[var(--color-text-primary)]"
                      >
                        Written Response / Solution Notes
                      </label>
                      <textarea
                        id="submission-response"
                        rows={5}
                        {...register('responseText')}
                        aria-invalid={Boolean(errors.responseText)}
                        aria-describedby={
                          errors.responseText ? 'submission-response-error' : undefined
                        }
                        placeholder="Summarize your steps, findings, or final answers..."
                        className="mt-1.5 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                      />
                      {errors.responseText && (
                        <p
                          id="submission-response-error"
                          role="alert"
                          className="mt-1 text-xs font-medium text-[var(--color-semantic-danger)]"
                        >
                          {errors.responseText.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="submission-file"
                        className="block text-sm font-medium text-[var(--color-text-primary)]"
                      >
                        Attach Coursework File (Optional)
                      </label>
                      <label
                        htmlFor="submission-file"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed px-4 py-6 text-center transition-colors ${isDragging
                            ? 'border-[var(--color-brand-primary)] bg-blue-50/50'
                            : 'border-[var(--color-border-default)] bg-[var(--color-surface-canvas)] hover:border-[var(--color-brand-primary)] hover:bg-blue-50/30'
                          }`}
                      >
                        <UploadCloudIcon className="h-7 w-7 text-[var(--color-brand-primary)]" />
                        <span className="mt-2 text-sm font-medium text-[var(--color-text-primary)]">
                          {selectedFile
                            ? `Selected: ${selectedFile.name} (${selectedFile.sizeLabel})`
                            : 'Drag & drop or click to choose a file'}
                        </span>
                        <span className="mt-1 text-xs text-[var(--color-text-muted)]">
                          PDF, DOCX, PNG, JPG, TXT, or PY · Max 10 MB
                        </span>
                        <input
                          id="submission-file"
                          type="file"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.py"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                      {selectedFile && (
                        <div className="mt-2 flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-white px-3 py-2 text-xs">
                          <span className="truncate font-medium text-[var(--color-text-primary)]">
                            {selectedFile.name} ({selectedFile.sizeLabel})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              setFileError(null);
                            }}
                            aria-label="Remove selected file"
                            className="inline-flex items-center gap-1 font-medium text-[var(--color-semantic-danger)] hover:underline cursor-pointer"
                          >
                            <XIcon className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      )}
                      {fileError && (
                        <p
                          role="alert"
                          className="mt-1 text-xs font-medium text-[var(--color-semantic-danger)]"
                        >
                          {fileError}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--color-border-subtle)] pt-4">
                      <Button
                        type="submit"
                        isLoading={submitMutation.isPending}
                        disabled={Boolean(fileError)}
                      >
                        Submit Assignment
                      </Button>
                    </div>
                  </form>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
