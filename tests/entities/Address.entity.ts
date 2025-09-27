import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { columnLengths, tableNames } from './constants';
import { booleanDefaults } from './defaults';
import { User } from './User.entity';

const cascadeDelete = 'CASCADE';

@Entity({ name: tableNames.address })
export class Address {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ length: columnLengths.street })
  public street!: string;

  @Column({ length: columnLengths.city })
  public city!: string;

  @Column({ length: columnLengths.country })
  public country!: string;

  @Column({ length: columnLengths.postalCode })
  public postalCode!: string;

  @Column({ default: booleanDefaults.addressPrimary })
  public isPrimary!: boolean;

  @ManyToOne(() => User, (user) => user.addresses, { onDelete: cascadeDelete })
  public user!: User;
}
