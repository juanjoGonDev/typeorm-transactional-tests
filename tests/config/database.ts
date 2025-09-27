import type { DataSourceOptions } from 'typeorm';
import type { EntityDefinition, EntityDefinitionList } from '../shared/entity-definition';

const supportedDriverTypes = ['mysql', 'postgres', 'sqlite'] as const;

const environmentVariableNames = {
  type: 'TEST_DB_TYPE',
  mysql: {
    host: 'TEST_MYSQL_HOST',
    port: 'TEST_MYSQL_PORT',
    username: 'TEST_MYSQL_USER',
    password: 'TEST_MYSQL_PASSWORD',
    database: 'TEST_MYSQL_DATABASE'
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
  }
} as const;

const mysqlDefaults = {
  host: '127.0.0.1',
  port: 3306,
  username: 'root',
  password: 'test',
  database: 'test'
} as const;

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

const toEntityList = (entities: EntityCollection): EntityDefinition[] => {
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

const buildMysqlOptions = (entities: EntityCollection): DataSourceOptions => {
  const env = process.env;
  return {
    type: 'mysql',
    host: env[environmentVariableNames.mysql.host] ?? mysqlDefaults.host,
    port: readInteger(env[environmentVariableNames.mysql.port], mysqlDefaults.port),
    username: env[environmentVariableNames.mysql.username] ?? mysqlDefaults.username,
    password: env[environmentVariableNames.mysql.password] ?? mysqlDefaults.password,
    database: env[environmentVariableNames.mysql.database] ?? mysqlDefaults.database,
    synchronize: true,
    entities: toEntityList(entities)
  };
};

const buildPostgresOptions = (entities: EntityCollection): DataSourceOptions => {
  const env = process.env;
  return {
    type: 'postgres',
    host: env[environmentVariableNames.postgres.host] ?? postgresDefaults.host,
    port: readInteger(env[environmentVariableNames.postgres.port], postgresDefaults.port),
    username: env[environmentVariableNames.postgres.username] ?? postgresDefaults.username,
    password: env[environmentVariableNames.postgres.password] ?? postgresDefaults.password,
    database: env[environmentVariableNames.postgres.database] ?? postgresDefaults.database,
    synchronize: true,
    entities: toEntityList(entities)
  };
};

const buildSqliteOptions = (entities: EntityCollection): DataSourceOptions => {
  const env = process.env;
  return {
    type: 'sqlite',
    database: env[environmentVariableNames.sqlite.database] ?? sqliteDefaults.database,
    synchronize: true,
    entities: toEntityList(entities)
};
};

export const resolveTestDataSourceOptions = (entities: EntityCollection): DataSourceOptions => {
  const driver = normalizeDriver(process.env[environmentVariableNames.type]);
  if (driver === 'mysql') {
    return buildMysqlOptions(entities);
  }
  if (driver === 'postgres') {
    return buildPostgresOptions(entities);
  }
  return buildSqliteOptions(entities);
};
