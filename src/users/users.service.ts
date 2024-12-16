import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create({ userId, password }: CreateUserDto) {
    const user = new User();
    user.userId = userId;
    user.password = await bcrypt.hash(password, 10);
    user.registeredDate = new Date();

    return this.usersRepository.save(user);
  }
}
