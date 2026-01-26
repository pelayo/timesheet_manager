import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { NotFoundException } from '@nestjs/common'
import { StandardHoursService } from './standard-hours.service'
import { StandardHours } from './entities/standard-hours.entity'
import { User } from './entities/user.entity'

const mockStandardHoursRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
}

const mockUserRepository = {
  exist: jest.fn(),
}

describe('StandardHoursService', () => {
  let service: StandardHoursService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StandardHoursService,
        {
          provide: getRepositoryToken(StandardHours),
          useValue: mockStandardHoursRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile()

    service = await module.resolve<StandardHoursService>(StandardHoursService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getByUserId', () => {
    it('returns standard hours when found', async () => {
      const record = { userId: 'user-1', hours: 37.5 } as StandardHours
      mockStandardHoursRepository.findOne?.mockResolvedValue(record)

      await expect(service.getByUserId('user-1')).resolves.toEqual(record)
      expect(mockStandardHoursRepository.findOne).toHaveBeenCalledWith({ where: { userId: 'user-1' } })
    })

    it('returns null when no record exists', async () => {
      mockStandardHoursRepository.findOne?.mockResolvedValue(null)

      await expect(service.getByUserId('missing')).resolves.toBeNull()
      expect(mockStandardHoursRepository.findOne).toHaveBeenCalledWith({ where: { userId: 'missing' } })
    })
  })

  describe('upsertForUser', () => {
    it('throws when user does not exist', async () => {
      mockUserRepository.exist?.mockResolvedValue(false)

      await expect(service.upsertForUser('missing', 40)).rejects.toThrow(NotFoundException)
      expect(mockUserRepository.exist).toHaveBeenCalledWith({ where: { id: 'missing' } })
    })

    it('updates existing standard hours', async () => {
      const existing = { id: 'std-1', userId: 'user-1', hours: 35 } as StandardHours
      mockUserRepository.exist?.mockResolvedValue(true)
      mockStandardHoursRepository.findOne?.mockResolvedValue(existing)
      mockStandardHoursRepository.save?.mockImplementation(async (value) => value)

      const result = await service.upsertForUser('user-1', 40)

      expect(mockStandardHoursRepository.findOne).toHaveBeenCalledWith({ where: { userId: 'user-1' } })
      expect(mockStandardHoursRepository.save).toHaveBeenCalledWith({ ...existing, hours: 40 })
      expect(result.hours).toBe(40)
    })

    it('creates standard hours when missing', async () => {
      const created = { userId: 'user-1', hours: 30 } as StandardHours
      mockUserRepository.exist?.mockResolvedValue(true)
      mockStandardHoursRepository.findOne?.mockResolvedValue(null)
      mockStandardHoursRepository.create?.mockReturnValue(created)
      mockStandardHoursRepository.save?.mockResolvedValue(created)

      const result = await service.upsertForUser('user-1', 30)

      expect(mockStandardHoursRepository.create).toHaveBeenCalledWith({ userId: 'user-1', hours: 30 })
      expect(mockStandardHoursRepository.save).toHaveBeenCalledWith(created)
      expect(result).toEqual(created)
    })
  })
})
