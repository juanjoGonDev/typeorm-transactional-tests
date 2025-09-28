import { promises as fs } from 'fs';
import { dirname, extname, join, basename } from 'path';
import { createPool } from 'mysql2/promise';
import { Client } from 'pg';
import type { DataSourceOptions } from 'typeorm';
import type { EntityDefinitionList } from '../../src/testing/entity-definition';

const supportedDriverTypes = ['mysql', 'mariadb', 'postgres', 'sqlite', 'better-sqlite3'] as const;

const driverNames = {
  mysql: 'mysql',
  mariadb: 'mariadb',
  postgres: 'postgres',
  sqlite: 'sqlite',
  betterSqlite: 'better-sqlite3'
} as const;

const workerEnvironmentVariable = 'JEST_WORKER_ID';
const workerLabelPrefix = 'worker';
const identifierSeparator = '_';
const postgresDefaultDatabase = 'postgres';
const mysqlCreateDatabaseStatement = 'CREATE DATABASE IF NOT EXISTS';
const mysqlGrantPrivilegesStatement = 'GRANT ALL PRIVILEGES ON';
const mysqlToClause = 'TO';
const postgresDatabaseExistsQuery = 'SELECT 1 FROM pg_database WHERE datname = $1';
const postgresCreateDatabaseStatement = 'CREATE DATABASE';
const mysqlDefaultRuntimeHost = '%';

const prepareNoop = async (): Promise<void> => {
  return Promise.resolve();
};

const environmentVariableNames = {
  type: 'TEST_DB_TYPE',
  mysql: {
    host: 'TEST_MYSQL_HOST',
    port: 'TEST_MYSQL_PORT',
    username: 'TEST_MYSQL_USER',
    password: 'TEST_MYSQL_PASSWORD',
    database: 'TEST_MYSQL_DATABASE',
    adminUsername: 'TEST_MYSQL_ADMIN_USER',
    adminPassword: 'TEST_MYSQL_ADMIN_PASSWORD',
    runtimeHost: 'TEST_MYSQL_RUNTIME_HOST'
  },
  mariadb: {
    host: 'TEST_MARIADB_HOST',
    port: 'TEST_MARIADB_PORT',
    username: 'TEST_MARIADB_USER',
    password: 'TEST_MARIADB_PASSWORD',
    database: 'TEST_MARIADB_DATABASE',
    adminUsername: 'TEST_MARIADB_ADMIN_USER',
    adminPassword: 'TEST_MARIADB_ADMIN_PASSWORD',
    runtimeHost: 'TEST_MARIADB_RUNTIME_HOST'
  },
  postgres: {
    host: 'TEST_POSTGRES_HOST',
    port: 'TEST_POSTGRES_PORT',
    username: 'TEST_POSTGRES_USER',
    password: 'TEST_POSTGRES_PASSWORD',
    database: 'TEST_POSTGRES_DATABASE'
  },
  sqlite: {
    database: 'TEST_SQLITE_DATABASE'
  },
  betterSqlite: {
    database: 'TEST_BETTER_SQLITE_DATABASE'
  }
} as const;

const schemaSynchronization = {
  synchronize: true,
  dropSchema: true
} as const;

const mysqlDefaults: MysqlLikeDefaults = {
  host: '127.0.0.1',
  port: 3306,
  username: 'root',
  password: 'test',
  database: 'test'
};

const mariadbDefaults: MysqlLikeDefaults = {
  host: '127.0.0.1',
  port: 3307,
  username: 'root',
  password: 'test',
  database: 'test'
};

const postgresDefaults = {
  host: '127.0.0.1',
  port: 5432,
  username: 'postgres',
  password: 'test',
  database: 'test'
} as const;

const sqliteDefaults = {
  database: ':memory:'
} as const;

const workerFallbackId = '1';

type SupportedDriver = (typeof supportedDriverTypes)[number];

type EntityCollection = EntityDefinitionList;

type MysqlLikeDefaults = {
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
  readonly database: string;
};

type MysqlLikeEnv = typeof environmentVariableNames.mysql | typeof environmentVariableNames.mariadb;

type MysqlLikeAdminCredentials = {
  readonly username: string;
  readonly password: string;
};

type DatabasePreparation = () => Promise<void>;

