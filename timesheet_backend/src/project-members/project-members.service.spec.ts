import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProjectMembersService } from './project-members.service';
import { ProjectMember } from './entities/project-member.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mockMemberRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
};

describe('ProjectMembersService', () => {
  let service: ProjectMembersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectMembersService,
        {
          provide: getRepositoryToken(ProjectMember),
          useValue: mockMemberRepository,
        },
      ],
    }).compile();

    service = module.get<ProjectMembersService>(ProjectMembersService);
  });

  describe('addMember', () => {
    it('should throw Conflict if already member', async () => {
      mockMemberRepository.findOne.mockResolvedValue({});
      await expect(service.addMember('p1', { userId: 'u1' })).rejects.toThrow(ConflictException);
    });

    it('should add member', async () => {
      mockMemberRepository.findOne.mockResolvedValue(null);
      const member = { projectId: 'p1', userId: 'u1' };
      mockMemberRepository.create.mockReturnValue(member);
      mockMemberRepository.save.mockResolvedValue(member);

      const result = await service.addMember('p1', { userId: 'u1' });
      expect(result).toEqual(member);
    });
  });

  describe('removeMember', () => {
      it('should throw NotFound if not member', async () => {
          mockMemberRepository.findOne.mockResolvedValue(null);
          await expect(service.removeMember('p1', 'u1')).rejects.toThrow(NotFoundException);
      });

      it('should remove member', async () => {
        const member = { projectId: 'p1', userId: 'u1' };
        mockMemberRepository.findOne.mockResolvedValue(member);
        mockMemberRepository.remove.mockResolvedValue(member);

        await service.removeMember('p1', 'u1');
        expect(mockMemberRepository.remove).toHaveBeenCalledWith(member);
      });
  });
});
