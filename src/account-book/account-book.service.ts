import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountBook } from './account-book.entity';
import { CustomLoggerService } from '../logger/logger.service';
import { CreateAccountBookDto } from './dto/create-account-book.dto';

@Injectable()
export class AccountBookService {
  constructor(
    @InjectRepository(AccountBook)
    private accountBookRepository: Repository<AccountBook>,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext(AccountBookService.name);
  }

  async create({
    createDto,
    user,
  }: {
    createDto: CreateAccountBookDto;
    user: { id: number; userName: string };
  }) {
    try {
      const accountBook = new AccountBook();
      accountBook.title = createDto.title;
      accountBook.paymentType = createDto.paymentType;
      accountBook.paymentAmount = createDto.paymentAmount;
      accountBook.categoryId = createDto.categoryId;
      accountBook.paymentMethodId = createDto.paymentMethodId;
      accountBook.userId = user.id;

      await this.accountBookRepository.save(accountBook);

      return accountBook;
    } catch (error) {
      this.logger.error('account-book CREATE', error.stack);
      throw new Error('에러가 발생했습니다.');
    }
  }
}
