import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { columnLengths, decimalConfig, tableNames } from './constants';
import { orderStatuses } from './defaults';
import { User } from './User.entity';
import { OrderItem } from './OrderItem.entity';
import { Payment } from './Payment.entity';

const decimalColumnType = 'decimal';

@Entity({ name: tableNames.order })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ length: columnLengths.status, default: orderStatuses.created })
  public status!: string;

  @Column({ type: decimalColumnType, precision: decimalConfig.pricePrecision, scale: decimalConfig.priceScale })
  public total!: string;

  @CreateDateColumn()
  public placedAt!: Date;

  @ManyToOne(() => User, (user: User) => user.orders, { nullable: false })
  public user!: User;

  @OneToMany(() => OrderItem, (item: OrderItem) => item.order, { cascade: ['insert'] })
  public items!: OrderItem[];

  @OneToOne(() => Payment, (payment: Payment) => payment.order)
  public payment!: Payment;
}
