import { env } from '../config/env.js';

export function buildOpenApiSpec(): Record<string, unknown> {
  return {
    openapi: '3.1.0',
    info: {
      title: 'FSD-SDG-4 Quality Education SaaS API',
      version: '1.0.0',
      description:
        'Multi-tenant Quality Education SaaS API foundation (Phase 6). All domain endpoints are versioned under /api/v1.',
    },
    servers: [
      {
        url: '/api/v1',
        description: `API ${env.API_VERSION} base path`,
      },
    ],
    tags: [
      { name: 'Health', description: 'Liveness and database readiness probes' },
      { name: 'System', description: 'API metadata and contract discovery' },
      { name: 'Auth', description: 'Server-managed session authentication and account recovery' },
    ],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Liveness probe',
          description: 'Returns process liveness status without querying external dependencies.',
          responses: {
            '200': {
              description: 'Service is alive',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthCheckResponse' },
                },
              },
            },
          },
        },
      },
      '/ready': {
        get: {
          tags: ['Health'],
          summary: 'Readiness probe',
          description: 'Verifies PostgreSQL connectivity using a lightweight SELECT 1 query.',
          responses: {
            '200': {
              description: 'Service and database are ready',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ReadinessCheckResponse' },
                },
              },
            },
            '503': {
              description: 'Database dependency is not ready',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ReadinessCheckResponse' },
                },
              },
            },
          },
        },
      },
      '/ping': {
        get: {
          tags: ['System'],
          summary: 'API v1 connectivity check',
          responses: {
            '200': {
              description: 'API v1 router is operational',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
                },
              },
            },
          },
        },
      },
      '/openapi.json': {
        get: {
          tags: ['System'],
          summary: 'OpenAPI 3.1 specification document',
          responses: {
            '200': {
              description: 'OpenAPI 3.1 JSON document',
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Authenticate user and issue HttpOnly session cookie',
          responses: {
            '200': { description: 'Authenticated user profile and permissions' },
            '401': { description: 'Invalid credentials' },
            '429': { description: 'Rate limit exceeded' },
          },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Revoke current session and clear session cookie',
          responses: {
            '200': { description: 'Session revoked' },
            '401': { description: 'Unauthorized' },
            '403': { description: 'CSRF check failed' },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Retrieve current authenticated user and granted permissions',
          responses: {
            '200': { description: 'Current user' },
            '401': { description: 'Unauthorized' },
          },
        },
      },
      '/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Request password reset (generic enumeration-safe response)',
          responses: {
            '200': { description: 'Generic recovery acknowledgement' },
            '429': { description: 'Rate limit exceeded' },
          },
        },
      },
      '/auth/reset-password': {
        post: {
          tags: ['Auth'],
          summary: 'Complete password reset with single-use token and revoke all sessions',
          responses: {
            '200': { description: 'Password reset' },
            '400': { description: 'Invalid or expired token' },
            '422': { description: 'Password policy violation' },
          },
        },
      },
      '/auth/change-password': {
        post: {
          tags: ['Auth'],
          summary: 'Change password for authenticated user and rotate session',
          responses: {
            '200': { description: 'Password changed and session rotated' },
            '401': { description: 'Unauthorized or incorrect current password' },
          },
        },
      },
      '/auth/sessions': {
        get: {
          tags: ['Auth'],
          summary: 'List active sessions for current user',
          responses: {
            '200': { description: 'Active session summaries' },
            '401': { description: 'Unauthorized' },
          },
        },
      },
      '/auth/sessions/{sessionId}': {
        delete: {
          tags: ['Auth'],
          summary: 'Revoke a specific session belonging to the current user',
          responses: {
            '200': { description: 'Session revoked' },
            '404': { description: 'Session not found' },
          },
        },
      },
    },
    components: {
      schemas: {
        ApiMeta: {
          type: 'object',
          required: ['page', 'limit', 'total', 'totalPages'],
          properties: {
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1 },
            total: { type: 'integer', minimum: 0 },
            totalPages: { type: 'integer', minimum: 0 },
          },
        },
        ApiSuccessResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: {},
            meta: { $ref: '#/components/schemas/ApiMeta' },
          },
        },
        FieldError: {
          type: 'object',
          required: ['field', 'message'],
          properties: {
            field: { type: 'string' },
            message: { type: 'string' },
            code: { type: 'string' },
          },
        },
        ApiErrorResponse: {
          type: 'object',
          description: 'RFC 7807 Problem Details envelope',
          required: ['success', 'type', 'title', 'status', 'detail'],
          properties: {
            success: { type: 'boolean', enum: [false] },
            type: { type: 'string', format: 'uri-reference' },
            title: { type: 'string' },
            status: { type: 'integer' },
            detail: { type: 'string' },
            instance: { type: 'string' },
            requestId: { type: 'string' },
            errors: {
              type: 'array',
              items: { $ref: '#/components/schemas/FieldError' },
            },
          },
        },
        HealthCheckResponse: {
          type: 'object',
          required: ['status', 'version', 'environment', 'timestamp'],
          properties: {
            status: { type: 'string', enum: ['ok', 'degraded', 'down'] },
            version: { type: 'string' },
            environment: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        ReadinessCheckResponse: {
          type: 'object',
          required: ['status', 'checks', 'timestamp'],
          properties: {
            status: { type: 'string', enum: ['ready', 'not_ready'] },
            checks: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'status'],
                properties: {
                  name: { type: 'string' },
                  status: { type: 'string', enum: ['pass', 'fail'] },
                  latencyMs: { type: 'number' },
                  message: { type: 'string' },
                },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  };
}
