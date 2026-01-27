import { TeamworkExcelImportJob } from './teamwork-excel-import.job'

const createLogger = () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
})

describe('TeamworkExcelImportJob', () => {
  it('should return results from runImport and log success', async () => {
    const logger = createLogger()
    const job = new TeamworkExcelImportJob(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      logger as any,
    )

    const runImportSpy = jest
      .spyOn(job as unknown as { runImport: () => Promise<{ message: string }> }, 'runImport')
      .mockResolvedValue({ message: 'ok' })

    const result = await job.process({ id: '1', name: 'teamwork-excel-import', data: {} } as any)

    expect(runImportSpy).toHaveBeenCalled()
    expect(result).toEqual({ message: 'ok' })
    expect(logger.info).toHaveBeenCalledWith('Starting Teamwork Excel Import Job 1')
    expect(logger.info).toHaveBeenCalledWith('Teamwork Excel Import Job 1 completed successfully.')
  })

  it('should log and rethrow errors from runImport', async () => {
    const logger = createLogger()
    const job = new TeamworkExcelImportJob(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      logger as any,
    )

    const error = new Error('boom')
    jest
      .spyOn(job as unknown as { runImport: () => Promise<void> }, 'runImport')
      .mockRejectedValue(error)

    await expect(
      job.process({ id: '99', name: 'teamwork-excel-import', data: {} } as any),
    ).rejects.toThrow('boom')

    expect(logger.error).toHaveBeenCalledWith(
      { err: error },
      'Teamwork Excel Import Job 99 failed',
    )
  })
})
