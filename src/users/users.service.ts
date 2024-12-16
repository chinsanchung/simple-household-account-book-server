import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  create({ userId, password }: CreateUserDto) {
    const user = new User();
    user.userId = userId;
    user.password = password;

    return this.usersRepository.save(user);
  }
}
