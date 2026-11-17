import crypto from 'node:crypto';
import xlsx from 'xlsx';
import { Prisma, type BulkImportStatus, type UserRole } from '@prisma/client';
import type {
  BulkImportCategory,
  BulkImportJobDto,
  BulkImportJobsListResponseDto,
  BulkImportPreviewResponseDto,
  BulkImportRowErrorDto,
  BulkImportRowPreviewDto,
} from '@fsd-sdg4/contracts';
import {
  normalizeSectionName,
  parentImportRowSchema,
  studentImportRowSchema,
  teacherImportRowSchema,
  type BulkImportFilterQuery,
  type ParentImportRowInput,
  type StudentImportRowInput,
  type TeacherImportRowInput,
} from '@fsd-sdg4/validation';
import { prisma } from '../../shared/db/prisma.js';
import { BadRequestError, NotFoundError } from '../../shared/errors/appError.js';
import { hashPassword } from '../../shared/security/password.js';
import { AUDIT_ACTIONS, recordAuditEvent } from '../audit/audit.service.js';
import { createInvitation } from '../invitations/invitation.service.js';
import { dispatchInvitationEmail } from '../mail/mail.service.js';

// ─── CSV / Spreadsheet Constants & Helpers ─────────────────────────────────

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_IMPORT_ROWS = 2000;

/**
 * Sanitizes spreadsheet fields to prevent CSV Formula Injection (CWE-1236).
 * Prepend single-quote if text begins with formula triggers (=, +, -, @, \t, \r).
 */
export function sanitizeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str.trim();
}

/**
 * Normalizes an arbitrary header string by stripping whitespace, underscores, dashes, and casing.
 */
export function normalizeHeaderKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Intelligent section matcher:
 * Resolves section records whether the input or DB record is "A", "Section A", "8-A", or custom name.
 */
export function findMatchingSection(
  sections: Array<{ id: string; name: string }>,
  inputSectionName: string,
): { id: string; name: string } | undefined {
  if (!inputSectionName) return undefined;
  const raw = inputSectionName.trim().toLowerCase();
  const normalized = normalizeSectionName(inputSectionName).toLowerCase();

  // 1. Exact match (case-insensitive)
  const exact = sections.find((s) => s.name.trim().toLowerCase() === raw);
  if (exact) return exact;

  // 2. Normalized match (e.g. DB has "A" and input is "Section A", or vice-versa)
  const normMatch = sections.find((s) => normalizeSectionName(s.name).toLowerCase() === normalized);
  if (normMatch) return normMatch;

  // 3. Substring / suffix match (e.g. DB has "8-A" and input is "Section A" or "A", or DB has "A" and input is "8-A")
  const suffixMatch = sections.find((s) => {
    const sNorm = normalizeSectionName(s.name).toLowerCase();
    return (
      sNorm.endsWith(`-${normalized}`) ||
      sNorm.endsWith(` ${normalized}`) ||
      normalized.endsWith(`-${sNorm}`) ||
      normalized.endsWith(` ${sNorm}`)
    );
  });
  if (suffixMatch) return suffixMatch;

  return undefined;
}

/**
 * Maps raw sheet row data using common header aliases into canonical schema keys.
 * Preserves clean values, trims surrounding whitespace, and prevents unintended timezone skew on Date cells.
 */
export function mapRowByAliases(
  row: Record<string, unknown>,
  aliasMap: Record<string, string[]>,
): Record<string, string> {
  const normalizedRow: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    let formattedVal = '';
    if (v instanceof Date && !isNaN(v.getTime())) {
      // Safe UTC date formatting to avoid local timezone offset shift
      const y = v.getUTCFullYear();
      const m = String(v.getUTCMonth() + 1).padStart(2, '0');
      const d = String(v.getUTCDate()).padStart(2, '0');
      formattedVal = `${y}-${m}-${d}`;
    } else if (v !== undefined && v !== null) {
      formattedVal = String(v).trim();
    }
    normalizedRow[normalizeHeaderKey(k)] = formattedVal;
  }

  const result: Record<string, string> = {};
  for (const [canonicalKey, aliases] of Object.entries(aliasMap)) {
    for (const alias of aliases) {
      const normAlias = normalizeHeaderKey(alias);
      if (normalizedRow[normAlias] !== undefined && normalizedRow[normAlias] !== '') {
        result[canonicalKey] = normalizedRow[normAlias].trim();
        break;
      }
    }
    if (result[canonicalKey] === undefined) {
      result[canonicalKey] = '';
    }
  }

  return result;
}

