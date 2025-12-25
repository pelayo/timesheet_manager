import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TimeEntriesService } from './time-entries.service';
import { TimeEntry } from './entities/time-entry.entity';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { Project } from '../projects/entities/project.entity';
import { UserPinnedTask } from './entities/user-pinned-task.entity';

const mockTimeEntryRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockPinnedTaskRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

const mockTaskRepo = {
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockProjectRepo = {
  findOne: jest.fn(),
};

const mockMemberRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
};

describe('TimeEntriesService', () => {
  let service: TimeEntriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeEntriesService,
        { provide: getRepositoryToken(TimeEntry), useValue: mockTimeEntryRepo },
        { provide: getRepositoryToken(UserPinnedTask), useValue: mockPinnedTaskRepo },
        { provide: getRepositoryToken(Task), useValue: mockTaskRepo },
        { provide: getRepositoryToken(Project), useValue: mockProjectRepo },
        { provide: getRepositoryToken(ProjectMember), useValue: mockMemberRepo },
      ],
    }).compile();

    service = module.get<TimeEntriesService>(TimeEntriesService);
  });

  describe('create', () => {
    it('should throw if task not found', async () => {
      mockTaskRepo.findOne.mockResolvedValue(null);
      await expect(service.create('u1', { taskId: 't1', workDate: '2023-01-01', minutes: 60 })).rejects.toThrow(NotFoundException);
    });

    it('should throw if task closed', async () => {
      mockTaskRepo.findOne.mockResolvedValue({ id: 't1', status: TaskStatus.CLOSED });
      await expect(service.create('u1', { taskId: 't1', workDate: '2023-01-01', minutes: 60 })).rejects.toThrow(BadRequestException);
    });

    it('should throw if not member', async () => {
      mockTaskRepo.findOne.mockResolvedValue({ id: 't1', status: TaskStatus.OPEN, projectId: 'p1' });
      mockMemberRepo.findOne.mockResolvedValue(null);
      await expect(service.create('u1', { taskId: 't1', workDate: '2023-01-01', minutes: 60 })).rejects.toThrow(ForbiddenException);
    });

    it('should throw if entry exists', async () => {
       mockTaskRepo.findOne.mockResolvedValue({ id: 't1', status: TaskStatus.OPEN, projectId: 'p1' });
       mockMemberRepo.findOne.mockResolvedValue({});
       mockTimeEntryRepo.findOne.mockResolvedValue({});
       await expect(service.create('u1', { taskId: 't1', workDate: '2023-01-01', minutes: 60 })).rejects.toThrow(BadRequestException);
    });

    it('should create entry', async () => {
       const dto = { taskId: 't1', workDate: '2023-01-01', minutes: 60 };
       mockTaskRepo.findOne.mockResolvedValue({ id: 't1', status: TaskStatus.OPEN, projectId: 'p1' });
       mockMemberRepo.findOne.mockResolvedValue({});
       mockTimeEntryRepo.findOne.mockResolvedValue(null);
       mockTimeEntryRepo.create.mockReturnValue(dto);
       mockTimeEntryRepo.save.mockResolvedValue(dto);

       const result = await service.create('u1', dto);
       expect(result).toEqual(dto);
    });
  });

  describe('updateTimesheetCell', () => {
      it('should delete entry if minutes is 0', async () => {
          const dto = { taskId: 't1', workDate: '2023-01-01', minutes: 0 };
          mockTimeEntryRepo.findOne.mockResolvedValue({ id: 'e1' });
          mockTaskRepo.findOne.mockResolvedValue({ id: 't1', status: TaskStatus.OPEN });
          
          await service.updateTimesheetCell('u1', dto);
          expect(mockTimeEntryRepo.remove).toHaveBeenCalled();
      });

      it('should create entry if not exists and minutes > 0', async () => {
        const dto = { taskId: 't1', workDate: '2023-01-01', minutes: 60 };
        mockTimeEntryRepo.findOne.mockResolvedValue(null);
        mockTaskRepo.findOne.mockResolvedValue({ id: 't1', status: TaskStatus.OPEN, projectId: 'p1' });
        // Mock validation calls inside create
        mockMemberRepo.findOne.mockResolvedValue({});
        mockTimeEntryRepo.create.mockReturnValue({});
        mockTimeEntryRepo.save.mockResolvedValue({});

        await service.updateTimesheetCell('u1', dto);
        expect(mockTimeEntryRepo.save).toHaveBeenCalled();
      });
  });
});
