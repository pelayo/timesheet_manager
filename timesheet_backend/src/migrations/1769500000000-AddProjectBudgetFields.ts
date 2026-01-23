import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectBudgetFields1769500000000 implements MigrationInterface {
  name = 'AddProjectBudgetFields1769500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "projects" ADD "budget_amount" numeric(12,2)`);
    await queryRunner.query(`ALTER TABLE "projects" ADD "currency" text`);
    await queryRunner.query(`UPDATE "projects" SET "budget_amount" = 0 WHERE "budget_amount" IS NULL`);
    await queryRunner.query(`UPDATE "projects" SET "currency" = 'USD' WHERE "currency" IS NULL OR "currency" = ''`);
    await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "budget_amount" SET DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "budget_amount" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "currency" SET DEFAULT 'USD'`);
    await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "currency" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "currency"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "budget_amount"`);
  }
}
