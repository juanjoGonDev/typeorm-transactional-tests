# TypeORM Test DB

## Descripción general

TypeORM Test DB envuelve cada spec de Jest en una transacción de base de datos aislada. El helper acepta cualquier `DataSource` inicializado, reemplaza su manager durante la spec y restaura el manager original después del rollback. El paquete está orientado a configuraciones de pruebas reutilizables que mantienen la base de datos de integración limpia.

## Características

- Helper del ciclo de vida de la base de datos de pruebas para TypeORM con hooks explícitos `init` y `finish`.
- Integración agnóstica del framework invocando el ciclo de vida dentro de los hooks del runner de pruebas.
- Compatibilidad con MySQL, MariaDB, PostgreSQL, SQLite y Better SQLite 3.
- Fábricas de datos deterministas impulsadas por una semilla de ejecución reproducible.
- Configuración de pruebas compartida que inicializa una única conexión por worker y ejecuta las specs en paralelo.
- Informes de cobertura generados por defecto mediante `pnpm test`.
- Artefactos de build generados por `pnpm build` y consumidos por Jest para simular una instalación del paquete.

## Instalación

```bash
pnpm add typeorm-test-db
pnpm add typeorm # dependencia peer obligatoria
```

Instala TypeORM en el proyecto anfitrión si aún no está disponible.

## Uso

Crea un archivo de configuración de Jest que inicialice la conexión y registre el ciclo de vida de la base de datos de pruebas para TypeORM.

```typescript
import { afterAll, afterEach, beforeAll, beforeEach } from "@jest/globals";
import { DataSource } from "typeorm";
import { TypeormTestDB } from "typeorm-test-db";

const dataSource = new DataSource({
  type: "mysql",
  host: "127.0.0.1",
  port: 3306,
  username: "root",
  password: "test",
  database: "test",
  synchronize: true,
  entities: [],
});

const lifecycle = TypeormTestDB(dataSource);

beforeEach(async () => {
  await lifecycle.init();
});

afterEach(async () => {
  await lifecycle.finish();
});
```

Importa tus repositorios o managers dentro de las specs. Todas las mutaciones ejecutadas entre los hooks registrados se revierten de forma automática.

## Ejecución de pruebas

La suite genera datos reproducibles por spec y expone la variable de entorno `TEST_SEED` para controlar el orden de ejecución. `pnpm test` ejecuta Jest en workers paralelos, fuerza la recolección de cobertura y compila el paquete antes de las pruebas para ejercitar la salida empaquetada.

## Integración continua

El workflow de GitHub Actions ejecuta el linting y la suite de Jest contra una matriz de bases de datos transaccionales. Un job final de agregación falla cuando cualquier job de la matriz reporta errores, manteniendo estable el check requerido incluso cuando se añaden nuevas bases de datos.

## Desarrollo

- `pnpm lint` verifica la calidad del código.
- `pnpm build` genera el bundle de producción en `dist`.
- `pnpm test` recompila el paquete y ejecuta las pruebas con datos semilla.

## Licencia

TypeORM Test DB está disponible bajo la GNU General Public License v3.0 o posterior.
