import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { columnLengths, decimalConfig, tableNames } from './constants';
import { Category } from './Category.entity';
import { OrderItem } from './OrderItem.entity';

const decimalColumnType = 'decimal';
const integerColumnType = 'int';
const inventoryDefault = 0;

@Entity({ name: tableNames.product })
@Unique(['sku'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ length: columnLengths.fullName })
  public name!: string;

  @Column({ length: columnLengths.sku })
  public sku!: string;

  @Column({ type: decimalColumnType, precision: decimalConfig.pricePrecision, scale: decimalConfig.priceScale })
  public price!: string;

  @Column({ type: integerColumnType, default: inventoryDefault })
  public inventoryCount!: number;

  @ManyToOne(() => Category, (category) => category.products, { eager: true })
  public category!: Category;

  @OneToMany(() => OrderItem, (item) => item.product)
  public items!: OrderItem[];
}
