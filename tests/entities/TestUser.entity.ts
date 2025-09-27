import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

const tableName = 'test_users' as const;
const primaryColumnType = 'uuid' as const;
const nameColumnType = 'text' as const;

@Entity({ name: tableName })
export class TestUser {
  @PrimaryGeneratedColumn(primaryColumnType)
  public id!: string;

  @Column({ type: nameColumnType })
  public name!: string;
}

export const testUserTableName = tableName;
