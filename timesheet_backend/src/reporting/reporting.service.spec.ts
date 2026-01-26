import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { ReportingService } from './reporting.service'
import { DatalakeEntry } from '../datalake/entities/datalake-entry.entity'
import { TimeEntry } from '../time-entries/entities/time-entry.entity'
import { EntityGrouping, TimeGrouping } from './dto/stats-filter.dto'

const createQueryBuilder = () => ({
  leftJoin: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getRawMany: jest.fn(),
  getMany: jest.fn(),
  getManyAndCount: jest.fn(),
})

describe('ReportingService', () => {
  let service: ReportingService
  let datalakeQueryBuilder: ReturnType<typeof createQueryBuilder>
  let timeEntryQueryBuilder: ReturnType<typeof createQueryBuilder>
  let cacheManager: { get: jest.Mock; set: jest.Mock }

  beforeEach(async () => {
    datalakeQueryBuilder = createQueryBuilder()
    timeEntryQueryBuilder = createQueryBuilder()
    cacheManager = { get: jest.fn(), set: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingService,
        {
          provide: getRepositoryToken(TimeEntry),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(timeEntryQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(DatalakeEntry),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(datalakeQueryBuilder),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
      ],
    }).compile()

    service = module.get<ReportingService>(ReportingService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should aggregate stats and cache results in production', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    cacheManager.get.mockResolvedValue(null)
    datalakeQueryBuilder.getRawMany.mockResolvedValue([
      { totalMinutes: '90', projectName: 'Alpha', period: '2026-01-01' },
    ])

    const result = await service.getStats({
      groupBy: [EntityGrouping.PROJECT],
      timeGrouping: TimeGrouping.WEEK,
    })

    expect(result[0].totalMinutes).toBe(90)
    expect(datalakeQueryBuilder.groupBy).toHaveBeenCalledWith('project.name, entry.week')
    expect(datalakeQueryBuilder.orderBy).toHaveBeenCalledWith('project.name', 'ASC')
    expect(cacheManager.set).toHaveBeenCalled()

    process.env.NODE_ENV = originalEnv
  })

  it('should group report results by requested field', async () => {
    timeEntryQueryBuilder.getRawMany.mockResolvedValue([
      { group: 'project-1', totalMinutes: '120' },
    ])

    const result = await service.getReport({ groupBy: 'project' })

    expect(timeEntryQueryBuilder.select).toHaveBeenCalledWith('task.projectId', 'group')
    expect(timeEntryQueryBuilder.groupBy).toHaveBeenCalledWith('task.projectId')
    expect(result).toEqual([{ group: 'project-1', totalMinutes: '120' }])
  })

  it('should parse project stats minutes and cache results', async () => {
    cacheManager.get.mockResolvedValue(null)
    timeEntryQueryBuilder.getRawMany.mockResolvedValue([
      { date: '2026-01-01', userEmail: 'user@example.com', minutes: '45' },
    ])

    const result = await service.getProjectStats(
      'project-1',
      '2026-01-01',
      '2026-01-31',
      'week',
    )

    expect(result[0].minutes).toBe(45)
    expect(cacheManager.set).toHaveBeenCalledWith(
      'project-stats:project-1:2026-01-01:2026-01-31:week',
      result,
      900000,
    )
  })

  it('should parse worker stats minutes and cache results', async () => {
    cacheManager.get.mockResolvedValue(null)
    timeEntryQueryBuilder.getRawMany.mockResolvedValue([
      { date: '2026-01-01', projectName: 'Alpha', minutes: '30' },
    ])

    const result = await service.getWorkerStats(
      'user-1',
      '2026-01-01',
      '2026-01-31',
      'day',
    )

    expect(result[0].minutes).toBe(30)
    expect(cacheManager.set).toHaveBeenCalledWith(
      'worker-stats:user-1:2026-01-01:2026-01-31:day',
      result,
      900000,
    )
  })
})
