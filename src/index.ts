import type { DataSource } from 'typeorm';
import { TypeormTestDbContext, type TypeormTestDbLifecycle } from './lifecycle/TypeormTestDbContext';

export const TypeormTestDB = (dataSource: DataSource): TypeormTestDbLifecycle => {
  return new TypeormTestDbContext(dataSource);
};

export type { TypeormTestDbLifecycle };
