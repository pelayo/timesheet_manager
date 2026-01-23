import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStandardHours1769900000000 implements MigrationInterface {
    name = 'AddStandardHours1769900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "standard_hours" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "weekly_hours" numeric(5,2) NOT NULL DEFAULT 40, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_28c7b4cbbdb7c6a1760e2340c7b" UNIQUE ("user_id"), CONSTRAINT "PK_7f2d6edc1bce7d58bc8fd765f64" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "standard_hours" ADD CONSTRAINT "FK_28c7b4cbbdb7c6a1760e2340c7b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`INSERT INTO "standard_hours" ("user_id", "weekly_hours") SELECT "id", 40 FROM "users"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "standard_hours" DROP CONSTRAINT "FK_28c7b4cbbdb7c6a1760e2340c7b"`);
        await queryRunner.query(`DROP TABLE "standard_hours"`);
    }

}