interface TestDatabaseConfiguration {
  readonly options: DataSourceOptions;
  readonly prepare: DatabasePreparation;
}

type MysqlLikeOptions = DataSourceOptions & {
  readonly type: typeof driverNames.mysql | typeof driverNames.mariadb;
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
  readonly database: string;
};

type PostgresOptions = DataSourceOptions & {
  readonly type: typeof driverNames.postgres;
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
  readonly database: string;
};

const toEntityList = (entities: EntityCollection): EntityDefinitionList => {
  return [...entities];
};

const normalizeDriver = (value: string | undefined): SupportedDriver => {
  const normalized = value?.toLowerCase() ?? '';
  const driver = supportedDriverTypes.find((candidate) => candidate === normalized);
  if (driver !== undefined) {
    return driver;
  }
  return 'mysql';
};

const sanitizeWorkerId = (value: string | undefined): string => {
  if (value === undefined) {
    return workerFallbackId;
  }
  const trimmed = value.trim();
  if (trimmed === '') {
    return workerFallbackId;
  }
  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }
  return workerFallbackId;
};

const buildWorkerAwareName = (base: string): string => {
  const workerId = sanitizeWorkerId(process.env[workerEnvironmentVariable]);
  return `${base}${identifierSeparator}${workerLabelPrefix}${workerId}`;
};

const deriveWorkerAwareFile = (filePath: string): string => {
  if (filePath === sqliteDefaults.database) {
    return filePath;
  }

  const workerId = sanitizeWorkerId(process.env[workerEnvironmentVariable]);
  const directory = dirname(filePath);
  const extension = extname(filePath);
  const baseName = basename(filePath, extension);
  const workerAwareName = `${baseName}${identifierSeparator}${workerLabelPrefix}${workerId}`;
  return join(directory, extension === '' ? workerAwareName : `${workerAwareName}${extension}`);
};

