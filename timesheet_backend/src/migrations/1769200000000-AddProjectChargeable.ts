import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddProjectChargeable1769200000000 implements MigrationInterface {
  name = 'AddProjectChargeable1769200000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "projects" ADD "is_chargeable" boolean NOT NULL DEFAULT true`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "is_chargeable"`)
  }
}
