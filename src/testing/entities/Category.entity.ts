import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { columnLengths, tableNames } from './constants';
import { Product } from './Product.entity';

@Entity({ name: tableNames.category })
@Unique(['name'])
export class Category {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ length: columnLengths.categoryName })
  public name!: string;

  @OneToMany(() => Product, (product: Product) => product.category)
  public products!: Product[];
}
