/**
 * Clearly labelled synthetic demo data for the Parent/Guardian Portal (Phase 1).
 *
 * IMPORTANT:
 * - This module contains 100% synthetic placeholder data for UI development and preview.
 * - It does NOT represent real students, real grades, or live backend records.
 * - Internal support flags and confidential staff notes are intentionally excluded.
 */

export type DemoSubmissionStatus = 'SUBMITTED' | 'PENDING' | 'LATE' | 'GRADED';

export interface DemoChildProfile {
  id: string;
  firstName: string;
  lastName: string;
  studentIdNumber: string;
  className: string;
  sectionName: string;
  academicYear: string;
  relationshipType: 'MOTHER' | 'FATHER' | 'LEGAL_GUARDIAN' | 'OTHER';
  isPrimaryContact: boolean;
  homeroomTeacher: string;
}

export interface DemoAttendanceSummary {
  attendanceRate: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  lastUpdatedLabel: string;
}

export interface DemoSubjectGrade {
  id: string;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  latestScore: number;
  maxScore: number;
  gradeLetter: string;
  progressPercent: number;
}

export interface DemoUpcomingAssignment {
  id: string;
  title: string;
  subjectName: string;
  dueDate: string;
  status: DemoSubmissionStatus;
}

export interface DemoSchoolAnnouncement {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  category: 'ACADEMIC' | 'EVENT' | 'GENERAL';
}

export interface DemoChildDashboardData {
  profile: DemoChildProfile;
  attendance: DemoAttendanceSummary;
  grades: DemoSubjectGrade[];
  upcomingAssignments: DemoUpcomingAssignment[];
}

export interface ParentDemoDashboardPayload {
  isDemoData: true;
  guardianDisplayName: string;
  schoolName: string;
  children: DemoChildDashboardData[];
  announcements: DemoSchoolAnnouncement[];
}

export const PARENT_DEMO_DATA: ParentDemoDashboardPayload = {
  isDemoData: true,
  guardianDisplayName: 'Meera Synthetic',
  schoolName: 'Greenfield Primary School (Demo)',
  children: [
    {
      profile: {
        id: 'demo-student-1',
        firstName: 'Aarav',
        lastName: 'Synthetic',
        studentIdNumber: 'GF-STU-2026-001',
        className: 'Grade 8',
        sectionName: '8-A',
        academicYear: '2026–2027',
        relationshipType: 'MOTHER',
        isPrimaryContact: true,
        homeroomTeacher: 'Ananya Verma',
      },
      attendance: {
        attendanceRate: 92,
        totalDays: 50,
        presentDays: 44,
        absentDays: 3,
        lateDays: 2,
        excusedDays: 1,
        lastUpdatedLabel: 'Updated today (Demo)',
      },
      grades: [
        {
          id: 'demo-grade-1',
          subjectName: 'Mathematics',
          subjectCode: 'MATH-101',
          teacherName: 'Ananya Verma',
          latestScore: 86,
          maxScore: 100,
          gradeLetter: 'A',
          progressPercent: 86,
        },
        {
          id: 'demo-grade-2',
          subjectName: 'General Science',
          subjectCode: 'SCI-101',
          teacherName: 'Rohan Kulkarni',
          latestScore: 78,
          maxScore: 100,
          gradeLetter: 'B+',
          progressPercent: 78,
        },
        {
          id: 'demo-grade-3',
          subjectName: 'English Language',
          subjectCode: 'ENG-101',
          teacherName: 'Kavita Rao',
          latestScore: 91,
          maxScore: 100,
          gradeLetter: 'A+',
          progressPercent: 91,
        },
      ],
      upcomingAssignments: [
        {
          id: 'demo-assign-1',
          title: 'Linear Equations Practice Set 2',
          subjectName: 'Mathematics',
          dueDate: '2026-11-28',
          status: 'PENDING',
        },
        {
          id: 'demo-assign-2',
          title: 'Ecosystems Lab Worksheet',
          subjectName: 'General Science',
          dueDate: '2026-11-30',
          status: 'SUBMITTED',
        },
        {
          id: 'demo-assign-3',
          title: 'Reading Comprehension Essay',
          subjectName: 'English Language',
          dueDate: '2026-11-24',
          status: 'GRADED',
        },
      ],
    },
    {
      profile: {
        id: 'demo-student-2',
        firstName: 'Diya',
        lastName: 'Synthetic',
        studentIdNumber: 'GF-STU-2026-002',
        className: 'Grade 5',
        sectionName: '5-B',
        academicYear: '2026–2027',
        relationshipType: 'MOTHER',
        isPrimaryContact: true,
        homeroomTeacher: 'Suresh Nair',
      },
      attendance: {
        attendanceRate: 96,
        totalDays: 50,
        presentDays: 47,
        absentDays: 1,
        lateDays: 1,
        excusedDays: 1,
        lastUpdatedLabel: 'Updated today (Demo)',
      },
      grades: [
        {
          id: 'demo-grade-4',
          subjectName: 'Foundational Numeracy',
          subjectCode: 'NUM-501',
          teacherName: 'Suresh Nair',
          latestScore: 94,
          maxScore: 100,
          gradeLetter: 'A+',
          progressPercent: 94,
        },
        {
          id: 'demo-grade-5',
          subjectName: 'Environmental Studies',
          subjectCode: 'EVS-501',
          teacherName: 'Priya Menon',
          latestScore: 88,
          maxScore: 100,
          gradeLetter: 'A',
          progressPercent: 88,
        },
      ],
      upcomingAssignments: [
        {
          id: 'demo-assign-4',
          title: 'Fractions & Decimals Workbook',
          subjectName: 'Foundational Numeracy',
          dueDate: '2026-11-29',
          status: 'PENDING',
        },
        {
          id: 'demo-assign-5',
          title: 'Water Conservation Poster',
          subjectName: 'Environmental Studies',
          dueDate: '2026-12-02',
          status: 'SUBMITTED',
        },
      ],
    },
  ],
  announcements: [
    {
      id: 'demo-ann-1',
      title: 'Parent–Teacher Conference Schedule',
      summary:
        'Term 1 parent-teacher consultations will be held next Friday from 9:00 AM to 3:00 PM.',
      publishedAt: '2026-11-23',
      category: 'EVENT',
    },
    {
      id: 'demo-ann-2',
      title: 'Winter Science Exhibition Submissions Open',
      summary:
        'Students in Grades 5–8 may register project proposals with their science teachers by Dec 5.',
      publishedAt: '2026-11-20',
      category: 'ACADEMIC',
    },
    {
      id: 'demo-ann-3',
      title: 'Updated Morning Drop-off Gate Timings',
      summary:
        'School gates open at 7:45 AM. Please ensure students arrive before 8:10 AM homeroom.',
      publishedAt: '2026-11-18',
      category: 'GENERAL',
    },
  ],
};
