import { Column, Entity, OneToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { columnLengths, decimalConfig, tableNames } from './constants';
import { paymentStatuses } from './defaults';
import { Order } from './Order.entity';

const decimalColumnType = 'decimal';
const dateTimeColumnType = 'datetime';

@Entity({ name: tableNames.payment })
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ length: columnLengths.paymentProvider })
  public provider!: string;

  @Column({ length: columnLengths.transactionReference })
  public transactionReference!: string;

  @Column({ length: columnLengths.status, default: paymentStatuses.pending })
  public status!: string;

  @Column({ type: decimalColumnType, precision: decimalConfig.pricePrecision, scale: decimalConfig.priceScale })
  public amount!: string;

  @Column({ type: dateTimeColumnType })
  public processedAt!: Date;

  @OneToOne(() => Order, (order) => order.payment)
  @JoinColumn()
  public order!: Order;
}
