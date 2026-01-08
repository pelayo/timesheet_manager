import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTeamworkIds1768192000000 implements MigrationInterface {
    name = 'AddTeamworkIds1768192000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" ADD "teamwork_id" text`)
        await queryRunner.query(`ALTER TABLE "tasks" ADD "teamwork_id" text`)
        await queryRunner.query(`ALTER TABLE "time_entries" ADD "teamwork_id" text`)
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_projects_teamwork_id" ON "projects" ("teamwork_id")`)
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_tasks_teamwork_id" ON "tasks" ("teamwork_id")`)
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_time_entries_teamwork_id" ON "time_entries" ("teamwork_id")`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_time_entries_teamwork_id"`)
        await queryRunner.query(`DROP INDEX "public"."IDX_tasks_teamwork_id"`)
        await queryRunner.query(`DROP INDEX "public"."IDX_projects_teamwork_id"`)
        await queryRunner.query(`ALTER TABLE "time_entries" DROP COLUMN "teamwork_id"`)
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "teamwork_id"`)
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "teamwork_id"`)
    }
}
