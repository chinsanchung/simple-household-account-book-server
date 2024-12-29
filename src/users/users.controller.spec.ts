import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    // Mock UsersService
    const mockUsersService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      // Given
      const createUserDto: CreateUserDto = {
        userId: 'testuser123',
        password: 'Test@1234567',
      };
      const expectedResult = '아이디 생성에 성공했습니다.';
      jest.spyOn(service, 'create').mockResolvedValue(expectedResult);

      // When
      const result = await controller.create(createUserDto);

      // Then
      expect(result).toBe(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      // Given
      const createUserDto: CreateUserDto = {
        userId: 'testuser123',
        password: 'Test@1234567',
      };
      const errorMessage = '이미 같은 이름의 아이디가 있습니다.';
      jest.spyOn(service, 'create').mockRejectedValue(new Error(errorMessage));

      // When & Then
      await expect(controller.create(createUserDto)).rejects.toThrow(
        errorMessage,
      );
      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });
});
