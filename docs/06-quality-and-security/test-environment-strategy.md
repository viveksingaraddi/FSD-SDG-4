# Test Environment and Fixture Strategy

This document establishes the test environment provisioning, test database isolation, fixture lifecycle, and external service mocking strategies for the **FSD-SDG-4 Quality Education SaaS** platform.

---

## 1. Test Database Strategy

1. **Local Development**: Engineers run an isolated test database container (`postgres:16-alpine`) mapped to port `5433` (distinct from default `5432` development database) to prevent accidental data overwrites.
2. **CI Pipeline**: Each GitHub Actions test job spawns an ephemeral PostgreSQL service container. The database is initialized via Prisma migrations, populated with synthetic test fixtures, and completely destroyed upon job termination.
3. **Transactional Isolation**: Where practical, individual integration test suites execute inside database transactions that roll back automatically upon completion (`ROLLBACK`), ensuring rapid execution without slow table truncations.

---

## 2. Synthetic Test Fixture Lifecycle (Zero Real PII)

- **Fixture Factories**: Tests utilize deterministic factory functions (e.g. `createTestSchool()`, `createTestTeacher()`, `createTestSection()`) that generate synthetic records using randomized UUIDs and standard mock email domains (`@tenant-test.internal`).
- **No Real Student Records**: Real student names, real identification numbers, and real contact details are strictly forbidden in test fixtures.
- **Fixture Cleanup**: Global teardown scripts execute `TRUNCATE TABLE ... CASCADE` across all tenant tables between test suites to ensure zero cross-test interference.

---

## 3. External Service Mocking

To ensure deterministic, fast, and offline test execution:

- **Cloud Object Storage (S3)**: Mocked via an in-memory stub or local directory adapter during unit and integration tests. Pre-signed URLs return mock endpoints that echo valid upload responses.
- **Notification Gateway (Email/SMS)**: In-memory notification interceptor records outgoing messages in a test array (`mockNotificationService.sentMessages`) allowing tests to assert dispatch without sending real external network requests.
- **System Clocks**: Time-dependent test cases (session expiry, late assignment submissions, attendance amendment windows) use Vitest fake timers (`vi.setSystemTime(...)`) to verify deterministic edge-case behavior.
