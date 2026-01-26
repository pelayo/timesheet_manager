import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTimeAssignments1768000000000 implements MigrationInterface {
    name = 'AddTimeAssignments1768000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "time_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "user_id" uuid NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "hours" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_time_assignments_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_time_assignments_project_id" ON "time_assignments" ("project_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_time_assignments_user_id" ON "time_assignments" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "time_assignments" ADD CONSTRAINT "FK_time_assignments_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "time_assignments" ADD CONSTRAINT "FK_time_assignments_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "time_assignments" DROP CONSTRAINT "FK_time_assignments_user"`);
        await queryRunner.query(`ALTER TABLE "time_assignments" DROP CONSTRAINT "FK_time_assignments_project"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_time_assignments_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_time_assignments_project_id"`);
        await queryRunner.query(`DROP TABLE "time_assignments"`);
    }
}
