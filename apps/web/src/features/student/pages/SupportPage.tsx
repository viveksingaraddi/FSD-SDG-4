import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ChevronDownIcon, LifeBuoyIcon, SearchIcon } from '../../../components/icons/Icons.js';
import { LoadingState, StudentLayout } from '../../../components/student/index.js';
import { Badge, Button, Card, useToast } from '../../../components/ui/index.js';
import { createZodResolver } from '../../../lib/zodResolver.js';
import {
  useStudentSupport,
  useSubmitIssueReport,
  useSubmitTeacherMessage,
} from '../hooks/useStudentPortal.js';
import {
  contactTeacherSchema,
  reportIssueSchema,
  type ContactTeacherFormValues,
  type ReportIssueFormValues,
} from '../schemas/studentSchemas.js';

export function SupportPage() {
  const { showToast } = useToast();
  const { data: supportData, isLoading } = useStudentSupport();
  const sendMessageMutation = useSubmitTeacherMessage();
  const reportIssueMutation = useSubmitIssueReport();

  const [faqQuery, setFaqQuery] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  const teacherForm = useForm<ContactTeacherFormValues>({
    resolver: createZodResolver(contactTeacherSchema),
    defaultValues: {
      teacherId: '',
      subject: '',
      message: '',
    },
  });

  const issueForm = useForm<ReportIssueFormValues>({
    resolver: createZodResolver(reportIssueSchema),
    defaultValues: {
      category: 'Portal Navigation',
      summary: '',
      details: '',
    },
  });

  const filteredFaqs = useMemo(() => {
    const term = faqQuery.trim().toLowerCase();
    return (supportData?.faqs ?? []).filter(
      (f) =>
        !term ||
        f.question.toLowerCase().includes(term) ||
        f.answer.toLowerCase().includes(term) ||
        f.category.toLowerCase().includes(term),
    );
  }, [supportData, faqQuery]);

  const handleTeacherSubmit = (values: ContactTeacherFormValues) => {
    sendMessageMutation.mutate(values, {
      onSuccess: (ticket) => {
        showToast({
          type: 'success',
          title: 'Message sent to teacher',
          description: `Reference ${ticket.id} logged for ${ticket.recipientOrCategory}.`,
        });
        teacherForm.reset();
      },
    });
  };

  const handleIssueSubmit = (values: ReportIssueFormValues) => {
    reportIssueMutation.mutate(values, {
      onSuccess: (ticket) => {
        showToast({
          type: 'success',
          title: 'Technical issue reported',
          description: `Support ticket ${ticket.id} created.`,
        });
        issueForm.reset();
      },
    });
  };

  return (
    <StudentLayout
      breadcrumbs={[{ label: 'Student Portal', to: '/student' }, { label: 'Help & Support' }]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Help &amp; Support
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Find answers to common questions, message your subject teachers, or report a technical
            issue.
          </p>
        </div>

        {isLoading || !supportData ? (
          <LoadingState label="Loading help center..." cards={3} />
        ) : (
          <>
            {/* Student Support Info Banner */}
            <Card className="bg-blue-50/40 border-blue-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-primary)] text-white">
                    <LifeBuoyIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                      Greenfield Student Support Desk
                    </h2>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Homeroom Advisor: Ms. Ananya Verma (Room 201) · Learning Commons Help Desk:
                      Mon–Fri, 8:30 AM – 4:30 PM
                    </p>
                  </div>
                </div>
                <Badge variant="brand">Response within 1 school day</Badge>
              </div>
            </Card>

            {/* FAQs */}
            <Card>
              <div className="flex flex-col justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Quick guidance on coursework, attendance, and portal tools
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <label htmlFor="faq-search" className="sr-only">
                    Search FAQs
                  </label>
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    id="faq-search"
                    type="search"
                    value={faqQuery}
                    onChange={(e) => setFaqQuery(e.target.value)}
                    placeholder="Search FAQs..."
                    className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-canvas)] pl-9 pr-3 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 divide-y divide-[var(--color-border-subtle)]">
                {filteredFaqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div key={faq.id} className="py-3 first:pt-0 last:pb-0">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                        className="flex w-full items-center justify-between gap-3 text-left cursor-pointer"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="neutral">{faq.category}</Badge>
                          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                            {faq.question}
                          </span>
                        </div>
                        <ChevronDownIcon
                          className={`h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <p className="mt-2 pl-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Contact Teacher & Report Issue Forms */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Contact Teacher */}
              <Card>
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Contact a Teacher
                </h2>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  Ask a question about a lesson, assignment, or attendance record
                </p>

                <form
                  onSubmit={teacherForm.handleSubmit(handleTeacherSubmit)}
                  noValidate
                  className="mt-4 space-y-4"
                >
                  <div>
                    <label
                      htmlFor="contact-teacher-select"
                      className="block text-xs font-semibold text-[var(--color-text-primary)]"
                    >
                      Select Teacher
                    </label>
                    <select
                      id="contact-teacher-select"
                      {...teacherForm.register('teacherId')}
                      aria-invalid={Boolean(teacherForm.formState.errors.teacherId)}
                      className="mt-1 h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white px-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                    >
                      <option value="">Choose a subject teacher...</option>
                      {supportData.teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.department})
                        </option>
                      ))}
                    </select>
                    {teacherForm.formState.errors.teacherId && (
                      <p role="alert" className="mt-1 text-xs text-[var(--color-semantic-danger)]">
                        {teacherForm.formState.errors.teacherId.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-teacher-subject"
                      className="block text-xs font-semibold text-[var(--color-text-primary)]"
                    >
                      Subject
                    </label>
                    <input
                      id="contact-teacher-subject"
                      type="text"
                      {...teacherForm.register('subject')}
                      aria-invalid={Boolean(teacherForm.formState.errors.subject)}
                      placeholder="e.g., Question about Unit 4 graphing steps"
                      className="mt-1 h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white px-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                    />
                    {teacherForm.formState.errors.subject && (
                      <p role="alert" className="mt-1 text-xs text-[var(--color-semantic-danger)]">
                        {teacherForm.formState.errors.subject.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-teacher-message"
                      className="block text-xs font-semibold text-[var(--color-text-primary)]"
                    >
                      Message
                    </label>
                    <textarea
                      id="contact-teacher-message"
                      rows={4}
                      {...teacherForm.register('message')}
                      aria-invalid={Boolean(teacherForm.formState.errors.message)}
                      placeholder="Write your question clearly..."
                      className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white p-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                    />
                    {teacherForm.formState.errors.message && (
                      <p role="alert" className="mt-1 text-xs text-[var(--color-semantic-danger)]">
                        {teacherForm.formState.errors.message.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" isLoading={sendMessageMutation.isPending}>
                    Send Message to Teacher
                  </Button>
                </form>
              </Card>

              {/* Report Technical Issue */}
              <Card>
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Report a Technical Issue
                </h2>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  Let the school IT &amp; learning support desk know if something isn&apos;t working
                </p>

                <form
                  onSubmit={issueForm.handleSubmit(handleIssueSubmit)}
                  noValidate
                  className="mt-4 space-y-4"
                >
                  <div>
                    <label
                      htmlFor="issue-category"
                      className="block text-xs font-semibold text-[var(--color-text-primary)]"
                    >
                      Issue Category
                    </label>
                    <select
                      id="issue-category"
                      {...issueForm.register('category')}
                      className="mt-1 h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white px-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                    >
                      <option value="Portal Navigation">Portal Navigation</option>
                      <option value="File Upload">File Upload</option>
                      <option value="Timetable / Schedule">Timetable / Schedule</option>
                      <option value="Display / Access">Display / Access</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="issue-summary"
                      className="block text-xs font-semibold text-[var(--color-text-primary)]"
                    >
                      Short Summary
                    </label>
                    <input
                      id="issue-summary"
                      type="text"
                      {...issueForm.register('summary')}
                      aria-invalid={Boolean(issueForm.formState.errors.summary)}
                      placeholder="e.g., Unable to preview PDF resource on tablet"
                      className="mt-1 h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white px-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                    />
                    {issueForm.formState.errors.summary && (
                      <p role="alert" className="mt-1 text-xs text-[var(--color-semantic-danger)]">
                        {issueForm.formState.errors.summary.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="issue-details"
                      className="block text-xs font-semibold text-[var(--color-text-primary)]"
                    >
                      Details
                    </label>
                    <textarea
                      id="issue-details"
                      rows={4}
                      {...issueForm.register('details')}
                      aria-invalid={Boolean(issueForm.formState.errors.details)}
                      placeholder="Describe the page you were on and what happened..."
                      className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white p-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                    />
                    {issueForm.formState.errors.details && (
                      <p role="alert" className="mt-1 text-xs text-[var(--color-semantic-danger)]">
                        {issueForm.formState.errors.details.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="secondary"
                    isLoading={reportIssueMutation.isPending}
                  >
                    Submit Issue Report
                  </Button>
                </form>
              </Card>
            </div>

            {/* Recent Support Requests */}
            <Card>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Recent Support Requests
              </h2>
              <div className="mt-3 divide-y divide-[var(--color-border-subtle)]">
                {supportData.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[var(--color-brand-primary)]">
                          {ticket.id}
                        </span>
                        <Badge variant={ticket.status === 'Sent' ? 'success' : 'info'}>
                          {ticket.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                        {ticket.subject}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {ticket.recipientOrCategory} · {ticket.createdAt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
