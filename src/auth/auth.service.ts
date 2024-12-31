import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByUserId(username);
    if (user) {
      const isCorrectPassword = await bcrypt.compare(password, user.password);
      if (isCorrectPassword) return user;
      else return null;
    }
    return null;
  }

  async login(user: User) {
    const payload = {
      username: user.userId,
      sub: user.userId,
      time: new Date().getTime(),
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
