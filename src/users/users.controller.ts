import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { LoginDto } from './dto/login.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<string> {
    return this.usersService.create(createUserDto);
  }

  @Post('/login')
  login(@Body() userData: LoginDto): Promise<any> {
    return this.usersService.login(userData);
  }
}