const formatMysqlIdentifier = (identifier: string): string => {
  const sanitized = identifier.replace(/`/g, '');
  return `\`${sanitized}\``;
};

const formatMysqlUserReference = (username: string, host: string): string => {
  const sanitizedUsername = username.replace(/'/g, "''");
  const sanitizedHost = host.replace(/'/g, "''");
  return `'${sanitizedUsername}'@'${sanitizedHost}'`;
};

const formatPostgresIdentifier = (identifier: string): string => {
  const sanitized = identifier.replace(/"/g, '');
  return `"${sanitized}"`;
};

const readInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return parsed;
};

const buildMysqlLikeOptions = (
  entities: EntityCollection,
  defaults: MysqlLikeDefaults,
  envNames: MysqlLikeEnv,
  type: typeof driverNames.mysql | typeof driverNames.mariadb
): MysqlLikeOptions => {
  const env = process.env;
  const database = buildWorkerAwareName(env[envNames.database] ?? defaults.database);
  return {
    type,
    host: env[envNames.host] ?? defaults.host,
    port: readInteger(env[envNames.port], defaults.port),
    username: env[envNames.username] ?? defaults.username,
    password: env[envNames.password] ?? defaults.password,
    database,
    entities: toEntityList(entities),
    ...schemaSynchronization
  };
};

const buildPostgresOptions = (entities: EntityCollection): PostgresOptions => {
  const env = process.env;
  const names = environmentVariableNames.postgres;
  const database = buildWorkerAwareName(env[names.database] ?? postgresDefaults.database);
  return {
    type: 'postgres',
    host: env[names.host] ?? postgresDefaults.host,
    port: readInteger(env[names.port], postgresDefaults.port),
    username: env[names.username] ?? postgresDefaults.username,
    password: env[names.password] ?? postgresDefaults.password,
    database,
    entities: toEntityList(entities),
    ...schemaSynchronization
  };
};

const buildSqliteOptions = (entities: EntityCollection): DataSourceOptions => {
  const env = process.env;
  return {
    type: 'sqlite',
    database: env[environmentVariableNames.sqlite.database] ?? sqliteDefaults.database,
    entities: toEntityList(entities),
    ...schemaSynchronization
  };
};

const buildBetterSqliteOptions = (entities: EntityCollection): DataSourceOptions => {
  const env = process.env;
  const configuredPath = env[environmentVariableNames.betterSqlite.database] ?? sqliteDefaults.database;
  const database = deriveWorkerAwareFile(configuredPath);

  return {
    type: 'better-sqlite3',
    database,
    entities: toEntityList(entities),
    ...schemaSynchronization
  };
};

const resolveMysqlAdminCredentials = (
  envNames: MysqlLikeEnv,
  defaults: MysqlLikeDefaults,
  env: NodeJS.ProcessEnv
): MysqlLikeAdminCredentials => {
  const username = env[envNames.adminUsername] ?? defaults.username;
  const password = env[envNames.adminPassword] ?? defaults.password;
  return { username, password };
};

const resolveMysqlRuntimeHost = (envNames: MysqlLikeEnv, env: NodeJS.ProcessEnv): string => {
  const host = env[envNames.runtimeHost];
  if (host === undefined || host.trim() === '') {
    return mysqlDefaultRuntimeHost;
  }
  return host.trim();
};

const createMysqlPreparation = (
  options: MysqlLikeOptions,
  envNames: MysqlLikeEnv,
  defaults: MysqlLikeDefaults
): DatabasePreparation => {
  return async () => {
    const env = process.env;
    const adminCredentials = resolveMysqlAdminCredentials(envNames, defaults, env);
    const runtimeHost = resolveMysqlRuntimeHost(envNames, env);
    const pool = createPool({
      host: env[envNames.host] ?? defaults.host,
      port: readInteger(env[envNames.port], defaults.port),
      user: adminCredentials.username,
      password: adminCredentials.password,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0
    });

    try {
      await pool.query(`${mysqlCreateDatabaseStatement} ${formatMysqlIdentifier(options.database)}`);
      await pool.query(
        `${mysqlGrantPrivilegesStatement} ${formatMysqlIdentifier(options.database)}.* ${mysqlToClause} ${formatMysqlUserReference(
          options.username,
          runtimeHost
        )}`
      );
    } finally {
      await pool.end();
    }
  };
};

const createPostgresPreparation = (options: PostgresOptions): DatabasePreparation => {
  return async () => {
    const client = new Client({
      host: options.host,
      port: options.port,
      user: options.username,
      password: options.password,
      database: postgresDefaultDatabase
    });

    try {
      await client.connect();
      const databaseExists = await client.query(postgresDatabaseExistsQuery, [options.database]);
      if (databaseExists.rowCount === 0) {
        await client.query(`${postgresCreateDatabaseStatement} ${formatPostgresIdentifier(options.database)}`);
      }
    } finally {
      await client.end();
    }
  };
};

const createBetterSqlitePreparation = (databasePath: string): DatabasePreparation => {
  if (databasePath === sqliteDefaults.database) {
    return prepareNoop;
  }

  return async () => {
    await fs.mkdir(dirname(databasePath), { recursive: true });
  };
};

const createTestDatabaseConfiguration = (entities: EntityCollection): TestDatabaseConfiguration => {
  const driver = normalizeDriver(process.env[environmentVariableNames.type]);

  if (driver === driverNames.mysql) {
    const options = buildMysqlLikeOptions(entities, mysqlDefaults, environmentVariableNames.mysql, driverNames.mysql);
    return { options, prepare: createMysqlPreparation(options, environmentVariableNames.mysql, mysqlDefaults) };
  }

  if (driver === driverNames.mariadb) {
    const options = buildMysqlLikeOptions(entities, mariadbDefaults, environmentVariableNames.mariadb, driverNames.mariadb);
    return { options, prepare: createMysqlPreparation(options, environmentVariableNames.mariadb, mariadbDefaults) };
  }

  if (driver === driverNames.postgres) {
    const options = buildPostgresOptions(entities);
    return { options, prepare: createPostgresPreparation(options) };
  }

  if (driver === driverNames.betterSqlite) {
    const options = buildBetterSqliteOptions(entities);
    return { options, prepare: createBetterSqlitePreparation(options.database as string) };
  }

  return { options: buildSqliteOptions(entities), prepare: prepareNoop };
};

export const resolveTestDatabaseConfiguration = (entities: EntityCollection): TestDatabaseConfiguration => {
  return createTestDatabaseConfiguration(entities);
};

export const resolveTestDataSourceOptions = (entities: EntityCollection): DataSourceOptions => {
  return createTestDatabaseConfiguration(entities).options;
};
