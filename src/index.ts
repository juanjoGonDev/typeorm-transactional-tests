import type { DataSource } from "typeorm";
import { TypeormTestDb, type TypeormTestDbOptions } from "./lifecycle/TypeormTestDb";

export const TypeormTestDB = (
  dataSource: DataSource,
  options?: TypeormTestDbOptions
): TypeormTestDb => {
  return new TypeormTestDb(dataSource, options);
};

export { TypeormTestDb };
export type { TypeormTestDbOptions };