const STUDENT_ALIASES: Record<string, string[]> = {
  firstName: ['firstName', 'first_name', 'first', 'givenName'],
  lastName: ['lastName', 'last_name', 'last', 'surname', 'familyName'],
  studentIdNumber: ['studentIdNumber', 'studentId', 'student_id', 'rollNo', 'admissionNo'],
  email: ['email', 'studentEmail', 'emailAddress'],
  className: ['className', 'class', 'grade', 'standard'],
  sectionName: ['sectionName', 'section', 'stream', 'division'],
  academicYearName: ['academicYearName', 'academicYear', 'year', 'session'],
  admissionDate: [
    'admissionDate',
    'admission_date',
    'dateOfAdmission',
    'date_of_admission',
    'dateOfJoining',
    'enrollmentDate',
  ],
  dateOfBirth: ['dateOfBirth', 'date_of_birth', 'dob', 'birthDate', 'birth_date'],
  gender: ['gender', 'sex'],
  parentEmail: ['parentEmail', 'guardianEmail', 'parent_email'],
  parentName: ['parentName', 'guardianName', 'parent_name'],
  parentRelationship: ['parentRelationship', 'relationship', 'guardianRelationship'],
};

const TEACHER_ALIASES: Record<string, string[]> = {
  firstName: ['firstName', 'first_name', 'first', 'givenName'],
  lastName: ['lastName', 'last_name', 'last', 'surname'],
  email: ['email', 'teacherEmail', 'workEmail', 'emailAddress'],
  employeeId: ['employeeId', 'employee_id', 'empId', 'staffId', 'staff_id'],
  specialization: ['specialization', 'subject', 'department', 'discipline'],
};

const PARENT_ALIASES: Record<string, string[]> = {
  firstName: ['firstName', 'first_name', 'first', 'givenName'],
  lastName: ['lastName', 'last_name', 'last', 'surname'],
  email: ['email', 'parentEmail', 'guardianEmail', 'emailAddress'],
  studentIdNumber: ['studentIdNumber', 'studentId', 'student_id', 'childId', 'childStudentId'],
  relationshipType: ['relationshipType', 'relationship', 'type'],
  isPrimaryContact: ['isPrimaryContact', 'primary', 'isPrimary'],
};

// ─── File Parsing ──────────────────────────────────────────────────────────

export function parseRawSpreadsheet(
  buffer: Buffer,
  category: BulkImportCategory,
): { rows: Array<Record<string, string>>; rawHeaders: string[] } {
  let workbook: xlsx.WorkBook;
  try {
    workbook = xlsx.read(buffer, {
      type: 'buffer',
      raw: false,
      dateNF: 'yyyy-mm-dd',
      cellDates: false,
    });
  } catch {
    throw new BadRequestError(
      'Failed to parse uploaded file. Please provide a valid CSV or XLSX spreadsheet.',
    );
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new BadRequestError('Uploaded spreadsheet contains no sheets.');
  }

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new BadRequestError('Uploaded spreadsheet contains an empty worksheet.');
  }

  const rawJson = xlsx.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
    raw: false,
    dateNF: 'yyyy-mm-dd',
  });

  if (rawJson.length === 0) {
    throw new BadRequestError('Uploaded spreadsheet contains no data rows.');
  }

  if (rawJson.length > MAX_IMPORT_ROWS) {
    throw new BadRequestError(
      `File exceeds maximum limit of ${MAX_IMPORT_ROWS} rows. Please split the file into smaller batches.`,
    );
  }

  const rawHeaders = Object.keys(rawJson[0] ?? {});
  const aliasMap =
    category === 'STUDENTS'
      ? STUDENT_ALIASES
      : category === 'TEACHERS'
        ? TEACHER_ALIASES
        : PARENT_ALIASES;

  const rows = rawJson.map((r) => mapRowByAliases(r, aliasMap));
  return { rows, rawHeaders };
}

// ─── Template Generation ───────────────────────────────────────────────────

