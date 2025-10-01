# Agent Handbook

## Repository purpose
- This package provides transactional lifecycle helpers around TypeORM data sources so Jest tests can run with deterministic database state management. The public entry point lives in `src/index.ts` and exposes a factory that returns the `TypeormTestDb` class defined under `src/lifecycle`.
- Tests inside `tests/` act as living documentation: they exercise lifecycle helpers, pessimistic locking helpers, and service examples that run against different TypeORM entities.

## Tooling & runtimes
- Use **pnpm** (declared in `package.json` and `volta`) for dependency management and scripts. Node 18 is the minimum supported runtime.
- Available scripts:
  - `pnpm build` builds the distributable under `dist/` using `tsc` with `tsconfig.build.json`.
  - `pnpm test` (and database-specific variants) run Jest with full coverage and seed management configured under `tests/jest.config.ts`.
  - `pnpm lint` runs ESLint with the custom flat config (`eslint.config.cjs`).
- Generated artefacts (`dist/`, coverage output, temporary SQLite files) must stay untracked.

## Project structure expectations
- Keep public-facing code inside `src/`. Respect existing boundaries:
  - `src/constants/` stores shared constant objects (e.g., `errorMessages`). Extend these modules when introducing new string literals so you avoid magic strings.
  - `src/lifecycle/` contains the isolation context and lifecycle orchestration around `TypeormTestDb`. Any new lifecycle utilities should live here and follow the existing pattern of pure, well-typed helpers.
  - `src/index.ts` should only surface deliberate exports for consumers.
- Tests mirror domain concepts. Use `tests/entities` for TypeORM models, `tests/services` for illustrative service logic, `tests/seeds` for fixtures, and `tests/setup` for Jest environment bootstrapping.

## Coding standards
- **Language:** All code, identifiers, and string literals (except when required by third-party APIs) must be written in English.
- **Comments:** Do not add comments. Communicate intent through expressive naming, small pure functions, and descriptive constants.
- **SOLID & clean code:** Compose behavior through small, single-responsibility functions and classes. Prefer dependency injection (see how `TypeormTestDb` receives `DataSource`). Avoid static state unless scoped via abstractions like `AsyncLocalStorage`.
- **Purity & side effects:** Encapsulate side effects. Helper utilities should be pure; lifecycle orchestration methods (`init`, `finish`) are the controlled boundary for effects.
- **Naming conventions:**
  - Classes and types: `PascalCase` (e.g., `TypeormTestDb`, `TransactionStore`).
  - Functions, methods, variables: `camelCase` (e.g., `resolveIsolationContext`).
  - Constants: `camelCase` or `SCREAMING_SNAKE_CASE` depending on usage. Use `as const` when exporting object literals with fixed members (`errorMessages`).
  - Files: follow kebab-case for multi-word filenames (`isolation-context.ts`) and suffix `.entity.ts` for TypeORM entities.
- **Type safety:**
  - The repository compiles with `strict` TypeScript settings. Avoid `any` and prefer explicit interfaces or generics (`TransactionStore`, `OrderCreationInput`).
  - Use `readonly` arrays/tuples when the data should not mutate (`ReadonlyArray`, tuples, `as const`).
  - Narrow unknown values through dedicated helpers (`toError`, `normalizeDriver`).
- **Magic literals:** Never inline magic numbers or strings. Introduce well-named constants (see `savepointPrefix`, `retryableMessageFragments`, `paymentReferencePrefix`) or configuration objects.
- **Error handling:** Throw typed `Error` instances with messages defined in centralized constants. When composing dynamic messages, prefix descriptive constants (see `tests/services/order-service.ts`).
- **Imports & exports:** Prefer named exports. Maintain absolute clarity of module boundaries and avoid default exports. Group Node built-ins, third-party modules, and internal modules separately.
- **Formatting:** Follow the existing Prettier-compatible style enforced by ESLint (two-space indentation, double quotes in `src/`, trailing commas where applicable). Let ESLint/Prettier handle quote differences in decorators or tests.

## TypeORM & lifecycle specifics
- `DataSourceIsolationContext` patches both `DataSource.transaction` and `EntityManager.transaction`. When extending behavior, ensure new logic preserves thread-safety and interacts with `AsyncLocalStorage` without leaking state.
- Pessimistic locking helpers rely on driver detection and query runner capabilities. Any driver-specific behavior must be feature-flagged through sets like `lockingDrivers`.
- Retry behavior uses `maxTransactionAttempts`, `retryDelayBaseMs`, and `retryableMessageFragments`. Extend via constants rather than ad-hoc conditions.
- `TypeormTestDb` must remain responsible for starting/rolling back transactions on a dedicated query runner. If you introduce new lifecycle hooks, ensure they live beside `init`/`finish` and honor idempotency.

## Testing guidelines
- Jest is configured through `tests/jest.config.ts` with `ts-jest`. Keep tests in TypeScript and colocate helpers under `tests/`.
- Use `describe`/`it` with explicit suite titles (see `transactional-service.test.ts`). Follow the Arrange-Act-Assert pattern, using helper functions (`resolveProductSkus`) and seed utilities (`seedDatabase`).
- The shared test environment registers lifecycle hooks in `tests/setup/runtime.ts`. If you add suites that manage their own concurrency, update `isConcurrencyTest` detection accordingly so the automatic `beforeEach`/`afterEach` hooks can opt out.
- Seed data lives under `tests/seeds`. Extend typed fixtures rather than sprinkling inline literals, and export shapes through interfaces in `tests/seeds/types.ts`.
- Reuse entity factories defined in `tests/entities` and respect the decorators already configured. Ensure migrations or schema changes keep synchronization flags in sync with the test configuration.
- Always run relevant Jest suites (`pnpm test` or targeted script) after code changes. Keep coverage high; new code paths should ship with dedicated tests.

## Database & infrastructure notes
- Local development can rely on `docker-compose.yml`, which provisions MySQL, MariaDB, and PostgreSQL with health checks. Update service definitions cautiously and keep environment variable names aligned with those read in `tests/config/database.ts`.
- The test harness dynamically prepares databases per Jest worker (`resolveTestDatabaseConfiguration`). When introducing new drivers or changing database logic, update the corresponding constants and preparation helpers.
- SQLite and Better SQLite use worker-aware file derivation. Guard against path collisions by reusing helpers like `deriveWorkerAwareFile`.

## Linting, quality, and automation
- Run `pnpm lint` before committing. Honor rule overrides already defined (e.g., selective disabling of unsafe TypeScript rules). Do not re-enable disabled rules without project-wide changes.
- Keep dependencies current with `pnpm`. If you add runtime dependencies, update `peerDependencies` or `devDependencies` accordingly and ensure TypeScript typings exist.
- Follow semantic versioning if you adjust release-related files (`package.json`, `CHANGELOG.md`).

## Git & pull requests
- Group related changes into a single commit with a descriptive message summarizing the change.
- Every change should include or update tests when applicable.
- After committing, create the pull request body via the provided automation tools, summarizing key modifications and test evidence.

Adhering to these guidelines guarantees new contributions remain consistent with the repository's existing patterns while meeting the required quality bar.
