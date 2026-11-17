import { useState } from 'react';
import type { BulkImportCategory } from '@fsd-sdg4/contracts';
import {
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Badge, Button, Modal } from '@/components/ui';

interface InvitationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: BulkImportCategory;
  schoolName?: string;
}

export function InvitationPreviewModal({
  isOpen,
  onClose,
  defaultRole = 'STUDENTS',
  schoolName = 'Apex International Academy',
}: InvitationPreviewModalProps) {
  const [activeRole, setActiveRole] = useState<BulkImportCategory>(defaultRole);

  const rolePreviews = {
    STUDENTS: {
      title: 'Student Portal Invitation',
      subject: `Welcome to EDVARQ — Activate your Student Account at ${schoolName}`,
      recipientName: 'Dev Sharma',
      recipientEmail: 'dev.sharma@example.com',
      metadataLabel: 'Student Identifier',
      metadataValue: 'STU-2026-042',
      academicInfo: 'Class: Grade 10 • Section: A (Academic Year 2026–2027)',
      headline: 'Your Student Portal Is Ready for Activation',
      intro: `You have been registered as a student at ${schoolName}. Complete your account setup to access your class schedule, homework assignments, attendance records, and learning assessments through the EDVARQ intelligence platform.`,
      buttonText: 'Activate Student Account & Set Password',
      roleBadge: 'STUDENT',
      roleIcon: GraduationCap,
      highlights: [
        'Secure single-use activation valid for 7 days',
        'Zero default passwords — you create your own secure password',
        'Direct access to digital class materials and assignments',
      ],
    },
    TEACHERS: {
      title: 'Faculty & Staff Invitation',
      subject: `Faculty Onboarding — Join ${schoolName} on EDVARQ`,
      recipientName: 'Dr. Ananya Rao',
      recipientEmail: 'ananya.rao@example.com',
      metadataLabel: 'Employee ID',
      metadataValue: 'EMP-FAC-108',
      academicInfo: 'Department: Mathematics & Physical Sciences • Role: Faculty',
      headline: 'Welcome to the Institutional Intelligence Platform',
      intro: `The administration of ${schoolName} has provisioned your faculty workspace on EDVARQ. Please activate your account to begin managing attendance, curriculum subjects, student gradebooks, and collaborative academic schedules.`,
      buttonText: 'Accept Faculty Invitation & Set Password',
      roleBadge: 'TEACHER',
      roleIcon: Users,
      highlights: [
        'Role-based access permissions provisioned by School Administration',
        'Multi-factor authentication supported upon password creation',
        'Integrated gradebook, attendance roster, and assessment workflows',
      ],
    },
    PARENTS: {
      title: 'Parent & Guardian Invitation',
      subject: `Family Access Portal — Connect to ${schoolName} on EDVARQ`,
      recipientName: 'Mr. Rajesh Sharma',
      recipientEmail: 'rajesh.sharma@example.com',
      metadataLabel: 'Linked Student',
      metadataValue: 'Dev Sharma (STU-2026-042)',
      academicInfo: 'Relationship: Father / Primary Legal Guardian',
      headline: 'Stay Connected with Your Child’s Education',
      intro: `You have been invited by ${schoolName} to join the EDVARQ Family Portal as the registered guardian of Dev Sharma. Stay informed with real-time academic updates, attendance notifications, report cards, and school communications.`,
      buttonText: 'Activate Parent Portal Access',
      roleBadge: 'PARENT',
      roleIcon: HeartHandshake,
      highlights: [
        'Real-time attendance notifications and verified daily logs',
        'Continuous visibility into assessment grades and teacher feedback',
        'Secure parent-school messaging and official circulars',
      ],
    },
  };

  const preview = rolePreviews[activeRole];
  const Icon = preview.roleIcon;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Email Invitation Preview"
      description="Inspect the authentic branded email template received by imported users before approving bulk delivery."
      size="lg"
    >
      <div className="space-y-5">
        {/* Role Selector Tabs */}
        <div
          role="tablist"
          aria-label="Role invitation preview selector"
          className="flex rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] p-1 gap-1"
        >
          {(
            [
              { key: 'STUDENTS', label: 'Student Invitation', icon: GraduationCap },
              { key: 'TEACHERS', label: 'Staff & Faculty', icon: Users },
              { key: 'PARENTS', label: 'Parent / Guardian', icon: HeartHandshake },
            ] as const
          ).map((tab) => {
            const TabIcon = tab.icon;
            const isSelected = activeRole === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveRole(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] transition-all ${
                  isSelected
                    ? 'bg-white text-[var(--color-brand-primary)] shadow-xs font-bold'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/50'
                }`}
              >
                <TabIcon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Email Header Simulation */}
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] p-3.5 text-xs space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-[var(--color-text-secondary)]">
            <span className="font-semibold text-[var(--color-text-primary)] font-sans">From:</span>
            <span className="truncate">EDVARQ Notifications &lt;invitations@edvarq.com&gt;</span>
          </div>
          <div className="flex items-center justify-between text-[var(--color-text-secondary)]">
            <span className="font-semibold text-[var(--color-text-primary)] font-sans">To:</span>
            <span className="truncate">
              {preview.recipientName} &lt;{preview.recipientEmail}&gt;
            </span>
          </div>
          <div className="flex items-center justify-between text-[var(--color-text-secondary)]">
            <span className="font-semibold text-[var(--color-text-primary)] font-sans">
              Subject:
            </span>
            <span className="truncate text-[var(--color-brand-primary)] font-semibold font-sans">
              {preview.subject}
            </span>
          </div>
        </div>

        {/* Rendered Email Body Canvas */}
        <div className="rounded-[var(--radius-lg)] border border-slate-200 bg-white p-6 shadow-xs max-h-[460px] overflow-y-auto">
          {/* Branded Header */}
          <div className="border-b border-slate-100 pb-5 text-center">
            <div className="inline-flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[var(--color-brand-primary)] text-white flex items-center justify-center font-bold text-sm tracking-widest shadow-xs">
                E
              </div>
              <span className="text-xl font-bold tracking-tight text-[var(--color-brand-primary)]">
                EDVARQ
              </span>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                Institutional Intelligence
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{schoolName}</p>
          </div>

          {/* Email Body */}
          <div className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="neutral" className="inline-flex items-center gap-1.5 text-xs py-0.5">
                <Icon className="h-3.5 w-3.5" />
                <span>{preview.roleBadge} PORTAL ACCESS</span>
              </Badge>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-600">{preview.metadataLabel}:</span>
              <span className="font-mono text-xs font-semibold text-slate-900">
                {preview.metadataValue}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 leading-snug">{preview.headline}</h3>

            <p className="text-sm text-slate-600 leading-relaxed">
              Hello <strong className="text-slate-900">{preview.recipientName}</strong>,
            </p>

            <p className="text-sm text-slate-600 leading-relaxed">{preview.intro}</p>

            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3.5 text-xs text-slate-700 font-medium space-y-1">
              <div className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                Academic Association
              </div>
              <div>{preview.academicInfo}</div>
            </div>

            {/* Call to Action Button */}
            <div className="py-3 text-center">
              <div className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-brand-primary)] px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition-colors pointer-events-none">
                <span>{preview.buttonText}</span>
                <ExternalLink className="h-4 w-4" />
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Activation Link:{' '}
                <span className="font-mono text-blue-600 underline">
                  https://edvarq.com/accept-invitation?token=••••••••
                </span>
              </p>
            </div>

            {/* Highlights Card */}
            <div className="rounded-lg bg-emerald-50/70 border border-emerald-100 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 mb-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Zero Default Passwords & Security Standards</span>
              </div>
              <ul className="space-y-1 text-xs text-emerald-800">
                {preview.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Institutional Security Notice */}
            <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-400 leading-normal space-y-1">
              <p>
                <strong>Security Notice:</strong> This invitation was officially authorized by an
                administrator at {schoolName}. The single-use activation link expires in 7 days. If
                you did not expect this invitation, please contact your institution administrator.
              </p>
              <p>
                © 2026 EDVARQ Inc. All rights reserved. • Data Privacy & Institutional Governance
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-[var(--color-text-secondary)]">
            Preview is based on active school branding and tenant settings.
          </p>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </Modal>
  );
}
