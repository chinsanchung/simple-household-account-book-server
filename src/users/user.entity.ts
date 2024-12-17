import { Entity, Column } from 'typeorm';

@Entity()
export class User {
  @Column({ primary: true, nullable: false, length: 15 })
  userId: string;

  @Column({ nullable: false })
  password: string;

  @Column()
  registeredDate: Date;
}
