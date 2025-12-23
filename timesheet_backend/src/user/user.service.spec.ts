import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { Role } from './entities/role.enum';
import { CurrentUserService } from '../common/current-user.service';
import { ConflictException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

const mockUserRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
};

const mockCurrentUserService = {
  get: jest.fn(),
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: CurrentUserService,
          useValue: mockCurrentUserService,
        },
      ],
    }).compile();

    service = await module.resolve<UserService>(UserService);
  });

  describe('create', () => {
    it('should throw Forbidden if actor is not Admin', async () => {
      mockCurrentUserService.get.mockReturnValue({ role: Role.User });
      await expect(service.createUser({ email: 'e', password: 'p', role: Role.User })).rejects.toThrow(ForbiddenException);
    });

    it('should throw Conflict if email exists', async () => {
      mockCurrentUserService.get.mockReturnValue({ role: Role.Admin });
      mockUserRepository.findOne.mockResolvedValue({ id: 'u1' });
      await expect(service.createUser({ email: 'e', password: 'p', role: Role.User })).rejects.toThrow(ConflictException);
    });

    it('should create user', async () => {
      mockCurrentUserService.get.mockReturnValue({ role: Role.Admin });
      mockUserRepository.findOne.mockResolvedValue(null);
      const dto = { email: 'e', password: 'p', role: Role.User };
      mockUserRepository.create.mockReturnValue(dto);
      mockUserRepository.save.mockResolvedValue(dto);

      const result = await service.createUser(dto);
      expect(result).toEqual(dto);
    });
  });

  describe('delete', () => {
      it('should throw BadRequest if deleting self', async () => {
          mockCurrentUserService.get.mockReturnValue({ id: 'admin-id', role: Role.Admin });
          await expect(service.deleteUser('admin-id')).rejects.toThrow(BadRequestException);
      });

      it('should delete user', async () => {
          mockCurrentUserService.get.mockReturnValue({ id: 'admin-id', role: Role.Admin });
          mockUserRepository.findOne.mockResolvedValue({ id: 'other-id' });
          mockUserRepository.delete.mockResolvedValue({});

          await service.deleteUser('other-id');
          expect(mockUserRepository.delete).toHaveBeenCalledWith('other-id');
      });
  });
});
