import { beforeEach, describe, expect, it, vi } from 'vitest';
import xlsx from 'xlsx';
import {
  generateTemplate,
  normalizeHeaderKey,
  parseRawSpreadsheet,
  sanitizeCsvField,
} from './bulkImport.service.js';

describe('Bulk Import Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Security & Formula Injection Sanitization', () => {
    it('sanitizes dangerous spreadsheet formula prefixes (=, +, -, @, \\t, \\r)', () => {
      expect(sanitizeCsvField('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
      expect(sanitizeCsvField('+123456789')).toBe("'+123456789");
      expect(sanitizeCsvField('-CMD|calc.exe')).toBe("'-CMD|calc.exe");
      expect(sanitizeCsvField('@HYPERLINK("http://evil.com")')).toBe(
        '\'@HYPERLINK("http://evil.com")',
      );
      expect(sanitizeCsvField('\tTAB_PREFIX')).toBe("'\tTAB_PREFIX");
      expect(sanitizeCsvField('Normal Name')).toBe('Normal Name');
      expect(sanitizeCsvField(null)).toBe('');
      expect(sanitizeCsvField(undefined)).toBe('');
    });

    it('normalizes arbitrary header strings safely', () => {
      expect(normalizeHeaderKey('First Name')).toBe('firstname');
      expect(normalizeHeaderKey('student_id_number')).toBe('studentidnumber');
      expect(normalizeHeaderKey('  Class - Name  ')).toBe('classname');
      expect(normalizeHeaderKey('Email Address!')).toBe('emailaddress');
    });
  });

  describe('Template Generation', () => {
    it('generates valid CSV template for STUDENTS', () => {
      const template = generateTemplate('STUDENTS', 'csv');
      expect(template.filename).toBe('edvarq-students-import-template.csv');
      expect(template.contentType).toContain('text/csv');
      const content = template.buffer.toString('utf8');
      expect(content).toContain('First Name');
      expect(content).toContain('Student ID Number');
      expect(content).toContain('Class Name');
      expect(content).toContain('Section Name');
    });

    it('generates valid XLSX template for TEACHERS', () => {
      const template = generateTemplate('TEACHERS', 'xlsx');
      expect(template.filename).toBe('edvarq-teachers-import-template.xlsx');
      expect(template.contentType).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      const wb = xlsx.read(template.buffer, { type: 'buffer' });
      expect(wb.SheetNames).toContain('Teachers');
      const sheet = wb.Sheets['Teachers']!;
      const data = xlsx.utils.sheet_to_json<Record<string, string>>(sheet);
      expect(data.length).toBe(1);
      expect(data[0]!['Employee ID']).toBe('EMP-2026-101');
    });

    it('generates valid CSV template for PARENTS', () => {
      const template = generateTemplate('PARENTS', 'csv');
      expect(template.filename).toBe('edvarq-parents-import-template.csv');
      const content = template.buffer.toString('utf8');
      expect(content).toContain('Relationship Type');
      expect(content).toContain('Student ID Number');
    });
  });

  describe('Spreadsheet Parsing', () => {
    it('successfully parses CSV buffer with flexible column names', () => {
      const csv = `first_name,last_name,email,student_id,class,section\nAarav,Patel,aarav@student.example.com,STU-001,Grade 10,Section A`;
      const buffer = Buffer.from(csv, 'utf8');
      const { rows, rawHeaders } = parseRawSpreadsheet(buffer, 'STUDENTS');
      expect(rawHeaders).toContain('first_name');
      expect(rows.length).toBe(1);
      expect(rows[0]!['firstName']).toBe('Aarav');
      expect(rows[0]!['lastName']).toBe('Patel');
      expect(rows[0]!['studentIdNumber']).toBe('STU-001');
      expect(rows[0]!['className']).toBe('Grade 10');
      expect(rows[0]!['sectionName']).toBe('Section A');
    });

    it('successfully parses XLSX buffer', () => {
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet([
        {
          'First Name': 'Meera',
          'Last Name': 'Rao',
          Email: 'meera@school.example.com',
          'Employee ID': 'EMP-501',
          Specialization: 'Mathematics',
        },
      ]);
      xlsx.utils.book_append_sheet(wb, ws, 'Staff');
      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

      const { rows } = parseRawSpreadsheet(buffer, 'TEACHERS');
      expect(rows.length).toBe(1);
      expect(rows[0]!['firstName']).toBe('Meera');
      expect(rows[0]!['employeeId']).toBe('EMP-501');
      expect(rows[0]!['specialization']).toBe('Mathematics');
    });

    it('rejects empty spreadsheets with clear error', () => {
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet([]);
      xlsx.utils.book_append_sheet(wb, ws, 'Empty');
      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

      expect(() => parseRawSpreadsheet(buffer, 'STUDENTS')).toThrow(
        'Uploaded spreadsheet contains no data rows.',
      );
    });

    it('rejects invalid non-spreadsheet buffers', () => {
      const corruptedZipBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0xff, 0xff]);
      expect(() => parseRawSpreadsheet(corruptedZipBuffer, 'STUDENTS')).toThrow(
        'Failed to parse uploaded file.',
      );
    });

    it('7. parses CSV import using the exact downloaded Edvarq template preserving ISO date formats', () => {
      const template = generateTemplate('STUDENTS', 'csv');
      const { rows } = parseRawSpreadsheet(template.buffer, 'STUDENTS');
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0]!['admissionDate']).toBe('2026-06-01');
      expect(rows[0]!['dateOfBirth']).toBe('2010-04-15');
    });

    it('correctly parses the 10-row demo student CSV without short date corruption', () => {
      const demoCsv =
        'First Name,Last Name,Student ID Number,Student Email,Class Name,Section Name,Academic Year Name,Admission Date,Date of Birth,Gender,Parent Email,Parent Name,Parent Relationship\n' +
        'Aarav,Patel,STU-2026-001,aarav.patel@student.example.com,Grade 10,Section A,2026-2027,2026-06-01,2010-04-15,MALE,rajesh.patel@example.com,Rajesh Patel,FATHER\n' +
        'Diya,Sharma,STU-2026-002,diya.sharma@student.example.com,Grade 10,Section A,2026-2027,2026-06-03,2010-09-22,FEMALE,meera.sharma@example.com,Meera Sharma,MOTHER\n' +
        'Kabir,Mehta,STU-2026-003,kabir.mehta@student.example.com,Grade 9,Section B,2026-2027,2026-06-05,2011-01-08,MALE,amit.mehta@example.com,Amit Mehta,FATHER\n' +
        'Ananya,Rao,STU-2026-004,ananya.rao@student.example.com,Grade 8,Section A,2026-2027,2026-06-08,2012-03-17,FEMALE,sudha.rao@example.com,Sudha Rao,MOTHER\n' +
        'Ishaan,Khan,STU-2026-005,ishaan.khan@student.example.com,Grade 9,Section B,2026-2027,2026-06-10,2011-11-30,MALE,farah.khan@example.com,Farah Khan,MOTHER\n' +
        'Myra,Nair,STU-2026-006,myra.nair@student.example.com,Grade 8,Section B,2026-2027,2026-06-12,2012-07-04,FEMALE,anil.nair@example.com,Anil Nair,FATHER\n' +
        'Vihaan,Desai,STU-2026-007,vihaan.desai@student.example.com,Grade 10,Section B,2026-2027,2026-06-15,2010-12-12,MALE,kavita.desai@example.com,Kavita Desai,MOTHER\n' +
        'Sara,Iyer,STU-2026-008,sara.iyer@student.example.com,Grade 8,Section A,2026-2027,2026-06-18,2012-10-25,FEMALE,priya.iyer@example.com,Priya Iyer,MOTHER\n' +
        'Arjun,Reddy,STU-2026-009,arjun.reddy@student.example.com,Grade 9,Section A,2026-2027,2026-06-20,2011-05-19,MALE,suresh.reddy@example.com,Suresh Reddy,FATHER\n' +
        'Aadhya,Joshi,STU-2026-010,aadhya.joshi@student.example.com,Grade 10,Section A,2026-2027,2026-06-22,2010-08-03,FEMALE,neha.joshi@example.com,Neha Joshi,MOTHER\n';

      const { rows } = parseRawSpreadsheet(Buffer.from(demoCsv, 'utf8'), 'STUDENTS');
      expect(rows.length).toBe(10);
      expect(rows[0]!['admissionDate']).toBe('2026-06-01');
      expect(rows[0]!['dateOfBirth']).toBe('2010-04-15');
      expect(rows[9]!['admissionDate']).toBe('2026-06-22');
      expect(rows[9]!['dateOfBirth']).toBe('2010-08-03');
    });

    it('trims surrounding whitespace from dates and fields', () => {
      const csv =
        'First Name,Last Name,Student ID Number,Student Email,Class Name,Section Name,Admission Date,Date of Birth\n' +
        ' Aarav , Patel , STU-001 , aarav@school.edu , Grade 10 , Section A ,  2026-06-01  ,  2010-04-15  \n';

      const { rows } = parseRawSpreadsheet(Buffer.from(csv, 'utf8'), 'STUDENTS');
      expect(rows.length).toBe(1);
      expect(rows[0]!['firstName']).toBe('Aarav');
      expect(rows[0]!['admissionDate']).toBe('2026-06-01');
      expect(rows[0]!['dateOfBirth']).toBe('2010-04-15');
    });
  });
});
