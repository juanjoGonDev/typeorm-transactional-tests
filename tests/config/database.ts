import type { DataSourceOptions } from 'typeorm';
import type { EntityDefinitionList } from '../shared/entity-definition';

const supportedDriverTypes = ['mysql', 'mariadb', 'postgres', 'sqlite', 'better-sqlite3'] as const;

const environmentVariableNames = {
  type: 'TEST_DB_TYPE',
  mysql: {
    host: 'TEST_MYSQL_HOST',
    port: 'TEST_MYSQL_PORT',
    username: 'TEST_MYSQL_USER',
    password: 'TEST_MYSQL_PASSWORD',
    database: 'TEST_MYSQL_DATABASE'
  },
  mariadb: {
    host: 'TEST_MARIADB_HOST',
    port: 'TEST_MARIADB_PORT',
    username: 'TEST_MARIADB_USER',
    password: 'TEST_MARIADB_PASSWORD',
    database: 'TEST_MARIADB_DATABASE'
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
  type: 'mysql' | 'mariadb'
): DataSourceOptions => {
  const env = process.env;
  return {
    type,
    host: env[envNames.host] ?? defaults.host,
    port: readInteger(env[envNames.port], defaults.port),
    username: env[envNames.username] ?? defaults.username,
    password: env[envNames.password] ?? defaults.password,
    database: env[envNames.database] ?? defaults.database,
    entities: toEntityList(entities),
    ...schemaSynchronization
  };
};

const buildPostgresOptions = (entities: EntityCollection): DataSourceOptions => {
  const env = process.env;
  const names = environmentVariableNames.postgres;
  return {
    type: 'postgres',
    host: env[names.host] ?? postgresDefaults.host,
    port: readInteger(env[names.port], postgresDefaults.port),
    username: env[names.username] ?? postgresDefaults.username,
    password: env[names.password] ?? postgresDefaults.password,
    database: env[names.database] ?? postgresDefaults.database,
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
  return {
    type: 'better-sqlite3',
    database: env[environmentVariableNames.betterSqlite.database] ?? sqliteDefaults.database,
    entities: toEntityList(entities),
    ...schemaSynchronization
  };
};

export const resolveTestDataSourceOptions = (entities: EntityCollection): DataSourceOptions => {
  const driver = normalizeDriver(process.env[environmentVariableNames.type]);
  if (driver === 'mysql') {
    return buildMysqlLikeOptions(entities, mysqlDefaults, environmentVariableNames.mysql, 'mysql');
  }
  if (driver === 'mariadb') {
    return buildMysqlLikeOptions(entities, mariadbDefaults, environmentVariableNames.mariadb, 'mariadb');
  }
  if (driver === 'postgres') {
    return buildPostgresOptions(entities);
  }
  if (driver === 'better-sqlite3') {
    return buildBetterSqliteOptions(entities);
  }
  return buildSqliteOptions(entities);
};
