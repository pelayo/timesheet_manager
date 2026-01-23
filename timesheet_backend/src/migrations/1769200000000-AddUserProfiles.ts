import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserProfiles1769200000000 implements MigrationInterface {
    name = 'AddUserProfiles1769200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "discipline" text NOT NULL, "level" text NOT NULL, "cost_per_hour" numeric(10,2) NOT NULL, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_user_profiles_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD "profile_id" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_users_profile_id" ON "users" ("profile_id") `);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_profile_id" FOREIGN KEY ("profile_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_profile_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_profile_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profile_id"`);
        await queryRunner.query(`DROP TABLE "user_profiles"`);
    }

}
