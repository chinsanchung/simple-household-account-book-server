import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomLoggerService } from '../logger/logger.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;
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
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    logger = module.get<CustomLoggerService>(CustomLoggerService);
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
});
