import { Test, TestingModule } from '@nestjs/testing'
import { AdminProfilesController } from './admin-profiles.controller'
import { ProfilesService } from './profiles.service'

describe('AdminProfilesController', () => {
  let controller: AdminProfilesController

  const sampleProfile = {
    id: 'profile-1',
    name: 'Analyst',
    discipline: 'Engineering',
    level: 'Senior',
    costPerHour: 120,
    active: true,
  }

  const profilesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminProfilesController],
      providers: [
        {
          provide: ProfilesService,
          useValue: profilesService,
        },
      ],
    }).compile()

    controller = module.get(AdminProfilesController)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns all profiles', async () => {
    profilesService.findAll.mockResolvedValue([sampleProfile])

    const result = await controller.findAll()

    expect(profilesService.findAll).toHaveBeenCalled()
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'profile-1' })]))
  })

  it('returns a profile by id', async () => {
    profilesService.findOne.mockResolvedValue(sampleProfile)

    const result = await controller.findOne('profile-1')

    expect(profilesService.findOne).toHaveBeenCalledWith('profile-1')
    expect(result).toEqual(expect.objectContaining({ id: 'profile-1' }))
  })

  it('creates a profile', async () => {
    const dto = {
      name: 'Analyst',
      discipline: 'Engineering',
      level: 'Senior',
      costPerHour: 120,
      active: true,
    }
    profilesService.create.mockResolvedValue({ id: 'profile-1', ...dto })

    const result = await controller.create(dto)

    expect(profilesService.create).toHaveBeenCalledWith(dto)
    expect(result).toEqual(expect.objectContaining({ id: 'profile-1' }))
  })

  it('updates a profile', async () => {
    const dto = { name: 'Senior Analyst' }
    profilesService.update.mockResolvedValue({ id: 'profile-1', ...dto })

    const result = await controller.update('profile-1', dto)

    expect(profilesService.update).toHaveBeenCalledWith('profile-1', dto)
    expect(result).toEqual(expect.objectContaining({ name: 'Senior Analyst' }))
  })

  it('removes a profile', async () => {
    profilesService.remove.mockResolvedValue(undefined)

    await controller.remove('profile-1')

    expect(profilesService.remove).toHaveBeenCalledWith('profile-1')
  })
})
