# TypeORM Transactional Tests

Automated transactional lifecycle helpers that keep every Jest test isolated while using TypeORM. The utilities supplied by this package wrap each test case inside its own database transaction and roll back the changes after the assertion phase. This approach keeps your database in a pristine state without manual cleanup logic.

## Features

- Declarative test lifecycle helpers for Jest
- Automatic transaction start and rollback
- Works with any TypeORM-supported database engine
- Zero dependencies in production and no global state

## Installation

```bash
pnpm add typeorm-transactional-tests
```

Install TypeORM in the consuming project if it is not already present because it is required as a peer dependency.

```bash
pnpm add typeorm
```

## Usage

```typescript
import { beforeEach, afterEach } from '@jest/globals';
import { DataSource } from 'typeorm';
import { createTransactionalTestContext } from 'typeorm-transactional-tests';

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [ExampleEntity],
  synchronize: true
});

await dataSource.initialize();

const lifecycle = createTransactionalTestContext(dataSource);

beforeEach(async () => {
  await lifecycle.beforeEach();
});

afterEach(async () => {
  await lifecycle.afterEach();
});
```

Every repository or manager retrieved from the `dataSource` inside the tests will operate within the current transaction. Each test starts with a clean state after the rollback runs.

## Scripts

- `pnpm test` runs the automated Jest test suite.
- `pnpm lint` ensures the source files follow the linting rules.
- `pnpm build` compiles the TypeScript sources into the `dist` directory.

## Contributing

1. Fork the repository.
2. Create a new branch describing your change.
3. Install dependencies with `pnpm install`.
4. Run `pnpm lint` and `pnpm test` before submitting a pull request.

## License

MIT
