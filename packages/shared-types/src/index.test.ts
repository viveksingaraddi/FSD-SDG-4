import { describe, it, expect } from 'vitest';
import type {
  UserRole,
  AttendanceStatus,
  ApiSuccessResponse,
  HealthCheckResponse,
} from './index.js';

describe('@fsd-sdg4/shared-types', () => {
  it('UserRole union covers all five platform roles', () => {
    const roles: UserRole[] = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];
    expect(roles).toHaveLength(5);
  });

  it('AttendanceStatus union covers all four attendance states', () => {
    const statuses: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
    expect(statuses).toHaveLength(4);
  });

  it('ApiSuccessResponse shape is structurally correct', () => {
    const response: ApiSuccessResponse<{ id: string }> = {
      success: true,
      data: { id: 'stu-001' },
    };
    expect(response.success).toBe(true);
    expect(response.data.id).toBe('stu-001');
  });

  it('HealthCheckResponse accepts valid ok status', () => {
    const health: HealthCheckResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.0.0',
      environment: 'test',
    };
    expect(health.status).toBe('ok');
  });
});
