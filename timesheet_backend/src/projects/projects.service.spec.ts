import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import { NotFoundException } from '@nestjs/common';

const mockProjectRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

const mockMemberRepository = {
  find: jest.fn(),
};

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectRepo: Repository<Project>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
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

    service = module.get<ProjectsService>(ProjectsService);
    projectRepo = module.get<Repository<Project>>(getRepositoryToken(Project));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a project', async () => {
      const dto = { name: 'Test Project' };
      const expectedProject = { id: 'uuid', ...dto };

      mockProjectRepository.create.mockReturnValue(expectedProject);
      mockProjectRepository.save.mockResolvedValue(expectedProject);

      const result = await service.create(dto);
      expect(result).toEqual(expectedProject);
      expect(mockProjectRepository.create).toHaveBeenCalledWith(dto);
      expect(mockProjectRepository.save).toHaveBeenCalledWith(expectedProject);
    });
  });

  describe('findAll', () => {
    it('should return an array of projects', async () => {
      const projects = [{ id: 'uuid', name: 'Test' }];
      mockProjectRepository.find.mockResolvedValue(projects);

      const result = await service.findAll();
      expect(result).toEqual(projects);
    });
  });

  describe('findOne', () => {
    it('should return a project if found', async () => {
      const project = { id: 'uuid', name: 'Test' };
      mockProjectRepository.findOne.mockResolvedValue(project);

      const result = await service.findOne('uuid');
      expect(result).toEqual(project);
    });

    it('should throw NotFoundException if not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and save a project', async () => {
        const project = { id: 'uuid', name: 'Old' };
        const dto = { name: 'New' };
        const updated = { ...project, ...dto };
  
        mockProjectRepository.findOne.mockResolvedValue(project);
        mockProjectRepository.save.mockResolvedValue(updated);
  
        const result = await service.update('uuid', dto);
        expect(result).toEqual(updated);
        expect(mockProjectRepository.save).toHaveBeenCalledWith(updated);
    });
  });

  describe('findForUser', () => {
      it('should return projects for a user', async () => {
          const userId = 'user-uuid';
          const project = { id: 'p1', name: 'P1' };
          const members = [{ projectId: 'p1', userId, project }];
          
          mockProjectRepository.find.mockResolvedValue([]); // No global projects
          mockMemberRepository.find.mockResolvedValue(members);
          
          const result = await service.findForUser(userId);
          expect(result).toEqual([project]);
      });
  });
});
