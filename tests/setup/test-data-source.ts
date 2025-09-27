import { DataSource } from 'typeorm';
import { resolveTestDataSourceOptions } from '../config/database';
import { testEntities } from '../entities';

export const testDataSource = new DataSource(resolveTestDataSourceOptions(testEntities));
