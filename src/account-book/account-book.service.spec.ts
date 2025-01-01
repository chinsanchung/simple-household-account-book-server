import { Test, TestingModule } from '@nestjs/testing';
import { AccountBookService } from './account-book.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountBook } from './account-book.entity';
import { CustomLoggerService } from '../logger/logger.service';
import { CreateAccountBookDto } from './dto/create-account-book.dto';
import { validate } from 'class-validator';
import { Between } from 'typeorm';

describe('AccountBookService', () => {
  let service: AccountBookService;
  let repository: Repository<AccountBook>;
  let logger: CustomLoggerService;

  beforeEach(async () => {
    // Mock logger
    const mockLogger = {
      setContext: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountBookService,
        {
          provide: getRepositoryToken(AccountBook),
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: CustomLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<AccountBookService>(AccountBookService);
    repository = module.get<Repository<AccountBook>>(
      getRepositoryToken(AccountBook),
    );
    logger = module.get<CustomLoggerService>(CustomLoggerService);
  });

  describe('create', () => {
    const mockUser = {
      id: 1,
      userName: 'testuser',
    };

    const mockCreateDto: CreateAccountBookDto = {
      title: 'Test Account Book',
      paymentAmount: 10000,
      paymentType: 'expense',
      categoryId: 1,
      paymentMethodId: 1,
      userId: 1,
    };

    it('should create an account book entry successfully', async () => {
      // Given
      const expectedAccountBook = new AccountBook();
      Object.assign(expectedAccountBook, {
        ...mockCreateDto,
        userId: mockUser.id,
      });

      jest.spyOn(repository, 'save').mockResolvedValue(expectedAccountBook);

      // When
      const result = await service.create({
        createDto: mockCreateDto,
        user: mockUser,
      });

      // Then
      expect(result).toEqual(expectedAccountBook);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: mockCreateDto.title,
          paymentAmount: mockCreateDto.paymentAmount,
          paymentType: mockCreateDto.paymentType,
          categoryId: mockCreateDto.categoryId,
          paymentMethodId: mockCreateDto.paymentMethodId,
          userId: mockUser.id,
        }),
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should handle errors during creation', async () => {
      // Given
      jest
        .spyOn(repository, 'save')
        .mockRejectedValue(new Error('Database error'));

      // When & Then
      await expect(
        service.create({
          createDto: mockCreateDto,
          user: mockUser,
        }),
      ).rejects.toThrow('에러가 발생했습니다.');

      expect(logger.error).toHaveBeenCalledWith(
        'account-book CREATE',
        expect.any(String),
      );
    });

    it('should validate payment type is either income or expense', async () => {
      // Given
      const dto = new CreateAccountBookDto();
      Object.assign(dto, {
        ...mockCreateDto,
        paymentType: 'invalid-type',
      });

      // When & Then
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate title length is between 10 and 100 characters', async () => {
      // Given
      const dto = new CreateAccountBookDto();
      Object.assign(dto, {
        ...mockCreateDto,
        title: 'short', // less than 10 characters
      });

      // When & Then
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should require payment amount to be a decimal number', async () => {
      // Given
      const dto = new CreateAccountBookDto();
      Object.assign(dto, {
        ...mockCreateDto,
        paymentAmount: 'not-a-number',
      });

      // When & Then
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('getAccountBook', () => {
    const mockIdx = 1;
    const mockAccountBook = {
      idx: mockIdx,
      title: 'Test Account Book',
      paymentType: 'expense',
      paymentAmount: 10000,
      createdAt: new Date(),
      updatedAt: new Date(),
      categoryId: 1,
      paymentMethodId: 1,
      userId: 1,
      category: {
        name: 'Food',
      },
      paymentMethod: {
        name: 'Cash',
      },
    } as AccountBook;

    it('should return account book details successfully', async () => {
      // Given
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockAccountBook);

      // When
      const result = await service.getAccountBook(mockIdx);

      // Then
      expect(result).toEqual(mockAccountBook);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { idx: mockIdx },
        select: {
          idx: true,
          title: true,
          paymentType: true,
          paymentAmount: true,
          createdAt: true,
          category: {
            name: true,
          },
          paymentMethod: {
            name: true,
          },
        },
        relations: {
          category: true,
          paymentMethod: true,
        },
      });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should return null when account book is not found', async () => {
      // Given
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // When
      const result = await service.getAccountBook(mockIdx);

      // Then
      expect(result).toBeNull();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Given
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValue(new Error('Database error'));

      // When & Then
      await expect(service.getAccountBook(mockIdx)).rejects.toThrow(
        '조회 과정에서 에러가 발생했습니다.',
      );
      expect(logger.error).toHaveBeenCalledWith(
        'account-book GET idx',
        expect.any(String),
      );
    });
  });

  describe('search', () => {
    const mockAccountBooks = [
      {
        idx: 1,
        title: 'Test Account Book 1',
        paymentType: 'expense',
        paymentAmount: 10000,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        categoryId: 1,
        paymentMethodId: 1,
        userId: 1,
        category: {
          name: 'Food',
        },
        paymentMethod: {
          name: 'Cash',
        },
      },
      {
        idx: 2,
        title: 'Test Account Book 2',
        paymentType: 'income',
        paymentAmount: 20000,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        categoryId: 2,
        paymentMethodId: 2,
        userId: 1,
        category: {
          name: 'Salary',
        },
        paymentMethod: {
          name: 'Bank',
        },
      },
    ] as AccountBook[];

    it('should return account books with date filter', async () => {
      // Given
      const searchFilter = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      jest.spyOn(repository, 'find').mockResolvedValue(mockAccountBooks);

      // When
      const result = await service.search(searchFilter);

      // Then
      expect(result).toEqual(mockAccountBooks);
      expect(repository.find).toHaveBeenCalledWith({
        where: {
          createdAt: Between(searchFilter.startDate, searchFilter.endDate),
        },
        select: {
          idx: true,
          title: true,
          paymentType: true,
          paymentAmount: true,
          createdAt: true,
          category: {
            name: true,
          },
          paymentMethod: {
            name: true,
          },
        },
        relations: {
          category: true,
          paymentMethod: true,
        },
      });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should return all account books when no date filter provided', async () => {
      // Given
      const searchFilter = {};
      jest.spyOn(repository, 'find').mockResolvedValue(mockAccountBooks);

      // When
      const result = await service.search(searchFilter);

      // Then
      expect(result).toEqual(mockAccountBooks);
      expect(repository.find).toHaveBeenCalledWith({
        where: {},
        select: expect.any(Object),
        relations: expect.any(Object),
      });
    });

    it('should handle database errors', async () => {
      // Given
      const searchFilter = {};
      jest
        .spyOn(repository, 'find')
        .mockRejectedValue(new Error('Database error'));

      // When & Then
      await expect(service.search(searchFilter)).rejects.toThrow(
        '검색 과정에서 에러가 발생했습니다.',
      );
      expect(logger.error).toHaveBeenCalledWith(
        'account-book GET search',
        expect.any(String),
      );
    });
  });
});
