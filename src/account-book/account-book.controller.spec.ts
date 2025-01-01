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
});
