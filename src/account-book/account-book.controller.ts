import {
  Request,
  Controller,
  Post,
  UseGuards,
  Get,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountBookService } from './account-book.service';

@Controller('account-book')
export class AccountBookController {
  constructor(private readonly accountBookService: AccountBookService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/')
  async create(@Request() req) {
    const user = req.user;
    const createDto = req.body;
    return this.accountBookService.create({ createDto, user });
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:idx')
  async getAccountBook(@Param('idx') idx: number) {
    return this.accountBookService.getAccountBook(idx);
  }
}
