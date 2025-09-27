import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { decimalConfig, tableNames } from './constants';
import { Order } from './Order.entity';
import { Product } from './Product.entity';

const decimalColumnType = 'decimal';
const integerColumnType = 'int';
const defaultQuantity = 1;
const cascadeDelete = 'CASCADE';

@Entity({ name: tableNames.orderItem })
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ type: integerColumnType, default: defaultQuantity })
  public quantity!: number;

  @Column({ type: decimalColumnType, precision: decimalConfig.pricePrecision, scale: decimalConfig.priceScale })
  public unitPrice!: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: cascadeDelete })
  public order!: Order;

  @ManyToOne(() => Product, (product) => product.items, { eager: true })
  public product!: Product;
}
