import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import { JwtService } from '@nestjs/jwt';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CustomLoggerService } from '../logger/logger.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly logger: CustomLoggerService,
    private jwtService: JwtService,
  ) {
    this.logger.setContext(UsersService.name);
  }

  async create({ userName, password }: CreateUserDto) {
    try {
      const existingUser = await this.usersRepository.findOne({
        where: { userName },
      });
      if (existingUser) {
        this.logger.warn(
          `USER CREATE - Attempted to create duplicate user: ${userName}`,
        );
        throw new ConflictException('이미 같은 이름의 아이디가 있습니다.');
      }

      const user = new User();
      user.userName = userName;
      try {
        const salt = await bcrypt.genSalt(
          parseInt(process.env.BCRYPT_SALT_ROUND),
        );
        user.password = await bcrypt.hash(password, salt);
      } catch (error) {
        this.logger.error(
          `USER CREATE - Password hashing failed for user ${userName}`,
          error.stack,
        );
        throw new Error('비밀번호 암호화 중 오류가 발생했습니다.');
      }
      user.registeredDate = new Date();

      await this.usersRepository.save(user);
      return '아이디 생성에 성공했습니다.';
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        `USER CREATE - Failed to create user ${userName}`,
        error?.stack,
      );
      throw new Error('사용자 생성 중 오류가 발생했습니다.');
    }
  }

  async findOneByUserId(userName: string) {
    return this.usersRepository.findOne({ where: { userName } });
  }
}
