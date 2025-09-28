import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm';
import { columnLengths, tableNames } from './constants';
import { booleanDefaults, userStatuses } from './defaults';
import { Profile } from './Profile.entity';
import { Address } from './Address.entity';
import { Order } from './Order.entity';

@Entity({ name: tableNames.user })
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ length: columnLengths.fullName })
  public fullName!: string;

  @Column({ length: columnLengths.email })
  public email!: string;

  @Column({ length: columnLengths.status, default: userStatuses.active })
  public status!: string;

  @OneToOne(() => Profile, (profile: Profile) => profile.user, { cascade: true })
  public profile!: Profile;

  @OneToMany(() => Address, (address: Address) => address.user, { cascade: ['insert', 'update'] })
  public addresses!: Address[];

  @OneToMany(() => Order, (order: Order) => order.user)
  public orders!: Order[];

  @Column({ default: booleanDefaults.marketingOptIn })
  public marketingOptIn!: boolean;

  @CreateDateColumn()
  public createdAt!: Date;

  @UpdateDateColumn()
  public updatedAt!: Date;
}
