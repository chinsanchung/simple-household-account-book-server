import { Test, TestingModule } from '@nestjs/testing';
import { AccountBookController } from './account-book.controller';
import { AccountBookService } from './account-book.service';
import { CreateAccountBookDto } from './dto/create-account-book.dto';
import { AccountBook } from './account-book.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('AccountBookController', () => {
  let controller: AccountBookController;
  let service: AccountBookService;

  beforeEach(async () => {
    // Mock AccountBookService
    const mockAccountBookService = {
      create: jest.fn(),
      getAccountBook: jest.fn(),
      search: jest.fn(),
    };

    // Mock JwtAuthGuard
    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountBookController],
      providers: [
        {
          provide: AccountBookService,
          useValue: mockAccountBookService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<AccountBookController>(AccountBookController);
    service = module.get<AccountBookService>(AccountBookService);
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

    const mockRequest = {
      user: mockUser,
      body: mockCreateDto,
    };

    it('should create a new account book entry', async () => {
      // Given
      const expectedResult = new AccountBook();
      Object.assign(expectedResult, {
        ...mockCreateDto,
        userId: mockUser.id,
      });

      jest.spyOn(service, 'create').mockResolvedValue(expectedResult);

      // When
      const result = await controller.create(mockRequest);

      // Then
      expect(result).toBe(expectedResult);
      expect(service.create).toHaveBeenCalledWith({
        createDto: mockCreateDto,
        user: mockUser,
      });
    });

    it('should pass user information from request to service', async () => {
      // Given
      const customUser = {
        id: 2,
        userName: 'customuser',
      };
      const customRequest = {
        user: customUser,
        body: mockCreateDto,
      };

      // When
      await controller.create(customRequest);

      // Then
      expect(service.create).toHaveBeenCalledWith({
        createDto: mockCreateDto,
        user: customUser,
      });
    });

    it('should handle service errors', async () => {
      // Given
      jest
        .spyOn(service, 'create')
        .mockRejectedValue(new Error('Service error'));

      // When & Then
      await expect(controller.create(mockRequest)).rejects.toThrow(
        'Service error',
      );
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
      user: { id: 1, userName: 'testuser' },
      category: {
        name: 'Food',
      },
      paymentMethod: {
        name: 'Cash',
      },
    } as AccountBook;

    it('should return account book details successfully', async () => {
      // Given
      jest.spyOn(service, 'getAccountBook').mockResolvedValue(mockAccountBook);

      // When
      const result = await controller.getAccountBook(mockIdx);

      // Then
      expect(result).toBe(mockAccountBook);
      expect(service.getAccountBook).toHaveBeenCalledWith(mockIdx);
    });

    it('should return null when account book is not found', async () => {
      // Given
      jest.spyOn(service, 'getAccountBook').mockResolvedValue(null);

      // When
      const result = await controller.getAccountBook(mockIdx);

      // Then
      expect(result).toBeNull();
      expect(service.getAccountBook).toHaveBeenCalledWith(mockIdx);
    });

    it('should handle service errors', async () => {
      // Given
      jest
        .spyOn(service, 'getAccountBook')
        .mockRejectedValue(new Error('조회 과정에서 에러가 발생했습니다.'));

      // When & Then
      await expect(controller.getAccountBook(mockIdx)).rejects.toThrow(
        '조회 과정에서 에러가 발생했습니다.',
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
        updatedAt: new Date(),
        categoryId: 1,
        paymentMethodId: 1,
        userId: 1,
        user: { id: 1, userName: 'testuser' },
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
        updatedAt: new Date(),
        categoryId: 2,
        paymentMethodId: 2,
        userId: 1,
        user: { id: 1, userName: 'testuser' },
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
      const query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      jest.spyOn(service, 'search').mockResolvedValue(mockAccountBooks);

      // When
      const result = await controller.search(query);

      // Then
      expect(result).toBe(mockAccountBooks);
      expect(service.search).toHaveBeenCalledWith(query);
    });

    it('should return all account books when no filter provided', async () => {
      // Given
      const query = {};
      jest.spyOn(service, 'search').mockResolvedValue(mockAccountBooks);

      // When
      const result = await controller.search(query);

      // Then
      expect(result).toBe(mockAccountBooks);
      expect(service.search).toHaveBeenCalledWith(query);
    });

    it('should handle service errors', async () => {
      // Given
      const query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      jest
        .spyOn(service, 'search')
        .mockRejectedValue(new Error('검색 과정에서 에러가 발생했습니다.'));

      // When & Then
      await expect(controller.search(query)).rejects.toThrow(
        '검색 과정에서 에러가 발생했습니다.',
      );
    });
  });
});
