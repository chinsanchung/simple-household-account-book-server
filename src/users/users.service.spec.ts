import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomLoggerService } from '../logger/logger.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;
  let logger: CustomLoggerService;
  let jwtService: JwtService;

  beforeEach(async () => {
    // Mock logger
    const mockLogger = {
      setContext: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: CustomLoggerService,
          useValue: mockLogger,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    logger = module.get<CustomLoggerService>(CustomLoggerService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('create', () => {
    const mockCreateUserDto = {
      userId: 'testuser123',
      password: 'Test@1234567',
    };

    it('should create a new user successfully', async () => {
      // Given
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'save').mockResolvedValue(new User());

      // When
      const result = await service.create(mockCreateUserDto);

      // Then
      expect(result).toBe('아이디 생성에 성공했습니다.');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { userId: mockCreateUserDto.userId },
      });
      expect(repository.save).toHaveBeenCalled();
      // Logger should not have been called for successful creation
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      // Given
      const existingUser = new User();
      jest.spyOn(repository, 'findOne').mockResolvedValue(existingUser);

      // When & Then
      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        new ConflictException('이미 같은 이름의 아이디가 있습니다.'),
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { userId: mockCreateUserDto.userId },
      });
      // Verify warning was logged
      expect(logger.warn).toHaveBeenCalledWith(
        `USER CREATE - Attempted to create duplicate user: ${mockCreateUserDto.userId}`,
      );
    });

    it('should handle password hashing error', async () => {
      // Given
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(repository, 'save')
        .mockRejectedValue(new Error('Hashing error'));

      // When & Then
      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        '사용자 생성 중 오류가 발생했습니다.',
      );
      // Verify error was logged
      expect(logger.error).toHaveBeenCalledWith(
        `USER CREATE - Failed to create user ${mockCreateUserDto.userId}`,
        expect.any(String),
      );
    });

    it('should set registration date when creating user', async () => {
      // Given
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'save').mockImplementation(async (user: User) => {
        return user;
      });

      // When
      await service.create(mockCreateUserDto);

      // Then
      const saveCall = jest.spyOn(repository, 'save');
      const savedUser = saveCall.mock.calls[0][0];
      expect(savedUser.registeredDate).toBeInstanceOf(Date);
      // Verify no errors were logged
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const mockLoginDto = {
      userId: 'testuser123',
      password: 'Test@1234567',
    };

    it('should throw UnauthorizedException if userId is empty', async () => {
      // When & Then
      await expect(
        service.login({ ...mockLoginDto, userId: '' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is empty', async () => {
      // When & Then
      await expect(
        service.login({ ...mockLoginDto, password: '' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      // Given
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // When & Then
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        new UnauthorizedException('존재하지 않는 아이디입니다.'),
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { userId: mockLoginDto.userId },
      });
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      // Given
      const mockUser = new User();
      mockUser.password = await bcrypt.hash('differentpassword', 10);
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      // When & Then
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        new UnauthorizedException('비밀번호가 일치하지 않습니다.'),
      );
    });

    it('should return JWT token for valid credentials', async () => {
      // Given
      const mockUser = new User();
      mockUser.password = await bcrypt.hash(mockLoginDto.password, 10);
      const mockToken = 'mock.jwt.token';

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(mockToken);

      // When
      const result = await service.login(mockLoginDto);

      // Then
      expect(result).toBe(mockToken);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockLoginDto.userId,
        time: expect.any(Number),
      });
    });

    it('should handle unexpected errors during login', async () => {
      // Given
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValue(new Error('DB error'));

      // When & Then
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        '로그인 과정에서 오류가 발생했습니다.',
      );
    });
  });
});
