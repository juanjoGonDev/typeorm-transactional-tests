import { randomUUID } from 'crypto';
import type { DataSource } from 'typeorm';
import { orderStatuses, paymentStatuses } from '../../src/testing/entities/defaults';
import { Order } from '../../src/testing/entities/Order.entity';
import { OrderItem } from '../../src/testing/entities/OrderItem.entity';
import { Payment } from '../../src/testing/entities/Payment.entity';
import { Product } from '../../src/testing/entities/Product.entity';
import { User } from '../../src/testing/entities/User.entity';

const userNotFoundMessage = 'User not found for email';
const productNotFoundMessage = 'Product not found for sku';
const insufficientInventoryMessage = 'Insufficient inventory for sku';
const paymentReferencePrefix = 'txn_service_';
const currencyFractionDigits = 2;

export interface OrderCreationItem {
  readonly sku: string;
  readonly quantity: number;
}

export interface OrderCreationInput {
  readonly userEmail: string;
  readonly provider: string;
  readonly items: ReadonlyArray<OrderCreationItem>;
}

export class TransactionalOrderService {
  private readonly dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  public async placeOrder(input: OrderCreationInput): Promise<Order> {
    return await this.dataSource.manager.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const productRepository = manager.getRepository(Product);
      const orderRepository = manager.getRepository(Order);
      const paymentRepository = manager.getRepository(Payment);

      const user = await userRepository.findOne({ where: { email: input.userEmail } });
      if (user === null) {
        throw new Error(`${userNotFoundMessage}: ${input.userEmail}`);
      }

      const orderItems: OrderItem[] = [];
      let runningTotal = 0;
      const updatedProducts: Product[] = [];

      for (const item of input.items) {
        const product = await productRepository.findOne({ where: { sku: item.sku } });
        if (product === null) {
          throw new Error(`${productNotFoundMessage}: ${item.sku}`);
        }
        if (product.inventoryCount < item.quantity) {
          throw new Error(`${insufficientInventoryMessage}: ${item.sku}`);
        }
        product.inventoryCount -= item.quantity;
        const unitPrice = Number.parseFloat(product.price);
        runningTotal += unitPrice * item.quantity;
        const orderItem = manager.create(OrderItem, {
          quantity: item.quantity,
          unitPrice: product.price,
          product
        });
        orderItems.push(orderItem);
        updatedProducts.push(product);
      }

      await productRepository.save(updatedProducts);

      const total = runningTotal.toFixed(currencyFractionDigits);
      const order = orderRepository.create({
        status: orderStatuses.created,
        total,
        user
      });
      order.items = orderItems.map((item) => {
        item.order = order;
        return item;
      });
      const payment = paymentRepository.create({
        provider: input.provider,
        transactionReference: `${paymentReferencePrefix}${randomUUID()}`,
        status: paymentStatuses.pending,
        amount: total,
        processedAt: new Date()
      });
      const savedOrder = await orderRepository.save(order);
      payment.order = savedOrder;
      const savedPayment = await paymentRepository.save(payment);
      savedPayment.status = paymentStatuses.settled;
      const settledPayment = await paymentRepository.save(savedPayment);
      savedOrder.payment = settledPayment;
      return savedOrder;
    });
  }
}
