import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CustomLoggerService } from '../logger/logger.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext(UsersService.name);
  }

  async create({ userId, password }: CreateUserDto) {
    try {
      const existingUser = await this.usersRepository.findOne({
        where: { userId },
      });
      if (existingUser) {
        this.logger.warn(
          `USER CREATE - Attempted to create duplicate user: ${userId}`,
        );
        throw new ConflictException('이미 같은 이름의 아이디가 있습니다.');
      }

      const user = new User();
      user.userId = userId;
      try {
        const salt = await bcrypt.genSalt(
          parseInt(process.env.BCRYPT_SALT_ROUND),
        );
        user.password = await bcrypt.hash(password, salt);
      } catch (error) {
        this.logger.error(
          `USER CREATE - Password hashing failed for user ${userId}`,
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
        `USER CREATE - Failed to create user ${userId}`,
        error?.stack,
      );
      throw new Error('사용자 생성 중 오류가 발생했습니다.');
    }
  }

  async login({ userId, password }: LoginDto) {
    try {
      const user = await this.usersRepository.findOne({
        where: { userId },
      });
      if (!user) {
        throw new UnauthorizedException('존재하지 않는 아이디입니다.');
      }

      const isCorrectPassword = await bcrypt.compare(password, user.password);
      if (isCorrectPassword) {
        return isCorrectPassword;
      } else {
        throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new Error('로그인 과정에서 오류가 발생했습니다.');
    }
  }
}
