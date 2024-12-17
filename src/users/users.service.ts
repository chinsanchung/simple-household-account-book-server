import { Injectable, ConflictException } from '@nestjs/common';
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
    const existingUser = await this.usersRepository.findOne({
      where: { userId },
    });
    if (existingUser) {
      throw new ConflictException('이미 같은 이름의 아이디가 있습니다.');
    }

    const user = new User();
    user.userId = userId;
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);
    user.registeredDate = new Date();

    return this.usersRepository.save(user);
  }
}
