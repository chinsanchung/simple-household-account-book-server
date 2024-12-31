import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PaymentMethod {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30, unique: true })
  name: string;

  @Column({ default: true })
  isActive: boolean;
}
