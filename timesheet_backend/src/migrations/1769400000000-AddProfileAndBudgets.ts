import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddProfileAndBudgets1769400000000 implements MigrationInterface {
  name = 'AddProfileAndBudgets1769400000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "profile_id" uuid`)
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_users_profile" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "projects" ADD "budget_amount" numeric(12,2) NOT NULL DEFAULT 0`,
    )
    await queryRunner.query(
      `ALTER TABLE "projects" ADD "budget_currency" character varying(3) NOT NULL DEFAULT 'EUR'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "budget_currency"`)
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "budget_amount"`)
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_profile"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profile_id"`)
  }
}
