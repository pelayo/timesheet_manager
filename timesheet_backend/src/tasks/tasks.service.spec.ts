import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TasksService } from './tasks.service';
import { Task, TaskStatus } from './entities/task.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

import { Project } from '../projects/entities/project.entity';

const mockTaskRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

const mockProjectRepository = {
  findOne: jest.fn(),
};

const mockMemberRepository = {
  findOne: jest.fn(),
};

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
        {
          provide: getRepositoryToken(ProjectMember),
          useValue: mockMemberRepository,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task', async () => {
      const dto = { name: 'Task' };
      const projectId = 'p1';
      const expected = { id: 't1', projectId, ...dto };

      mockTaskRepository.create.mockReturnValue(expected);
      mockTaskRepository.save.mockResolvedValue(expected);

      const result = await service.create(projectId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('close', () => {
    it('should close a task', async () => {
      const task = { id: 't1', status: TaskStatus.OPEN, closedAt: null };
      mockTaskRepository.findOne.mockResolvedValue(task);
      mockTaskRepository.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.close('t1');
      expect(result.status).toBe(TaskStatus.CLOSED);
      expect(result.closedAt).toBeDefined();
    });
  });

  describe('findForUser', () => {
    it('should throw Forbidden if user not member', async () => {
      mockMemberRepository.findOne.mockResolvedValue(null);
      await expect(service.findForUser('u1', 'p1')).rejects.toThrow(ForbiddenException);
    });

    it('should return tasks if member', async () => {
      mockMemberRepository.findOne.mockResolvedValue({ projectId: 'p1', userId: 'u1' });
      mockTaskRepository.find.mockResolvedValue([]);
      
      const result = await service.findForUser('u1', 'p1');
      expect(result).toEqual([]);
    });
  });
});
