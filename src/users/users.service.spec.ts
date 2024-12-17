import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
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
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
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
    });

    it('should hash the password before saving', async () => {
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
      expect(savedUser.password).not.toBe(mockCreateUserDto.password);
      expect(savedUser.password).toMatch(
        /^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/,
      ); // bcrypt hash pattern
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
    });
  });
});
