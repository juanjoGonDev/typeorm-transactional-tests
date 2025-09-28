import type { EntitySchema } from 'typeorm';

type EntityConstructor = abstract new (...args: never[]) => object;

export type EntityDefinition = string | EntitySchema<unknown> | EntityConstructor;
export type EntityDefinitionList = EntityDefinition[];
