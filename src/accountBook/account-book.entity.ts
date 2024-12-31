import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from '../category/category.entity';
import { PaymentMethod } from '../paymentMethod/payment-method.entity';

@Entity()
export class AccountBook {
  @PrimaryGeneratedColumn()
  idx: number;

  @Column({ length: 100 })
  title: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  paymentAmount: number;

  @Column({ length: 20 })
  paymentType: string; // 'INCOME' | 'EXPENSE'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Category, { nullable: false })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  categoryId: number;

  @ManyToOne(() => PaymentMethod, { nullable: true })
  @JoinColumn({ name: 'paymentMethodId' })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  paymentMethodId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;
}
