import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPerformanceIndexes1767650820000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1767650820000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_projects_name_trgm ON projects USING gin (name gin_trgm_ops)`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_tasks_project_id_created_at ON tasks (project_id, created_at DESC)`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_time_entries_task_id_work_date ON time_entries (task_id, work_date)`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_time_entries_task_id_work_date`,
    )
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_tasks_project_id_created_at`,
    )
    await queryRunner.query(`DROP INDEX IF EXISTS idx_projects_name_trgm`)
  }
}
