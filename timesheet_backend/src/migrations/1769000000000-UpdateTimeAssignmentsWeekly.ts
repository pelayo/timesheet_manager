import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateTimeAssignmentsWeekly1769000000000 implements MigrationInterface {
  name = 'UpdateTimeAssignmentsWeekly1769000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "time_assignments" RENAME TO "time_assignments_old"`)
    await queryRunner.query(
      `ALTER TABLE "time_assignments_old" RENAME CONSTRAINT "PK_time_assignments_id" TO "PK_time_assignments_old_id"`,
    )
    await queryRunner.query(
      `ALTER TABLE "time_assignments_old" RENAME CONSTRAINT "FK_time_assignments_project" TO "FK_time_assignments_old_project"`,
    )
    await queryRunner.query(
      `ALTER TABLE "time_assignments_old" RENAME CONSTRAINT "FK_time_assignments_user" TO "FK_time_assignments_old_user"`,
    )
    await queryRunner.query(
      `ALTER INDEX "IDX_time_assignments_project_id" RENAME TO "IDX_time_assignments_project_id_old"`,
    )
    await queryRunner.query(
      `ALTER INDEX "IDX_time_assignments_user_id" RENAME TO "IDX_time_assignments_user_id_old"`,
    )
    await queryRunner.query(
      `CREATE TABLE "time_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "user_id" uuid NOT NULL, "week_start" date NOT NULL, "hours" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_time_assignments_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_time_assignments_project_id" ON "time_assignments" ("project_id")`)
    await queryRunner.query(`CREATE INDEX "IDX_time_assignments_user_id" ON "time_assignments" ("user_id")`)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_time_assignments_project_user_week" ON "time_assignments" ("project_id", "user_id", "week_start")`,
    )
    await queryRunner.query(
      `ALTER TABLE "time_assignments" ADD CONSTRAINT "FK_time_assignments_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "time_assignments" ADD CONSTRAINT "FK_time_assignments_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )

    const existing = await queryRunner.query(
      `SELECT project_id, user_id, start_date, end_date, hours, created_at, updated_at FROM "time_assignments_old"`,
    )
    const rollups = new Map<
      string,
      {
        projectId: string
        userId: string
        weekStart: string
        hours: number
        createdAt: Date
        updatedAt: Date
      }
    >()

    for (const row of existing) {
      const startDate = new Date(row.start_date)
      const endDate = new Date(row.end_date)
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        continue
      }

      let cursor = this.getWeekStart(startDate)
      const end = this.getUtcDate(endDate)

      while (cursor <= end) {
        const weekStart = this.formatDate(cursor)
        const key = `${row.project_id}:${row.user_id}:${weekStart}`
        const createdAt = row.created_at ? new Date(row.created_at) : new Date()
        const updatedAt = row.updated_at ? new Date(row.updated_at) : new Date()

        const existingEntry = rollups.get(key)
        if (existingEntry) {
          existingEntry.hours += Number(row.hours)
          if (createdAt < existingEntry.createdAt) {
            existingEntry.createdAt = createdAt
          }
          if (updatedAt > existingEntry.updatedAt) {
            existingEntry.updatedAt = updatedAt
          }
        } else {
          rollups.set(key, {
            projectId: row.project_id,
            userId: row.user_id,
            weekStart,
            hours: Number(row.hours),
            createdAt,
            updatedAt,
          })
        }

        cursor = this.addWeeks(cursor, 1)
      }
    }

    for (const entry of rollups.values()) {
      await queryRunner.query(
        `INSERT INTO "time_assignments" ("project_id", "user_id", "week_start", "hours", "created_at", "updated_at") VALUES ($1, $2, $3, $4, $5, $6)`,
        [entry.projectId, entry.userId, entry.weekStart, entry.hours, entry.createdAt, entry.updatedAt],
      )
    }

    await queryRunner.query(`DROP TABLE "time_assignments_old"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "time_assignments" RENAME TO "time_assignments_weekly"`)
    await queryRunner.query(
      `ALTER TABLE "time_assignments_weekly" RENAME CONSTRAINT "PK_time_assignments_id" TO "PK_time_assignments_weekly_id"`,
    )
    await queryRunner.query(
      `ALTER TABLE "time_assignments_weekly" RENAME CONSTRAINT "FK_time_assignments_project" TO "FK_time_assignments_weekly_project"`,
    )
    await queryRunner.query(
      `ALTER TABLE "time_assignments_weekly" RENAME CONSTRAINT "FK_time_assignments_user" TO "FK_time_assignments_weekly_user"`,
    )
    await queryRunner.query(
      `ALTER INDEX "IDX_time_assignments_project_id" RENAME TO "IDX_time_assignments_project_id_weekly"`,
    )
    await queryRunner.query(
      `ALTER INDEX "IDX_time_assignments_user_id" RENAME TO "IDX_time_assignments_user_id_weekly"`,
    )
    await queryRunner.query(
      `ALTER INDEX "IDX_time_assignments_project_user_week" RENAME TO "IDX_time_assignments_project_user_weekly"`,
    )
    await queryRunner.query(
      `CREATE TABLE "time_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "user_id" uuid NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "hours" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_time_assignments_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_time_assignments_project_id" ON "time_assignments" ("project_id")`)
    await queryRunner.query(`CREATE INDEX "IDX_time_assignments_user_id" ON "time_assignments" ("user_id")`)
    await queryRunner.query(
      `ALTER TABLE "time_assignments" ADD CONSTRAINT "FK_time_assignments_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "time_assignments" ADD CONSTRAINT "FK_time_assignments_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )

    const existing = await queryRunner.query(
      `SELECT project_id, user_id, week_start, hours, created_at, updated_at FROM "time_assignments_weekly"`,
    )

    for (const row of existing) {
      const startDate = new Date(row.week_start)
      const endDate = this.addDays(startDate, 6)
      await queryRunner.query(
        `INSERT INTO "time_assignments" ("project_id", "user_id", "start_date", "end_date", "hours", "created_at", "updated_at") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          row.project_id,
          row.user_id,
          this.formatDate(this.getUtcDate(startDate)),
          this.formatDate(this.getUtcDate(endDate)),
          Number(row.hours),
          row.created_at ? new Date(row.created_at) : new Date(),
          row.updated_at ? new Date(row.updated_at) : new Date(),
        ],
      )
    }

    await queryRunner.query(`DROP TABLE "time_assignments_weekly"`)
  }

  private getWeekStart(date: Date): Date {
    const utc = this.getUtcDate(date)
    const day = utc.getUTCDay()
    const diff = (day + 6) % 7
    utc.setUTCDate(utc.getUTCDate() - diff)
    return utc
  }

  private addWeeks(date: Date, weeks: number): Date {
    const next = new Date(date.getTime())
    next.setUTCDate(next.getUTCDate() + weeks * 7)
    return next
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date.getTime())
    next.setUTCDate(next.getUTCDate() + days)
    return next
  }

  private getUtcDate(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  }

  private formatDate(date: Date): string {
    const year = date.getUTCFullYear()
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
    const day = `${date.getUTCDate()}`.padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}
