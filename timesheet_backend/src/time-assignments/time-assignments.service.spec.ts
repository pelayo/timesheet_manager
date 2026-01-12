import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { TimeAssignmentsService } from './time-assignments.service'
import { TimeAssignment } from './entities/time-assignment.entity'

const mockTimeAssignmentsRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
}

describe('TimeAssignmentsService', () => {
  let service: TimeAssignmentsService
  let repo: Repository<TimeAssignment>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeAssignmentsService,
        {
          provide: getRepositoryToken(TimeAssignment),
          useValue: mockTimeAssignmentsRepository,
        },
      ],
    }).compile()

    service = module.get<TimeAssignmentsService>(TimeAssignmentsService)
    repo = module.get<Repository<TimeAssignment>>(getRepositoryToken(TimeAssignment))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create and return a time assignment', async () => {
      const dto = {
        userId: 'user-1',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        hours: 40,
      }
      const created = { id: 'assignment-1', projectId: 'project-1', ...dto }

      mockTimeAssignmentsRepository.create.mockReturnValue(created)
      mockTimeAssignmentsRepository.save.mockResolvedValue(created)
      mockTimeAssignmentsRepository.findOne.mockResolvedValue(created)

      const result = await service.create('project-1', dto)

      expect(result).toEqual(created)
      expect(mockTimeAssignmentsRepository.create).toHaveBeenCalledWith({ projectId: 'project-1', ...dto })
      expect(mockTimeAssignmentsRepository.save).toHaveBeenCalledWith(created)
    })

    it('should reject invalid date ranges', async () => {
      await expect(
        service.create('project-1', {
          userId: 'user-1',
          startDate: '2026-02-01',
          endDate: '2026-01-01',
          hours: 40,
        }),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('findAll', () => {
    it('should return assignments for a project', async () => {
      const assignments = [{ id: 'assignment-1' }]
      mockTimeAssignmentsRepository.find.mockResolvedValue(assignments)

      const result = await service.findAll('project-1')

      expect(result).toEqual(assignments)
      expect(mockTimeAssignmentsRepository.find).toHaveBeenCalledWith({
        where: { projectId: 'project-1' },
        relations: ['user'],
        order: { startDate: 'ASC', endDate: 'ASC' },
      })
    })
  })

  describe('update', () => {
    it('should update a time assignment', async () => {
      const existing = {
        id: 'assignment-1',
        projectId: 'project-1',
        userId: 'user-1',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        hours: 40,
      }
      const updated = { ...existing, hours: 32 }

      mockTimeAssignmentsRepository.findOne.mockResolvedValue(existing)
      mockTimeAssignmentsRepository.save.mockResolvedValue(updated)
      mockTimeAssignmentsRepository.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated)

      const result = await service.update(existing.id, { hours: 32 })

      expect(result).toEqual(updated)
      expect(mockTimeAssignmentsRepository.save).toHaveBeenCalledWith(updated)
    })

    it('should reject invalid date ranges', async () => {
      const existing = {
        id: 'assignment-1',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      }
      mockTimeAssignmentsRepository.findOne.mockResolvedValue(existing)

      await expect(
        service.update('assignment-1', { startDate: '2026-02-01', endDate: '2026-01-01' }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw when assignment is missing', async () => {
      mockTimeAssignmentsRepository.findOne.mockResolvedValue(null)

      await expect(service.update('missing', { hours: 12 })).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('should remove assignment', async () => {
      const existing = { id: 'assignment-1' }
      mockTimeAssignmentsRepository.findOne.mockResolvedValue(existing)

      await service.remove('assignment-1')

      expect(mockTimeAssignmentsRepository.remove).toHaveBeenCalledWith(existing)
    })

    it('should throw when assignment is missing', async () => {
      mockTimeAssignmentsRepository.findOne.mockResolvedValue(null)

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException)
    })
  })
})