export function generateTemplate(
  category: BulkImportCategory,
  format: 'csv' | 'xlsx',
): { buffer: Buffer; contentType: string; filename: string } {
  const wb = xlsx.utils.book_new();

  let sampleData: Array<Record<string, string>> = [];
  let sheetName = 'Import_Template';

  if (category === 'STUDENTS') {
    sheetName = 'Students';
    sampleData = [
      {
        'First Name': 'Aarav',
        'Last Name': 'Patel',
        'Student ID Number': 'STU-2026-001',
        'Student Email': 'aarav.patel@student.example.com',
        'Class Name': 'Grade 10',
        'Section Name': 'A',
        'Academic Year Name': '2026-2027',
        'Admission Date': '2026-06-01',
        'Date of Birth': '2010-04-15',
        Gender: 'MALE',
        'Parent Email': 'rajesh.patel@example.com',
        'Parent Name': 'Rajesh Patel',
        'Parent Relationship': 'FATHER',
      },
    ];
  } else if (category === 'TEACHERS') {
    sheetName = 'Teachers';
    sampleData = [
      {
        'First Name': 'Dr. Ananya',
        'Last Name': 'Deshmukh',
        'Email Address': 'ananya.deshmukh@school.example.com',
        'Employee ID': 'EMP-2026-101',
        Specialization: 'Physics & General Science',
      },
    ];
  } else {
    sheetName = 'Parents';
    sampleData = [
      {
        'First Name': 'Sunita',
        'Last Name': 'Sharma',
        'Email Address': 'sunita.sharma@example.com',
        'Student ID Number': 'STU-2026-001',
        'Relationship Type': 'MOTHER',
        'Is Primary Contact': 'Yes',
      },
    ];
  }

  const ws = xlsx.utils.json_to_sheet(sampleData);
  xlsx.utils.book_append_sheet(wb, ws, sheetName);

  if (format === 'xlsx') {
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    return {
      buffer,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `edvarq-${category.toLowerCase()}-import-template.xlsx`,
    };
  }

  const csvString = xlsx.utils.sheet_to_csv(ws);
  return {
    buffer: Buffer.from(csvString, 'utf8'),
    contentType: 'text/csv; charset=utf-8',
    filename: `edvarq-${category.toLowerCase()}-import-template.csv`,
  };
}

// ─── Validation & Preview Engine ───────────────────────────────────────────

export interface InternalValidationRowResult {
  rowNumber: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  raw: Record<string, string>;
  parsedStudent?: StudentImportRowInput | undefined;
  parsedTeacher?: TeacherImportRowInput | undefined;
  parsedParent?: ParentImportRowInput | undefined;
  resolvedClassId?: string | undefined;
  resolvedSectionId?: string | undefined;
  resolvedAcademicYearId?: string | undefined;
  resolvedStudentId?: string | undefined;
}

const isNonEmptyString = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0;

