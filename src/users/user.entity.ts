import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, length: 15, unique: true })
  userName: string;

  @Column({ nullable: false })
  password: string;

  @Column()
  registeredDate: Date;
}
