import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddDatalakeCompositeIndexes1767651860000
  implements MigrationInterface
{
  name = 'AddDatalakeCompositeIndexes1767651860000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_datalake_entry_project_date ON datalake_entry ("projectId", date)`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_datalake_entry_user_date ON datalake_entry ("userId", date)`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_datalake_entry_task_date ON datalake_entry ("taskId", date)`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_datalake_entry_task_date`,
    )
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_datalake_entry_user_date`,
    )
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_datalake_entry_project_date`,
    )
  }
}
