import type { UserRole } from '@fsd-sdg4/contracts';
import {
  BookOpen,
  Building2,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean | undefined;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Platform Super Admin',
  SCHOOL_ADMIN: 'School Administrator',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  PARENT: 'Parent / Guardian',
};

export const ROLE_NAV_ITEMS: Record<UserRole, NavItem[]> = {
  SUPER_ADMIN: [
    {
      id: 'overview',
      label: 'Platform Overview',
      to: '/super-admin',
      icon: LayoutDashboard,
      end: true,
    },
    { id: 'schools', label: 'Schools', to: '/super-admin/schools', icon: Building2 },
    { id: 'governance', label: 'Governance', to: '/super-admin/governance', icon: Shield },
    { id: 'settings', label: 'Settings', to: '/super-admin/settings', icon: Settings },
  ],
  SCHOOL_ADMIN: [
    { id: 'overview', label: 'School Overview', to: '/admin', icon: LayoutDashboard, end: true },
    { id: 'academic', label: 'Academic Setup', to: '/admin/academic', icon: BookOpen },
    { id: 'staff', label: 'Staff & Teachers', to: '/admin/staff', icon: Users },
    { id: 'students', label: 'Students', to: '/admin/students', icon: GraduationCap },
  ],
  TEACHER: [
    { id: 'overview', label: 'Teaching Home', to: '/teacher', icon: LayoutDashboard, end: true },
    { id: 'attendance', label: 'Attendance', to: '/teacher/attendance', icon: CalendarCheck },
    { id: 'assignments', label: 'Assignments', to: '/teacher/assignments', icon: ClipboardList },
    { id: 'support', label: 'Student Support', to: '/teacher/support', icon: HeartHandshake },
  ],
  STUDENT: [
    { id: 'overview', label: 'My Learning', to: '/student', icon: LayoutDashboard, end: true },
    { id: 'courses', label: 'Courses', to: '/student/courses', icon: BookOpen },
    { id: 'assignments', label: 'Assignments', to: '/student/assignments', icon: ClipboardList },
    { id: 'progress', label: 'Progress', to: '/student/progress', icon: GraduationCap },
  ],
  PARENT: [
    { id: 'overview', label: 'Family Overview', to: '/parent', icon: LayoutDashboard, end: true },
    { id: 'attendance', label: 'Attendance', to: '/parent/attendance', icon: CalendarCheck },
    { id: 'progress', label: 'Progress', to: '/parent/progress', icon: GraduationCap },
    { id: 'support', label: 'Support Plans', to: '/parent/support', icon: HeartHandshake },
  ],
};
