import { PrismaClient, Status, Priority, Severity } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seed script — creates a demo user and 50 realistic developer-flavored issues.
 * Run with: npm run prisma:seed
 */
async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data (in dev only)
  await prisma.refreshToken.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const passwordHash = await bcrypt.hash('Demo1234!', 12);
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      name: 'Demo User',
      passwordHash,
    },
  });

  console.log(`✅ Created demo user: ${demoUser.email} (password: Demo1234!)`);

  // Realistic developer issues
  const issues = [
    {
      title: 'Auth token refresh race condition on concurrent requests',
      description:
        'When the access token expires and multiple requests fire simultaneously, each one triggers its own refresh call, causing token rotation conflicts. Need a refresh queue or mutex pattern.',
      status: Status.IN_PROGRESS,
      priority: Priority.HIGH,
      severity: Severity.MAJOR,
    },
    {
      title: 'Memory leak in WebSocket connection handler',
      description:
        'Connections that disconnect uncleanly leave event listeners attached. Heap grows ~50MB/hour under load. Investigate socket.io cleanup on "close" vs "disconnect" events.',
      status: Status.OPEN,
      priority: Priority.URGENT,
      severity: Severity.CRITICAL,
    },
    {
      title: 'Pagination cursor breaks when sorting by non-unique column',
      description:
        'Sorting issues by `priority` with cursor pagination causes duplicate/missing rows across pages. Need to add `id` as a secondary sort key.',
      status: Status.OPEN,
      priority: Priority.MEDIUM,
      severity: Severity.MAJOR,
    },
    {
      title: 'CSV export fails for users with >10k issues',
      description:
        'Loading the full dataset into memory before streaming causes OOM on larger accounts. Switch to streaming CSV writer with Prisma cursor iteration.',
      status: Status.RESOLVED,
      priority: Priority.HIGH,
      severity: Severity.MAJOR,
    },
    {
      title: 'Dark mode flash on initial page load',
      description:
        'Theme preference is read after React mounts, causing a brief flash of light mode. Inline script in index.html should set `data-theme` before hydration.',
      status: Status.RESOLVED,
      priority: Priority.LOW,
      severity: Severity.MINOR,
    },
    {
      title: 'Prisma migration fails on MySQL 5.7 due to utf8mb4 default',
      description:
        'Our schema assumes MySQL 8 charset. Migration SQL needs explicit `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci` for backwards compat.',
      status: Status.CLOSED,
      priority: Priority.MEDIUM,
      severity: Severity.MINOR,
    },
    {
      title: 'Search input fires API request on every keystroke',
      description:
        'Missing debounce wrapper means typing "authentication" sends 14 requests. Add 400ms debounce + AbortController to cancel in-flight requests.',
      status: Status.IN_PROGRESS,
      priority: Priority.HIGH,
      severity: Severity.MAJOR,
    },
    {
      title: 'Refresh token not rotated on use',
      description:
        'Security issue: the same refresh token can be reused until expiry. Implement rotation — issue new refresh token on every /auth/refresh call, revoke old one.',
      status: Status.OPEN,
      priority: Priority.URGENT,
      severity: Severity.CRITICAL,
    },
    {
      title: 'Broken error boundary on issue detail page',
      description:
        'Navigating to /issues/<invalid-id> crashes the whole app instead of showing a 404 page. Wrap route in <ErrorBoundary>.',
      status: Status.OPEN,
      priority: Priority.MEDIUM,
      severity: Severity.MAJOR,
    },
    {
      title: 'Rate limiter blocks legitimate traffic behind corporate NAT',
      description:
        'Multiple users sharing an egress IP hit the 100 req/min limit. Need to use authenticated user ID instead of IP for limiting, fall back to IP only for anon routes.',
      status: Status.IN_PROGRESS,
      priority: Priority.HIGH,
      severity: Severity.MAJOR,
    },
    {
      title: 'Add keyboard shortcut for quick issue creation (C)',
      description:
        'Power users want to press "C" to open the create dialog from anywhere. Implement global hotkey listener that respects input focus state.',
      status: Status.OPEN,
      priority: Priority.LOW,
      severity: Severity.TRIVIAL,
    },
    {
      title: 'Status badge colors fail WCAG AA contrast check',
      description:
        'Light yellow on white (In Progress) has 2.1:1 contrast — needs 4.5:1 minimum. Darken the text or add a colored background pill.',
      status: Status.RESOLVED,
      priority: Priority.MEDIUM,
      severity: Severity.MINOR,
    },
    {
      title: 'N+1 query on issues list when including author',
      description:
        'Logs show one query for issues, then N queries for authors. Add `include: { author: true }` to the Prisma findMany — Prisma will batch it.',
      status: Status.RESOLVED,
      priority: Priority.HIGH,
      severity: Severity.MAJOR,
    },
    {
      title: 'bcrypt hash cost too low in production',
      description:
        'Currently using cost factor 10. OWASP recommends 12 for 2024. Bump + benchmark on prod instance — aim for ~300ms per hash.',
      status: Status.CLOSED,
      priority: Priority.HIGH,
      severity: Severity.MAJOR,
    },
    {
      title: 'Date picker crashes on Safari iOS when keyboard appears',
      description:
        'Reported by 3 mobile users. Viewport resize triggers re-render during focus event, causing infinite loop. Reproducible on iOS 16.2+.',
      status: Status.OPEN,
      priority: Priority.HIGH,
      severity: Severity.MAJOR,
    },
    {
      title: 'Toast notifications stack infinitely on rapid mutations',
      description:
        'Firing 10 updates in 1 second shows 10 toasts. Use Sonner\'s dedupe feature or limit visible count to 3.',
      status: Status.RESOLVED,
      priority: Priority.LOW,
      severity: Severity.MINOR,
    },
    {
      title: 'Add command palette (Cmd+K) for fast navigation',
      description:
        'Use cmdk library. Include actions: jump to issue, create issue, toggle theme, logout. Should fuzzy-match titles.',
      status: Status.IN_PROGRESS,
      priority: Priority.MEDIUM,
      severity: Severity.MINOR,
    },
    {
      title: 'CORS misconfiguration allows credentials from any origin',
      description:
        'Setting `Access-Control-Allow-Origin: *` with `credentials: true` is a spec violation and a security hole. Whitelist specific origins via env var.',
      status: Status.RESOLVED,
      priority: Priority.URGENT,
      severity: Severity.CRITICAL,
    },
    {
      title: 'Stack trace leaked in production error responses',
      description:
        'Error middleware returns `err.stack` even when NODE_ENV=production. Serialize to generic message in prod, log full trace server-side only.',
      status: Status.RESOLVED,
      priority: Priority.URGENT,
      severity: Severity.CRITICAL,
    },
    {
      title: 'Docker image size bloated to 1.8GB',
      description:
        'Multi-stage build not copying only necessary files. Excluding node_modules dev deps + using alpine base should get us under 300MB.',
      status: Status.IN_PROGRESS,
      priority: Priority.MEDIUM,
      severity: Severity.MINOR,
    },
    {
      title: 'Slow query on /issues endpoint with status filter',
      description:
        'EXPLAIN shows full table scan when filtering by status. Verified index exists on `status` — investigate why planner ignores it. Likely cardinality issue.',
      status: Status.OPEN,
      priority: Priority.HIGH,
      severity: Severity.MAJOR,
    },
    {
      title: 'Missing index on RefreshToken.tokenHash',
      description:
        'Every /auth/refresh does a full scan of the tokens table. Add @@index([tokenHash]) to schema.prisma and create migration.',
      status: Status.RESOLVED,
      priority: Priority.HIGH,
      severity: Severity.MAJOR,
    },
    {
      title: 'Front-end bundle includes entire lodash (450KB)',
      description:
        'Importing with `import _ from "lodash"` pulls the whole lib. Switch to named imports (`import debounce from "lodash/debounce"`) or use lodash-es.',
      status: Status.OPEN,
      priority: Priority.MEDIUM,
      severity: Severity.MINOR,
    },
    {
      title: 'Users can edit issues they don\'t own',
      description:
        'Authorization bug: PATCH /issues/:id only checks JWT validity, not ownership. Add `issue.authorId === req.user.id` check in service layer.',
      status: Status.RESOLVED,
      priority: Priority.URGENT,
      severity: Severity.CRITICAL,
    },
    {
      title: 'Seed script runs on production startup',
      description:
        'Dockerfile CMD includes `npm run prisma:seed` which wipes data on every restart. Move seed to a separate, manually-invoked command.',
      status: Status.CLOSED,
      priority: Priority.URGENT,
      severity: Severity.CRITICAL,
    },
    {
      title: 'Empty state shown briefly while data loads',
      description:
        'TanStack Query returns `[]` before first fetch resolves, triggering empty state UI. Check `isLoading` flag before rendering empty state.',
      status: Status.RESOLVED,
      priority: Priority.LOW,
      severity: Severity.MINOR,
    },
    {
      title: 'Markdown in issue descriptions not sanitized',
      description:
        'User can include `<script>` tags in description. Rendering with dangerouslySetInnerHTML = XSS. Use DOMPurify or render as plain text only.',
      status: Status.IN_PROGRESS,
      priority: Priority.URGENT,
      severity: Severity.CRITICAL,
    },
    {
      title: 'API returns 500 when request body is empty JSON',
      description:
        'Zod validator throws, but error handler doesn\'t catch it cleanly for empty objects. Return structured 400 with field list instead.',
      status: Status.RESOLVED,
      priority: Priority.MEDIUM,
      severity: Severity.MINOR,
    },
    {
      title: 'Add "updated X ago" ticker to issue cards',
      description:
        'Use date-fns formatDistanceToNow. Auto-refresh every 60s via setInterval. Render in user\'s locale.',
      status: Status.OPEN,
      priority: Priority.LOW,
      severity: Severity.TRIVIAL,
    },
    {
      title: 'Log spam from Morgan on health check endpoint',
      description:
        'AWS ALB hits /health every 10s. Filters those out of morgan logs using `skip: (req) => req.path === "/health"`.',
      status: Status.RESOLVED,
      priority: Priority.LOW,
      severity: Severity.TRIVIAL,
    },
    {
      title: 'Refresh token cookie not set with SameSite=Strict',
      description:
        'Currently SameSite=Lax. Strict prevents CSRF in more cases but breaks cross-origin refresh. Evaluate trade-off for our flow.',
      status: Status.OPEN,
      priority: Priority.MEDIUM,
      severity: Severity.MAJOR,
    },
    {
      title: 'PR #247: Add JSON export endpoint',
      description:
        'Mirrors CSV export but returns application/json. Include filter params. Stream for large exports.',
      status: Status.IN_PROGRESS,
      priority: Priority.MEDIUM,
      severity: Severity.MINOR,
    },
    {
      title: 'Password reset flow not implemented',
      description:
        'User can\'t recover a forgotten password. Need email provider integration, time-limited reset tokens, and rate limiting on reset requests.',
      status: Status.OPEN,
      priority: Priority.HIGH,
      severity: Severity.MAJOR,
    },
    {
      title: 'Migrations directory checked into git with .sql files 100MB+',
      description:
        'Someone committed a `prisma migrate dev` output that included a large data dump. Repo clone is slow. Need to rewrite history.',
      status: Status.CLOSED,
      priority: Priority.HIGH,
      severity: Severity.MAJOR,
    },
    {
      title: 'Unicode titles break CSV export (commas in emoji flags)',
      description:
        'Country flag emoji are technically two codepoints with ZWJ. Our naive CSV escape doesn\'t handle them. Use a CSV library instead of string concat.',
      status: Status.OPEN,
      priority: Priority.LOW,
      severity: Severity.MINOR,
    },
    {
      title: 'Login form allows submit with Enter during Google auth redirect',
      description:
        'Race condition: user can submit email/password while OAuth popup is open. Disable form during pending OAuth state.',
      status: Status.IN_PROGRESS,
      priority: Priority.MEDIUM,
      severity: Severity.MINOR,
    },
    {
      title: 'Issue count badge on sidebar shows stale data',
      description:
        'After creating an issue, sidebar count doesn\'t refetch. Invalidate the stats query key in the mutation\'s onSuccess.',
      status: Status.RESOLVED,
      priority: Priority.LOW,
      severity: Severity.MINOR,
    },
    {
      title: 'Add filter by author (dropdown of users)',
      description:
        'Users want to see only issues they created or that are assigned to a colleague. Requires new GET /users endpoint (filtered).',
      status: Status.OPEN,
      priority: Priority.MEDIUM,
      severity: Severity.MINOR,
    },
    {
      title: 'Docker health check fails during migration on cold start',
      description:
        'App Runner marks instance unhealthy if /health doesn\'t respond in 30s. Prisma migrate deploy can take 45s. Increase health check grace period.',
      status: Status.RESOLVED,
      priority: Priority.HIGH,
      severity: Severity.MAJOR,
    },
    {
      title: 'TypeScript `any` used in 14 places in the codebase',
      description:
        'grep -r ": any" src/ returns 14 hits. Clean these up or mark intentional ones with `// eslint-disable-next-line` + comment.',
      status: Status.OPEN,
      priority: Priority.LOW,
      severity: Severity.TRIVIAL,
    },
    {
      title: 'Confirmation dialog doesn\'t trap focus',
      description:
        'A11y: Tab key escapes the modal dialog into the background. Use a focus-trap library or Radix UI Dialog which handles it.',
      status: Status.IN_PROGRESS,
      priority: Priority.MEDIUM,
      severity: Severity.MINOR,
    },
    {
      title: 'README missing architecture diagram',
      description:
        'Interviewers / new contributors have nothing to orient them. Draw in Excalidraw, export PNG, commit to /docs/architecture.png.',
      status: Status.OPEN,
      priority: Priority.LOW,
      severity: Severity.TRIVIAL,
    },
    {
      title: 'Add composite index on (authorId, status)',
      description:
        'Dashboard query "my open issues" filters both columns. Composite index would serve both while single-column index only uses one.',
      status: Status.OPEN,
      priority: Priority.MEDIUM,
      severity: Severity.MINOR,
    },
    {
      title: 'Sentry not capturing unhandled promise rejections',
      description:
        'Uncaught async errors don\'t show up in Sentry. Register `process.on("unhandledRejection", ...)` to forward to Sentry.captureException.',
      status: Status.RESOLVED,
      priority: Priority.HIGH,
      severity: Severity.MAJOR,
    },
    {
      title: 'Swagger docs endpoint returns empty spec in production',
      description:
        'tsoa generates OpenAPI spec at build time. Build script wasn\'t running on deploy — fixed in CI pipeline.',
      status: Status.CLOSED,
      priority: Priority.MEDIUM,
      severity: Severity.MINOR,
    },
    {
      title: 'Table header columns don\'t align with body on scroll',
      description:
        'Sticky header has different padding than body rows. Use CSS grid or table-layout: fixed for consistent column widths.',
      status: Status.IN_PROGRESS,
      priority: Priority.LOW,
      severity: Severity.TRIVIAL,
    },
    {
      title: 'Test: Issue cannot be updated by non-owner',
      description:
        'Write vitest spec covering authorization check. Should return 403 when user A tries to PATCH user B\'s issue.',
      status: Status.OPEN,
      priority: Priority.MEDIUM,
      severity: Severity.MAJOR,
    },
    {
      title: 'Inconsistent error response shape across endpoints',
      description:
        'Some routes return `{error: "..."}`, others `{message: "..."}`, others `{errors: [...]}`. Standardize to `{error, code, details?}`.',
      status: Status.RESOLVED,
      priority: Priority.MEDIUM,
      severity: Severity.MINOR,
    },
    {
      title: 'RDS connection pool exhausted under load',
      description:
        'Load test shows "Can\'t reach database" after ~40 concurrent requests. Prisma default pool is 10 — tune based on DATABASE_URL connection_limit param.',
      status: Status.OPEN,
      priority: Priority.HIGH,
      severity: Severity.MAJOR,
    },
    {
      title: 'Add loading skeleton to issues list',
      description:
        'Current spinner feels laggy. Use shadcn Skeleton component to show rows while loading — better perceived performance.',
      status: Status.OPEN,
      priority: Priority.LOW,
      severity: Severity.TRIVIAL,
    },
  ];

  for (const issue of issues) {
    await prisma.issue.create({
      data: { ...issue, authorId: demoUser.id },
    });
  }

  const count = await prisma.issue.count();
  console.log(`✅ Created ${count} issues`);
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