export async function validateImportRows(
  schoolId: string,
  category: BulkImportCategory,
  rows: Array<Record<string, string>>,
): Promise<InternalValidationRowResult[]> {
  const extractedEmails = rows
    .map((r) => r['email']?.toLowerCase().trim())
    .filter(isNonEmptyString);

  // Pre-fetch school context for fast batch validation
  const [classes, activeAcademicYear, existingUsers] = await Promise.all([
    prisma.class.findMany({
      where: { schoolId },
      include: { sections: true },
    }),
    prisma.academicYear.findFirst({
      where: { schoolId, status: 'ACTIVE' },
    }),
    prisma.user.findMany({
      where: {
        email: { in: extractedEmails },
      },
      select: { id: true, email: true, role: true },
    }),
  ]);

  const existingEmailMap = new Map(existingUsers.map((u) => [u.email.toLowerCase(), u]));

  // Pre-fetch category-specific existing keys
  const existingTeacherIds = new Set<string>();
  const existingStudentIds = new Set<string>();
  const schoolStudentsMap = new Map<
    string,
    { id: string; studentIdNumber: string; firstName: string; lastName: string }
  >();

  if (category === 'TEACHERS') {
    const employeeIds = rows.map((r) => r['employeeId']?.trim()).filter(isNonEmptyString);
    const existingStaff = await prisma.teacherProfile.findMany({
      where: { schoolId, employeeId: { in: employeeIds } },
      select: { employeeId: true },
    });
    existingStaff.forEach((s) => existingTeacherIds.add(s.employeeId));
  } else if (category === 'STUDENTS') {
    const studentIds = rows.map((r) => r['studentIdNumber']?.trim()).filter(isNonEmptyString);
    const existingStudents = await prisma.studentProfile.findMany({
      where: { schoolId, studentIdNumber: { in: studentIds } },
      select: { studentIdNumber: true },
    });
    existingStudents.forEach((s) => existingStudentIds.add(s.studentIdNumber));
  } else if (category === 'PARENTS') {
    const studentIds = rows.map((r) => r['studentIdNumber']?.trim()).filter(isNonEmptyString);
    const studentsInSchool = await prisma.studentProfile.findMany({
      where: { schoolId, studentIdNumber: { in: studentIds } },
      select: { id: true, studentIdNumber: true, firstName: true, lastName: true },
    });
    studentsInSchool.forEach((s) => schoolStudentsMap.set(s.studentIdNumber, s));
  }

  // Build lookup maps for Class and Section
  const classMap = new Map<string, (typeof classes)[number]>();
  classes.forEach((c) => {
    classMap.set(c.name.toLowerCase().trim(), c);
  });

  const seenEmailsInFile = new Set<string>();
  const seenIdsInFile = new Set<string>();

  const results: InternalValidationRowResult[] = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx]!;
    const rowNumber = idx + 2; // Row 1 is header
    const errors: string[] = [];
    const warnings: string[] = [];

    const email = row['email']?.toLowerCase().trim() ?? '';
    const idNum =
      (category === 'TEACHERS' ? row['employeeId'] : row['studentIdNumber'])?.trim() ?? '';

    // In-file duplicate checking
    if (email) {
      if (seenEmailsInFile.has(email)) {
        errors.push(`Duplicate email "${email}" found in multiple rows within this file.`);
      } else {
        seenEmailsInFile.add(email);
      }
    }

    if (idNum && category !== 'PARENTS') {
      if (seenIdsInFile.has(idNum)) {
        errors.push(`Duplicate identifier "${idNum}" found in multiple rows within this file.`);
      } else {
        seenIdsInFile.add(idNum);
      }
    }

    if (category === 'STUDENTS') {
      const parsed = studentImportRowSchema.safeParse(row);
      if (!parsed.success) {
        parsed.error.issues.forEach((issue) => {
          errors.push(`${issue.path.join('.') || 'Field'}: ${issue.message}`);
        });
      }

      if (existingEmailMap.has(email)) {
        errors.push(`A platform user with email "${email}" already exists.`);
      }

      if (idNum && existingStudentIds.has(idNum)) {
        errors.push(`A student with Student ID "${idNum}" already exists in this school.`);
      }

      // Validate Class and Section
      const className = row['className']?.toLowerCase().trim() ?? '';
      const sectionName = row['sectionName']?.toLowerCase().trim() ?? '';
      let resolvedClassId: string | undefined;
      let resolvedSectionId: string | undefined;

      if (!className) {
        errors.push('Class name is required.');
      } else {
        const cls = classMap.get(className);
        if (!cls) {
          errors.push(`Class "${row['className']}" does not exist in this school.`);
        } else {
          resolvedClassId = cls.id;
          const sec = findMatchingSection(cls.sections, row['sectionName'] ?? '');
          if (!sec) {
            errors.push(`Section "${row['sectionName']}" not found in class "${cls.name}".`);
          } else {
            resolvedSectionId = sec.id;
          }
        }
      }

      if (!activeAcademicYear) {
        errors.push(
          'No active academic year found in this school. Please activate an academic calendar first.',
        );
      }

      results.push({
        rowNumber,
        isValid: errors.length === 0,
        errors,
        warnings,
        raw: row,
        parsedStudent: parsed.success ? parsed.data : undefined,
        resolvedClassId,
        resolvedSectionId,
        resolvedAcademicYearId: activeAcademicYear?.id,
      });
    } else if (category === 'TEACHERS') {
      const parsed = teacherImportRowSchema.safeParse(row);
      if (!parsed.success) {
        parsed.error.issues.forEach((issue) => {
          errors.push(`${issue.path.join('.') || 'Field'}: ${issue.message}`);
        });
      }

      if (existingEmailMap.has(email)) {
        errors.push(`A platform user with email "${email}" already exists.`);
      }

      if (idNum && existingTeacherIds.has(idNum)) {
        errors.push(`A teacher with Employee ID "${idNum}" already exists in this school.`);
      }

      results.push({
        rowNumber,
        isValid: errors.length === 0,
        errors,
        warnings,
        raw: row,
        parsedTeacher: parsed.success ? parsed.data : undefined,
      });
    } else {
      // PARENTS
      const parsed = parentImportRowSchema.safeParse(row);
      if (!parsed.success) {
        parsed.error.issues.forEach((issue) => {
          errors.push(`${issue.path.join('.') || 'Field'}: ${issue.message}`);
        });
      }

      const studentId = row['studentIdNumber']?.trim();
      let resolvedStudentId: string | undefined;
      if (!studentId) {
        errors.push('Student ID is required to establish guardian linkage.');
      } else {
        const student = schoolStudentsMap.get(studentId);
        if (!student) {
          errors.push(`Student with ID "${studentId}" was not found in this school.`);
        } else {
          resolvedStudentId = student.id;
        }
      }

      // Check if existing user has incompatible role
      const existing = existingEmailMap.get(email);
      if (existing && existing.role !== 'PARENT') {
        errors.push(
          `User "${email}" exists with role "${existing.role}". Cannot convert to Parent.`,
        );
      }

      results.push({
        rowNumber,
        isValid: errors.length === 0,
        errors,
        warnings,
        raw: row,
        parsedParent: parsed.success ? parsed.data : undefined,
        resolvedStudentId,
      });
    }
  }

  return results;
}

