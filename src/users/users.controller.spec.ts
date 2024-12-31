import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UnauthorizedException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    // Mock UsersService
    const mockUsersService = {
      create: jest.fn(),
      login: jest.fn(),
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

  describe('login', () => {
    const mockLoginDto: LoginDto = {
      userId: 'testuser123',
      password: 'Test@1234567',
    };

    it('should return JWT token on successful login', async () => {
      // Given
      const expectedToken = 'mock.jwt.token';
      jest.spyOn(service, 'login').mockResolvedValue(expectedToken);

      // When
      const result = await controller.login(mockLoginDto);

      // Then
      expect(result).toBe(expectedToken);
      expect(service.login).toHaveBeenCalledWith(mockLoginDto);
      expect(service.login).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      // Given
      const errorMessage = '존재하지 않는 아이디입니다.';
      jest
        .spyOn(service, 'login')
        .mockRejectedValue(new UnauthorizedException(errorMessage));

      // When & Then
      await expect(controller.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(service.login).toHaveBeenCalledWith(mockLoginDto);
      expect(service.login).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      // Given
      const errorMessage = '비밀번호가 일치하지 않습니다.';
      jest
        .spyOn(service, 'login')
        .mockRejectedValue(new UnauthorizedException(errorMessage));

      // When & Then
      await expect(controller.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(service.login).toHaveBeenCalledWith(mockLoginDto);
      expect(service.login).toHaveBeenCalledTimes(1);
    });

    it('should handle unexpected errors during login', async () => {
      // Given
      const errorMessage = '로그인 과정에서 오류가 발생했습니다.';
      jest.spyOn(service, 'login').mockRejectedValue(new Error(errorMessage));

      // When & Then
      await expect(controller.login(mockLoginDto)).rejects.toThrow(Error);
      expect(service.login).toHaveBeenCalledWith(mockLoginDto);
      expect(service.login).toHaveBeenCalledTimes(1);
    });

    it('should validate login input data', async () => {
      // Given
      const invalidLoginDto = {
        userId: '', // empty userId
        password: 'Test@1234567',
      };

      jest
        .spyOn(service, 'login')
        .mockRejectedValue(
          new UnauthorizedException('유효하지 않은 입력입니다.'),
        );

      // When & Then
      await expect(controller.login(invalidLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(service.login).toHaveBeenCalledWith(invalidLoginDto);
      expect(service.login).toHaveBeenCalledTimes(1);
    });
  });
});
