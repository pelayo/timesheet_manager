import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { ForbiddenException } from '@nestjs/common'
import { ReportingService } from './reporting.service'
import { DatalakeEntry } from '../datalake/entities/datalake-entry.entity'
import { TimeEntry } from '../time-entries/entities/time-entry.entity'
import { StandardHours } from '../user/entities/standard-hours.entity'
import { ProjectMembersService } from '../project-members/project-members.service'
import { LeadTimeGrouping } from './dto/lead-team-hours-filter.dto'
import { Role } from '../user/entities/role.enum'
import type { Repository } from 'typeorm'

const mockTimeEntryRepository = {}
const mockDatalakeRepository = {
  createQueryBuilder: jest.fn(),
}
const mockStandardHoursRepository = {
  find: jest.fn(),
}
const mockProjectMembersService = {
  isProjectLead: jest.fn(),
}
const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
}

describe('ReportingService', () => {
  let service: ReportingService
  let datalakeRepository: Repository<DatalakeEntry>
  let standardHoursRepository: Repository<StandardHours>

  const queryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  }

  beforeEach(async () => {
    mockDatalakeRepository.createQueryBuilder.mockReturnValue(queryBuilder)

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingService,
        {
          provide: getRepositoryToken(TimeEntry),
          useValue: mockTimeEntryRepository,
        },
        {
          provide: getRepositoryToken(DatalakeEntry),
          useValue: mockDatalakeRepository,
        },
        {
          provide: getRepositoryToken(StandardHours),
          useValue: mockStandardHoursRepository,
        },
        {
          provide: ProjectMembersService,
          useValue: mockProjectMembersService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile()

    service = module.get<ReportingService>(ReportingService)
    datalakeRepository = module.get<Repository<DatalakeEntry>>(getRepositoryToken(DatalakeEntry))
    standardHoursRepository = module.get<Repository<StandardHours>>(getRepositoryToken(StandardHours))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('throws when requester is not a lead or admin', async () => {
    mockProjectMembersService.isProjectLead.mockResolvedValue(false)

    await expect(
      service.getLeadTeamHours(
        'project-1',
        { id: 'user-1', role: Role.User } as any,
        { groupBy: LeadTimeGrouping.WEEK },
      ),
    ).rejects.toThrow(ForbiddenException)
  })

  it('returns threshold flags for weekly aggregates', async () => {
    mockProjectMembersService.isProjectLead.mockResolvedValue(true)
    queryBuilder.getRawMany.mockResolvedValue([
      { period: '2026-05', userId: 'user-1', userEmail: 'user@example.com', minutes: '3000' },
    ])
    mockStandardHoursRepository.find.mockResolvedValue([{ userId: 'user-1', hours: 40 }])

    const result = await service.getLeadTeamHours(
      'project-1',
      { id: 'user-1', role: Role.User } as any,
      { groupBy: LeadTimeGrouping.WEEK },
    )

    expect(datalakeRepository.createQueryBuilder).toHaveBeenCalledWith('entry')
    expect(standardHoursRepository.find).toHaveBeenCalled()
    expect(result).toEqual([
      {
        period: '2026-05',
        userId: 'user-1',
        userEmail: 'user@example.com',
        minutes: 3000,
        thresholdMinutes: 2400,
        isOverThreshold: true,
        costTotal: null,
      },
    ])
  })

  it('scales thresholds for monthly aggregates', async () => {
    mockProjectMembersService.isProjectLead.mockResolvedValue(true)
    queryBuilder.getRawMany.mockResolvedValue([
      { period: '2026-02', userId: 'user-2', userEmail: 'lead@example.com', minutes: '9000' },
    ])
    mockStandardHoursRepository.find.mockResolvedValue([{ userId: 'user-2', hours: 40 }])

    const result = await service.getLeadTeamHours(
      'project-1',
      { id: 'user-2', role: Role.ProjectManager } as any,
      { groupBy: LeadTimeGrouping.MONTH },
    )

    expect(result[0].thresholdMinutes).toBe(9600)
    expect(result[0].isOverThreshold).toBe(false)
  })
})