export async function parseAndValidateImportFile(
  schoolId: string,
  category: BulkImportCategory,
  fileBuffer: Buffer,
  filename: string,
): Promise<BulkImportPreviewResponseDto> {
  const { rows, rawHeaders } = parseRawSpreadsheet(fileBuffer, category);
  const validatedRows = await validateImportRows(schoolId, category, rows);

  const totalRows = validatedRows.length;
  const validRows = validatedRows.filter((r) => r.isValid).length;
  const invalidRows = totalRows - validRows;
  const duplicateRows = validatedRows.filter((r) =>
    r.errors.some((e) => e.toLowerCase().includes('duplicate')),
  ).length;

  const detectedRows: BulkImportRowPreviewDto[] = validatedRows.slice(0, 50).map((r) => ({
    rowNumber: r.rowNumber,
    isValid: r.isValid,
    data: r.raw,
    errors: r.errors,
    warnings: r.warnings,
  }));

  return {
    category,
    filename,
    fileSize: fileBuffer.length,
    totalRows,
    validRows,
    invalidRows,
    duplicateRows,
    columns: rawHeaders,
    detectedRows,
    eligibleInvitations: validRows,
    canProceed: validRows > 0,
  };
}

// ─── Import Execution & Automated Invitations ──────────────────────────────

