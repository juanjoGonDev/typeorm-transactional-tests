import type { EntitySchema } from 'typeorm';

type EntityConstructor = new () => object;

export type EntityDefinition = string | EntitySchema<unknown> | EntityConstructor;
export type EntityDefinitionList = ReadonlyArray<EntityDefinition>;
