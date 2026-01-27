import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProfilesService } from './profiles.service'
import { Profile } from './entities/profile.entity'
import { NotFoundException } from '@nestjs/common'

const mockProfilesRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
}

const sampleProfile = {
  id: 'profile-1',
  name: 'Analyst',
  discipline: 'Engineering',
  level: 'Senior',
  costPerHour: 120,
  active: true,
}

describe('ProfilesService', () => {
  let service: ProfilesService
  let profilesRepository: Repository<Profile>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        {
          provide: getRepositoryToken(Profile),
          useValue: mockProfilesRepository,
        },
      ],
    }).compile()

    service = module.get(ProfilesService)
    profilesRepository = module.get(getRepositoryToken(Profile))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
    expect(profilesRepository).toBeDefined()
  })

  describe('findAll', () => {
    it('should return profiles ordered by name', async () => {
      const profiles = [sampleProfile]
      mockProfilesRepository.find.mockResolvedValue(profiles)

      const result = await service.findAll()

      expect(mockProfilesRepository.find).toHaveBeenCalledWith({ order: { name: 'ASC' } })
      expect(result).toEqual(profiles)
    })
  })

  describe('findOne', () => {
    it('should return a profile when found', async () => {
      mockProfilesRepository.findOne.mockResolvedValue(sampleProfile)

      const result = await service.findOne('profile-1')

      expect(result).toEqual(sampleProfile)
    })

    it('should throw NotFoundException when missing', async () => {
      mockProfilesRepository.findOne.mockResolvedValue(null)

      await expect(service.findOne('profile-1')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('should create and save a profile', async () => {
      const dto = {
        name: 'Analyst',
        discipline: 'Engineering',
        level: 'Senior',
        costPerHour: 120,
        active: true,
      }
      const profile = { id: 'profile-1', ...dto }
      mockProfilesRepository.create.mockReturnValue(profile)
      mockProfilesRepository.save.mockResolvedValue(profile)

      const result = await service.create(dto)

      expect(mockProfilesRepository.create).toHaveBeenCalledWith(dto)
      expect(mockProfilesRepository.save).toHaveBeenCalledWith(profile)
      expect(result).toEqual(profile)
    })
  })

  describe('update', () => {
    it('should update and save a profile', async () => {
      const profile = { ...sampleProfile }
      const dto = { name: 'Senior Analyst' }
      mockProfilesRepository.findOne.mockResolvedValue(profile)
      mockProfilesRepository.save.mockResolvedValue({ ...profile, ...dto })

      const result = await service.update('profile-1', dto)

      expect(mockProfilesRepository.save).toHaveBeenCalledWith(expect.objectContaining(dto))
      expect(result).toEqual(expect.objectContaining(dto))
    })
  })

  describe('remove', () => {
    it('should remove an existing profile', async () => {
      const profile = { ...sampleProfile }
      mockProfilesRepository.findOne.mockResolvedValue(profile)
      mockProfilesRepository.remove.mockResolvedValue(profile)

      await service.remove('profile-1')

      expect(mockProfilesRepository.remove).toHaveBeenCalledWith(profile)
    })
  })
})