export async function executeImportJob(
  schoolId: string,
  actorId: string,
  category: BulkImportCategory,
  fileBuffer: Buffer,
  filename: string,
  options: {
    idempotencyKey?: string | undefined;
    skipInvalidRows?: boolean | undefined;
    sendInvitations?: boolean | undefined;
  } = {},
  ipAddress: string | null = null,
): Promise<BulkImportJobDto> {
  // Idempotency verification
  if (options.idempotencyKey) {
    const existingJob = await prisma.bulkImportJob.findUnique({
      where: {
        schoolId_idempotencyKey: {
          schoolId,
          idempotencyKey: options.idempotencyKey,
        },
      },
      include: { actor: { select: { email: true } } },
    });
    if (existingJob) {
      return formatImportJobDto(existingJob);
    }
  }

  const { rows } = parseRawSpreadsheet(fileBuffer, category);
  const validatedRows = await validateImportRows(schoolId, category, rows);

  const totalRows = validatedRows.length;
  const validRows = validatedRows.filter((r) => r.isValid);
  const invalidRows = validatedRows.filter((r) => !r.isValid);

  if (validRows.length === 0) {
    throw new BadRequestError(
      'All rows in the uploaded file contain validation errors. No records can be imported.',
    );
  }

  // Create initial job in database
  const initialJob = await prisma.bulkImportJob.create({
    data: {
      schoolId,
      actorId,
      category,
      filename,
      fileSize: fileBuffer.length,
      status: 'PROCESSING',
      totalRows,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      duplicateRows: validatedRows.filter((r) =>
        r.errors.some((e) => e.toLowerCase().includes('duplicate')),
      ).length,
      idempotencyKey: options.idempotencyKey ?? null,
      startedAt: new Date(),
    },
  });

  const rowErrors: BulkImportRowErrorDto[] = invalidRows.map((r) => ({
    rowNumber: r.rowNumber,
    message: r.errors.join('; '),
    identifier: r.raw['studentIdNumber'] || r.raw['employeeId'] || r.raw['email'],
    rawData: r.raw,
  }));

  const createdInvitations: Array<{
    invitationId: string;
    rawToken: string;
    invitationUrl: string;
    recipientEmail: string;
    recipientName: string;
    role: UserRole;
    schoolName?: string | null;
  }> = [];

  let successfulRows = 0;
  let failedRows = 0;

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { name: true },
  });

  // Process valid rows safely in individual row transactions
  for (const row of validRows) {
    try {
      await prisma.$transaction(async (tx) => {
        const placeholderHash = await hashPassword(crypto.randomBytes(32).toString('hex'));

        if (category === 'STUDENTS' && row.parsedStudent) {
          const studentInput = row.parsedStudent;
          const user = await tx.user.create({
            data: {
              schoolId,
              email: studentInput.email,
              passwordHash: placeholderHash,
              role: 'STUDENT',
              status: 'ACTIVE',
            },
          });

          const profile = await tx.studentProfile.create({
            data: {
              schoolId,
              userId: user.id,
              studentIdNumber: studentInput.studentIdNumber,
              firstName: studentInput.firstName,
              lastName: studentInput.lastName,
              admissionDate: studentInput.admissionDate
                ? new Date(studentInput.admissionDate)
                : new Date(),
              dateOfBirth: studentInput.dateOfBirth ? new Date(studentInput.dateOfBirth) : null,
              gender: studentInput.gender ?? null,
              status: 'ACTIVE',
            },
          });

          if (row.resolvedSectionId && row.resolvedAcademicYearId) {
            await tx.enrollment.create({
              data: {
                schoolId,
                studentId: profile.id,
                sectionId: row.resolvedSectionId,
                academicYearId: row.resolvedAcademicYearId,
                status: 'ACTIVE',
              },
            });
          }

          // Issue student invitation
          const invResult = await createInvitation({
            tx,
            schoolId,
            userId: user.id,
            email: user.email,
            role: 'STUDENT',
            invitedByUserId: actorId,
          });

          createdInvitations.push({
            invitationId: invResult.invitation.id,
            rawToken: invResult.rawToken,
            invitationUrl: invResult.invitationUrl,
            recipientEmail: user.email,
            recipientName: `${studentInput.firstName} ${studentInput.lastName}`,
            role: 'STUDENT',
            schoolName: school?.name ?? null,
          });

          // Handle optional parent linkage if provided in student row
          if (studentInput.parentEmail) {
            let parentUser = await tx.user.findUnique({
              where: { email: studentInput.parentEmail.toLowerCase().trim() },
            });
            let isNewParent = false;
            if (!parentUser) {
              parentUser = await tx.user.create({
                data: {
                  schoolId,
                  email: studentInput.parentEmail.toLowerCase().trim(),
                  passwordHash: placeholderHash,
                  role: 'PARENT',
                  status: 'ACTIVE',
                },
              });
              isNewParent = true;
            }

            await tx.guardianRelationship.create({
              data: {
                schoolId,
                guardianUserId: parentUser.id,
                studentId: profile.id,
                relationshipType: studentInput.parentRelationship ?? 'LEGAL_GUARDIAN',
                isPrimaryContact: true,
                isVerified: false,
              },
            });

            if (isNewParent) {
              const parentInv = await createInvitation({
                tx,
                schoolId,
                userId: parentUser.id,
                email: parentUser.email,
                role: 'PARENT',
                invitedByUserId: actorId,
              });

              createdInvitations.push({
                invitationId: parentInv.invitation.id,
                rawToken: parentInv.rawToken,
                invitationUrl: parentInv.invitationUrl,
                recipientEmail: parentUser.email,
                recipientName: studentInput.parentName || 'Parent / Guardian',
                role: 'PARENT',
                schoolName: school?.name ?? null,
              });
            }
          }
        } else if (category === 'TEACHERS' && row.parsedTeacher) {
          const teacherInput = row.parsedTeacher;
          const user = await tx.user.create({
            data: {
              schoolId,
              email: teacherInput.email,
              passwordHash: placeholderHash,
              role: 'TEACHER',
              status: 'ACTIVE',
            },
          });

          await tx.teacherProfile.create({
            data: {
              schoolId,
              userId: user.id,
              employeeId: teacherInput.employeeId,
              firstName: teacherInput.firstName,
              lastName: teacherInput.lastName,
              specialization: teacherInput.specialization ?? null,
            },
          });

          const invResult = await createInvitation({
            tx,
            schoolId,
            userId: user.id,
            email: user.email,
            role: 'TEACHER',
            invitedByUserId: actorId,
          });

          createdInvitations.push({
            invitationId: invResult.invitation.id,
            rawToken: invResult.rawToken,
            invitationUrl: invResult.invitationUrl,
            recipientEmail: user.email,
            recipientName: `${teacherInput.firstName} ${teacherInput.lastName}`,
            role: 'TEACHER',
            schoolName: school?.name ?? null,
          });
        } else if (category === 'PARENTS' && row.parsedParent && row.resolvedStudentId) {
          const parentInput = row.parsedParent;
          let parentUser = await tx.user.findUnique({
            where: { email: parentInput.email.toLowerCase().trim() },
          });

          let isNewParent = false;
          if (!parentUser) {
            parentUser = await tx.user.create({
              data: {
                schoolId,
                email: parentInput.email.toLowerCase().trim(),
                passwordHash: placeholderHash,
                role: 'PARENT',
                status: 'ACTIVE',
              },
            });
            isNewParent = true;
          }

          await tx.guardianRelationship.create({
            data: {
              schoolId,
              guardianUserId: parentUser.id,
              studentId: row.resolvedStudentId,
              relationshipType: parentInput.relationshipType,
              isPrimaryContact: parentInput.isPrimaryContact,
              isVerified: false,
            },
          });

          if (isNewParent) {
            const invResult = await createInvitation({
              tx,
              schoolId,
              userId: parentUser.id,
              email: parentUser.email,
              role: 'PARENT',
              invitedByUserId: actorId,
            });

            createdInvitations.push({
              invitationId: invResult.invitation.id,
              rawToken: invResult.rawToken,
              invitationUrl: invResult.invitationUrl,
              recipientEmail: parentUser.email,
              recipientName: `${parentInput.firstName} ${parentInput.lastName}`,
              role: 'PARENT',
              schoolName: school?.name ?? null,
            });
          }
        }

        successfulRows++;
      });
    } catch (err) {
      failedRows++;
      rowErrors.push({
        rowNumber: row.rowNumber,
        message: err instanceof Error ? err.message : 'Database transaction failure.',
        identifier: row.raw['studentIdNumber'] || row.raw['employeeId'] || row.raw['email'],
        rawData: row.raw,
      });
    }
  }

  // Automated Email Invitation Dispatch with Controlled Concurrency
  let invitationsSent = 0;
  let invitationsFailed = 0;

  const shouldSendInvitations = options.sendInvitations !== false;
  if (shouldSendInvitations) {
    for (const inv of createdInvitations) {
      try {
        const dispatchResult = await dispatchInvitationEmail({
          invitationId: inv.invitationId,
          rawToken: inv.rawToken,
          invitationUrl: inv.invitationUrl,
          recipientEmail: inv.recipientEmail,
          recipientName: inv.recipientName,
          role: inv.role,
          schoolId,
          schoolName: inv.schoolName ?? school?.name,
          expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
          type: 'INVITATION_INITIAL',
        });

        if (dispatchResult.delivered) {
          invitationsSent++;
          await prisma.userInvitation.update({
            where: { id: inv.invitationId },
            data: { deliveryStatus: 'SENT', deliveredAt: new Date() },
          });
        } else {
          invitationsFailed++;
          await prisma.userInvitation.update({
            where: { id: inv.invitationId },
            data: {
              deliveryStatus: 'FAILED',
              deliveryError: dispatchResult.error ?? 'SMTP delivery failure',
            },
          });
        }
      } catch (err) {
        invitationsFailed++;
        await prisma.userInvitation.update({
          where: { id: inv.invitationId },
          data: {
            deliveryStatus: 'FAILED',
            deliveryError: err instanceof Error ? err.message : 'Unknown mail dispatch error',
          },
        });
      }
    }
  }

  const finalStatus = successfulRows > 0 ? 'COMPLETED' : 'FAILED';
  const completedJob = await prisma.bulkImportJob.update({
    where: { id: initialJob.id },
    data: {
      status: finalStatus,
      successfulRows,
      failedRows,
      skippedRows: options.skipInvalidRows ? invalidRows.length : 0,
      invitationsCreated: createdInvitations.length,
      invitationsSent,
      invitationsFailed,
      errors:
        rowErrors.length > 0 ? (rowErrors as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      completedAt: new Date(),
    },
    include: { actor: { select: { email: true } } },
  });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: AUDIT_ACTIONS.BULK_IMPORT_COMPLETED,
    entityType: 'BulkImportJob',
    entityId: completedJob.id,
    delta: {
      category,
      filename,
      successfulRows,
      failedRows,
      invitationsCreated: createdInvitations.length,
      invitationsSent,
    },
    ipAddress,
  });

  return formatImportJobDto(completedJob);
}

