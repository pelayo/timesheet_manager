import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddStandardHours1769100000000 implements MigrationInterface {
  name = 'AddStandardHours1769100000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "standard_hours" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "hours" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_standard_hours_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_standard_hours_user_id" UNIQUE ("user_id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "standard_hours" ADD CONSTRAINT "FK_standard_hours_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "standard_hours" DROP CONSTRAINT "FK_standard_hours_user_id"`)
    await queryRunner.query(`DROP TABLE "standard_hours"`)
  }
}
