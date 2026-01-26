import { Test, TestingModule } from '@nestjs/testing'
import { AdminStandardHoursController } from './admin-standard-hours.controller'
import { StandardHoursService } from './standard-hours.service'

describe('AdminStandardHoursController', () => {
  let controller: AdminStandardHoursController
  const standardHoursService = {
    getByUserId: jest.fn(),
    upsertForUser: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminStandardHoursController],
      providers: [
        {
          provide: StandardHoursService,
          useValue: standardHoursService,
        },
      ],
    }).compile()

    controller = module.get(AdminStandardHoursController)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns null hours when no record exists', async () => {
    standardHoursService.getByUserId.mockResolvedValue(null)

    const result = await controller.getForUser('user-1')

    expect(standardHoursService.getByUserId).toHaveBeenCalledWith('user-1')
    expect(result).toEqual({ userId: 'user-1', hours: null })
  })

  it('returns standard hours when record exists', async () => {
    standardHoursService.getByUserId.mockResolvedValue({ userId: 'user-1', hours: 37.5 })

    const result = await controller.getForUser('user-1')

    expect(result).toEqual({ userId: 'user-1', hours: 37.5 })
  })

  it('updates standard hours', async () => {
    standardHoursService.upsertForUser.mockResolvedValue({ userId: 'user-1', hours: 40 })

    const result = await controller.upsertForUser('user-1', { hours: 40 })

    expect(standardHoursService.upsertForUser).toHaveBeenCalledWith('user-1', 40)
    expect(result).toEqual({ userId: 'user-1', hours: 40 })
  })
})
