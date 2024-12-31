import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/user.entity';
import { JwtService } from '@nestjs/jwt';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  const mockUsersRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUsersRepository)
      .overrideProvider(JwtService)
      .useValue({ signAsync: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  describe('POST /users', () => {
    it('should create a new user successfully', () => {
      // Given
      const newUser = {
        userName: 'testuser123',
        password: 'Test@1234567',
      };
      mockUsersRepository.findOne.mockResolvedValue(null);
      mockUsersRepository.save.mockResolvedValue(newUser);

      // When & Then
      return request(app.getHttpServer())
        .post('/users')
        .send(newUser)
        .expect(201)
        .expect('아이디 생성에 성공했습니다.');
    });

    it('should return 409 when user already exists', () => {
      // Given
      const existingUser = {
        userName: 'testuser123',
        password: 'Test@1234567',
      };
      mockUsersRepository.findOne.mockResolvedValue(existingUser);

      // When & Then
      return request(app.getHttpServer())
        .post('/users')
        .send(existingUser)
        .expect(409)
        .expect({
          statusCode: 409,
          message: '이미 같은 이름의 아이디가 있습니다.',
          error: 'Conflict',
        });
    });

    it('should return 400 when userName is too short', () => {
      // Given
      const invalidUser = {
        userName: 'test', // 7글자 미만
        password: 'Test@1234567',
      };
      mockUsersRepository.findOne.mockResolvedValue(null);

      // When & Then
      return request(app.getHttpServer())
        .post('/users')
        .send(invalidUser)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            '아이디는 최소 7글자, 최대 15글자까지 입력하셔야 합니다.',
          );
        });
    });

    it('should return 400 when password format is invalid', () => {
      // Given
      const invalidUser = {
        userName: 'testuser123',
        password: 'invalidpw', // 특수문자, 대문자 없음, 길이 부족
      };
      mockUsersRepository.findOne.mockResolvedValue(null);

      // When & Then
      return request(app.getHttpServer())
        .post('/users')
        .send(invalidUser)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual([
            '비밀번호는 최소한 대문자 하나, 소문자 하나, 그리고 특수 문자 하나를 포함해서 작성하셔야 합니다.(@$!%?&)',
            '비밀번호는 최소 10글자, 최대 20글자까지 입력하셔야 합니다.',
          ]);
        });
    });
  });
});
