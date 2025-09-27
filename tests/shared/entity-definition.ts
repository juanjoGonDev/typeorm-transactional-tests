import type { EntitySchema } from 'typeorm';

type EntityConstructor = new () => Record<string, unknown>;

export type EntityDefinition = string | EntitySchema<unknown> | EntityConstructor;
export type EntityDefinitionList = ReadonlyArray<EntityDefinition>;
