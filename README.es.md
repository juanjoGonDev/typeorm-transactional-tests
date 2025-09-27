# TypeORM Transactional Tests

## Descripción general

TypeORM Transactional Tests envuelve cada spec de Jest en una transacción aislada. El helper recibe cualquier `DataSource` inicializado, sustituye su manager durante la prueba y restaura el manager original tras ejecutar el rollback. El paquete facilita bancos de pruebas reutilizables que mantienen limpia la base de datos de integración.

## Características

- Ciclo de vida transaccional con hooks `init` y `finish` explícitos.
- Compatibilidad con MySQL, MariaDB, PostgreSQL, SQLite y Better SQLite 3.
- Factorías deterministas alimentadas por una semilla reproducible.
- Configuración compartida que inicia una única conexión por worker y ejecuta las pruebas en paralelo.
- Informes de cobertura activados por defecto mediante `pnpm test`.
- La compilación generada por `pnpm build` se reutiliza durante el testeo para simular una instalación desde npm.

## Instalación

```bash
pnpm add typeorm-transactional-tests
pnpm add typeorm # dependencia peer
```

Instala TypeORM en el proyecto anfitrión si aún no está presente.

## Uso

Crea un archivo de configuración para Jest que inicialice el `DataSource` y registre el ciclo de vida transaccional.

```typescript
import { DataSource } from 'typeorm';
import { createTransactionalTestContext } from 'typeorm-transactional-tests';

const dataSource = new DataSource({
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  username: 'root',
  password: 'test',
  database: 'test',
  synchronize: true,
  entities: [/* entidades */]
});

const transactionalContext = createTransactionalTestContext(dataSource);

beforeAll(async () => {
  await dataSource.initialize();
});

afterAll(async () => {
  await dataSource.destroy();
});

beforeEach(async () => {
  await transactionalContext.init();
});

afterEach(async () => {
  await transactionalContext.finish();
});
```

Importa `createTransactionalTestContext` en tus pruebas y realiza las aserciones sobre repositorios o el entity manager. Todo lo que suceda entre `init` y `finish` se revierte automáticamente.

## Ejecución de pruebas

La suite crea fixtures reproducibles por spec y expone la variable de entorno `TEST_SEED` para controlar el orden de ejecución. `pnpm test` ejecuta Jest en paralelo, obliga a generar cobertura y compila el paquete de antemano para ejercitar el artefacto publicado.

## Integración continua

El flujo de GitHub Actions ejecuta el linting y prueba la suite sobre una matriz de bases de datos transaccionales. Un trabajo final de agregación falla cuando alguno de los trabajos de la matriz produce errores, lo que mantiene un único check obligatorio aunque se añadan nuevas bases de datos.

## Desarrollo

- `pnpm lint` valida la calidad del código.
- `pnpm build` genera el bundle en `dist`.
- `pnpm test` recompila el paquete, ejecuta las pruebas de integración con datos semilla y verifica la instalación del tarball en un proyecto limpio.

## Licencia

TypeORM Transactional Tests está disponible bajo la GNU General Public License v3.0 o posterior.