// ─── Import Job Queries & Reports ──────────────────────────────────────────

export async function listImportJobs(
  schoolId: string,
  query: BulkImportFilterQuery,
): Promise<BulkImportJobsListResponseDto> {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
  const skip = (page - 1) * limit;

  const where: Prisma.BulkImportJobWhereInput = {
    schoolId,
    ...(query.category && query.category !== 'ALL' ? { category: query.category } : {}),
    ...(query.status && query.status !== 'ALL' ? { status: query.status } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.bulkImportJob.count({ where }),
    prisma.bulkImportJob.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: query.sortOrder ?? 'desc' },
      include: {
        actor: { select: { email: true } },
      },
    }),
  ]);

  return {
    items: items.map(formatImportJobDto),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getImportJobById(schoolId: string, jobId: string): Promise<BulkImportJobDto> {
  const job = await prisma.bulkImportJob.findFirst({
    where: { id: jobId, schoolId },
    include: {
      actor: { select: { email: true } },
    },
  });

  if (!job) {
    throw new NotFoundError('Bulk import job not found in this school.');
  }

  return formatImportJobDto(job);
}

export async function generateJobErrorReportCsv(
  schoolId: string,
  jobId: string,
): Promise<{ csvContent: string; filename: string }> {
  const job = await prisma.bulkImportJob.findFirst({
    where: { id: jobId, schoolId },
  });

  if (!job) {
    throw new NotFoundError('Bulk import job not found in this school.');
  }

  const errors = (job.errors as unknown as BulkImportRowErrorDto[]) || [];

  const headers = ['Row Number', 'Identifier', 'Error Message', 'Raw Data'];
  const csvLines = [headers.join(',')];

  for (const err of errors) {
    const rowNum = String(err.rowNumber);
    const identifier = sanitizeCsvField(err.identifier || '');
    const message = `"${(err.message || '').replace(/"/g, '""')}"`;
    const rawData = `"${sanitizeCsvField(JSON.stringify(err.rawData || {})).replace(/"/g, '""')}"`;
    csvLines.push([rowNum, `"${identifier}"`, message, rawData].join(','));
  }

  return {
    csvContent: csvLines.join('\n'),
    filename: `bulk-import-errors-${job.id.slice(0, 8)}.csv`,
  };
}

interface JobWithActor {
  id: string;
  schoolId: string;
  actorId: string | null;
  actor?: { email: string } | null;
  category: BulkImportCategory;
  filename: string;
  fileSize: number;
  status: BulkImportStatus;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  successfulRows: number;
  failedRows: number;
  skippedRows: number;
  invitationsCreated: number;
  invitationsSent: number;
  invitationsFailed: number;
  summary?: unknown;
  errors?: unknown;
  idempotencyKey?: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function formatImportJobDto(job: JobWithActor): BulkImportJobDto {
  return {
    id: job.id,
    schoolId: job.schoolId,
    actorId: job.actorId,
    actorName: job.actor?.email ?? null,
    category: job.category,
    filename: job.filename,
    fileSize: job.fileSize,
    status: job.status,
    totalRows: job.totalRows,
    validRows: job.validRows,
    invalidRows: job.invalidRows,
    duplicateRows: job.duplicateRows,
    successfulRows: job.successfulRows,
    failedRows: job.failedRows,
    skippedRows: job.skippedRows,
    invitationsCreated: job.invitationsCreated,
    invitationsSent: job.invitationsSent,
    invitationsFailed: job.invitationsFailed,
    summary: (job.summary as Record<string, unknown>) ?? null,
    errors: (job.errors as unknown as BulkImportRowErrorDto[]) ?? null,
    idempotencyKey: job.idempotencyKey,
    startedAt: job.startedAt ? job.startedAt.toISOString() : null,
    completedAt: job.completedAt ? job.completedAt.toISOString() : null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}
