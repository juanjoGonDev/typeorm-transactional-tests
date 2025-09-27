# TypeORM Transactional Tests

## English

TypeORM Transactional Tests provides Jest helpers that wrap every spec inside a database transaction, ensuring each run leaves the schema untouched. The helpers are framework-agnostic and keep the original `DataSource` manager intact outside the test lifecycle.

### Features

- Automatic transaction start on `init` and rollback on `finish`.
- Works with MySQL, PostgreSQL, and SQLite without mutating global state.
- Type-safe API with no runtime dependencies beyond TypeORM.

### Installation

```bash
pnpm add typeorm-transactional-tests
```

Install TypeORM in the host project if it is not already present.

```bash
pnpm add typeorm
```

### Configuration

Create a Jest setup file that initializes your `DataSource`, builds the transactional context, and registers the hooks.

```typescript
import { transactionalContext } from './tests/setup/transactional-context';

beforeEach(async () => {
  await transactionalContext.init();
});

afterEach(async () => {
  await transactionalContext.finish();
});
```

For the test database connection, set environment variables before running the suite. The default type is MySQL.

| Variable | Description | Default |
| --- | --- | --- |
| `TEST_DB_TYPE` | `mysql`, `postgres`, or `sqlite`. | `mysql` |
| `TEST_MYSQL_HOST` | Host for MySQL. | `127.0.0.1` |
| `TEST_MYSQL_PORT` | Port for MySQL. | `3306` |
| `TEST_MYSQL_USER` | Username for MySQL. | `root` |
| `TEST_MYSQL_PASSWORD` | Password for MySQL. | `test` |
| `TEST_MYSQL_DATABASE` | Database name for MySQL. | `test` |
| `TEST_POSTGRES_HOST` | Host for PostgreSQL. | `127.0.0.1` |
| `TEST_POSTGRES_PORT` | Port for PostgreSQL. | `5432` |
| `TEST_POSTGRES_USER` | Username for PostgreSQL. | `postgres` |
| `TEST_POSTGRES_PASSWORD` | Password for PostgreSQL. | `test` |
| `TEST_POSTGRES_DATABASE` | Database name for PostgreSQL. | `test` |
| `TEST_SQLITE_DATABASE` | SQLite path or `:memory:`. | `:memory:` |

Run the suite with `pnpm test`. To use SQLite locally:

```bash
TEST_DB_TYPE=sqlite pnpm test
```

### Scripts

- `pnpm test` runs the Jest suite.
- `pnpm lint` checks the codebase with ESLint.
- `pnpm build` compiles the TypeScript sources.

## Español

TypeORM Transactional Tests ofrece utilidades para Jest que envuelven cada prueba en una transacción de base de datos y revierten los cambios al finalizar. Así tus datos permanecen limpios sin lógica adicional de limpieza.

### Características

- Inicio automático de transacción con `init` y reversión con `finish`.
- Compatible con MySQL, PostgreSQL y SQLite sin estado global.
- API tipada basada únicamente en TypeORM.

### Instalación

```bash
pnpm add typeorm-transactional-tests
pnpm add typeorm
```

### Configuración

Crea un archivo de configuración para Jest que inicialice el `DataSource`, cree el contexto transaccional y registre los ganchos.

```typescript
import { transactionalContext } from './tests/setup/transactional-context';

beforeEach(async () => {
  await transactionalContext.init();
});

afterEach(async () => {
  await transactionalContext.finish();
});
```

Antes de ejecutar las pruebas define las variables de entorno anteriores. El tipo por defecto es MySQL, por lo que si trabajas en local sin esa base de datos puedes ejecutar:

```bash
TEST_DB_TYPE=sqlite pnpm test
```

### Scripts

- `pnpm test` ejecuta las pruebas automatizadas.
- `pnpm lint` valida el código con ESLint.
- `pnpm build` transpila los archivos TypeScript.

## 中文

TypeORM Transactional Tests 为 Jest 提供事务化的测试工具，每个测试用例都会在事务中运行并在结束时回滚，避免污染数据库。

### 功能

- 通过 `init` 启动事务，`finish` 自动回滚。
- 支持 MySQL、PostgreSQL 与 SQLite，且不会修改全局状态。
- 仅依赖 TypeORM，保持完整的类型提示。

### 安装

```bash
pnpm add typeorm-transactional-tests
pnpm add typeorm
```

### 配置

在 Jest 的预设文件中初始化数据源并注册生命周期钩子。

```typescript
import { transactionalContext } from './tests/setup/transactional-context';

beforeEach(async () => {
  await transactionalContext.init();
});

afterEach(async () => {
  await transactionalContext.finish();
});
```

运行测试前设置所需的环境变量。默认数据库类型为 MySQL，如需在本地使用 SQLite：

```bash
TEST_DB_TYPE=sqlite pnpm test
```

### 脚本

- `pnpm test` 运行 Jest 测试。
- `pnpm lint` 使用 ESLint 检查代码。
- `pnpm build` 编译 TypeScript。

## License

MIT
