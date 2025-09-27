import type { EntityDefinition } from '../shared/entity-definition';
import { Address } from './Address.entity';
import { Category } from './Category.entity';
import { Order } from './Order.entity';
import { OrderItem } from './OrderItem.entity';
import { Payment } from './Payment.entity';
import { Product } from './Product.entity';
import { Profile } from './Profile.entity';
import { User } from './User.entity';

export const testEntities: EntityDefinition[] = [
  User,
  Profile,
  Address,
  Category,
  Product,
  Order,
  OrderItem,
  Payment
];

export {
  Address,
  Category,
  Order,
  OrderItem,
  Payment,
  Product,
  Profile,
  User
};
