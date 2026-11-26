import { z } from '@fsd-sdg4/validation';

export const assignmentSubmissionSchema = z.object({
  responseText: z
    .string()
    .trim()
    .min(15, 'Please write at least 15 characters describing your work or solution.')
    .max(4000, 'Submission notes must not exceed 4,000 characters.'),
  fileName: z.string().optional(),
  fileSizeLabel: z.string().optional(),
});

export type AssignmentSubmissionFormValues = z.infer<typeof assignmentSubmissionSchema>;

export const contactTeacherSchema = z.object({
  teacherId: z.string().trim().min(1, 'Please select a teacher.'),
  subject: z
    .string()
    .trim()
    .min(4, 'Subject must be at least 4 characters.')
    .max(120, 'Subject must be 120 characters or fewer.'),
  message: z
    .string()
    .trim()
    .min(15, 'Please write a clear message (at least 15 characters).')
    .max(1500, 'Message must be 1,500 characters or fewer.'),
});

export type ContactTeacherFormValues = z.infer<typeof contactTeacherSchema>;

export const reportIssueSchema = z.object({
  category: z.enum([
    'Portal Navigation',
    'File Upload',
    'Timetable / Schedule',
    'Display / Access',
  ]),
  summary: z
    .string()
    .trim()
    .min(5, 'Please provide a short summary (at least 5 characters).')
    .max(120, 'Summary must be 120 characters or fewer.'),
  details: z
    .string()
    .trim()
    .min(15, 'Please describe what happened (at least 15 characters).')
    .max(2000, 'Details must not exceed 2,000 characters.'),
});

export type ReportIssueFormValues = z.infer<typeof reportIssueSchema>;

export const studentProfileSettingsSchema = z.object({
  studyFocus: z
    .string()
    .trim()
    .min(4, 'Study focus must be at least 4 characters.')
    .max(120, 'Study focus must be 120 characters or fewer.'),
  bio: z
    .string()
    .trim()
    .min(10, 'Learning bio must be at least 10 characters.')
    .max(300, 'Learning bio must be 300 characters or fewer.'),
});

export type StudentProfileSettingsFormValues = z.infer<typeof studentProfileSettingsSchema>;
