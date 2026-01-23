import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjectBudgets1769500000000 implements MigrationInterface {
    name = 'AddProjectBudgets1769500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" ADD "budget_amount" numeric(12,2) NOT NULL DEFAULT 0`)
        await queryRunner.query(`ALTER TABLE "projects" ADD "currency" character varying(3) NOT NULL DEFAULT 'USD'`)
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "CHK_projects_budget_amount_non_negative" CHECK ("budget_amount" >= 0)`)
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "CHK_projects_currency_format" CHECK ("currency" ~ '^[A-Z]{3}$')`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "CHK_projects_currency_format"`)
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "CHK_projects_budget_amount_non_negative"`)
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "currency"`)
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "budget_amount"`)
    }
}
