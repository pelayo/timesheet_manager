import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1766846781159 implements MigrationInterface {
    name = 'InitialSchema1766846781159'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "role" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "code" character varying, "description" text, "is_archived" boolean NOT NULL DEFAULT false, "is_global" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5ad8d49e45d24ecc733a915716" ON "projects" ("is_global", "is_archived") `);
        await queryRunner.query(`CREATE INDEX "IDX_2187088ab5ef2a918473cb9900" ON "projects" ("name") `);
        await queryRunner.query(`CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "name" character varying NOT NULL, "description" text, "status" text NOT NULL DEFAULT 'OPEN', "closed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cb3724030e9674f2c17b7573aa" ON "tasks" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_9eecdb5b1ed8c7c2a1b392c28d" ON "tasks" ("project_id") `);
        await queryRunner.query(`CREATE TABLE "user_pinned_tasks" ("user_id" uuid NOT NULL, "task_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f2512997e0b31b39465ef8c7255" PRIMARY KEY ("user_id", "task_id"))`);
        await queryRunner.query(`CREATE TABLE "time_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "task_id" uuid NOT NULL, "work_date" date NOT NULL, "minutes" integer NOT NULL, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_da1b914a171d6a87bf96b6bd705" UNIQUE ("user_id", "task_id", "work_date"), CONSTRAINT "PK_b8bc5f10269ba2fe88708904aa0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1ac96e6bfa198bca00f923b45a" ON "time_entries" ("user_id", "work_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_104aa11ede7c8d5afbbe1fdbb2" ON "time_entries" ("task_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7e00172c88b3827166019a2b28" ON "time_entries" ("work_date") `);
        await queryRunner.query(`CREATE TABLE "project_members" ("project_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" text NOT NULL DEFAULT 'MEMBER', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b3f491d3a3f986106d281d8eb4b" PRIMARY KEY ("project_id", "user_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e89aae80e010c2faa72e6a49ce" ON "project_members" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "datalake_entry" ("id" character varying NOT NULL, "userId" uuid NOT NULL, "projectId" uuid NOT NULL, "taskId" uuid, "date" date NOT NULL, "week" character varying NOT NULL, "month" character varying NOT NULL, "year" character varying NOT NULL, "minutes" integer NOT NULL, CONSTRAINT "PK_6db4f6467563f2711f69b837bd6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d341f3f78e76282fa1397fb053" ON "datalake_entry" ("taskId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9d948e19ba84b7d2e7fd4ebb5c" ON "datalake_entry" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ac87495c37256655ae9306e458" ON "datalake_entry" ("projectId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c669bd52e517262b4ba5355860" ON "datalake_entry" ("month") `);
        await queryRunner.query(`CREATE INDEX "IDX_6b3fcd985892f4a257a4adcd21" ON "datalake_entry" ("week") `);
        await queryRunner.query(`CREATE INDEX "IDX_9f3fbcea34df8152702a6cd7c2" ON "datalake_entry" ("date") `);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_9eecdb5b1ed8c7c2a1b392c28d4" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_pinned_tasks" ADD CONSTRAINT "FK_627cfecdc414bb4a49146b98f18" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_pinned_tasks" ADD CONSTRAINT "FK_0a598e08fe35d26cb4a7b5cb528" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "time_entries" ADD CONSTRAINT "FK_f16c3c269283ee42429d09d693d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "time_entries" ADD CONSTRAINT "FK_104aa11ede7c8d5afbbe1fdbb24" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_members" ADD CONSTRAINT "FK_b5729113570c20c7e214cf3f58d" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_members" ADD CONSTRAINT "FK_e89aae80e010c2faa72e6a49ce8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "datalake_entry" ADD CONSTRAINT "FK_9d948e19ba84b7d2e7fd4ebb5cc" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "datalake_entry" ADD CONSTRAINT "FK_ac87495c37256655ae9306e4589" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "datalake_entry" ADD CONSTRAINT "FK_d341f3f78e76282fa1397fb0532" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "datalake_entry" DROP CONSTRAINT "FK_d341f3f78e76282fa1397fb0532"`);
        await queryRunner.query(`ALTER TABLE "datalake_entry" DROP CONSTRAINT "FK_ac87495c37256655ae9306e4589"`);
        await queryRunner.query(`ALTER TABLE "datalake_entry" DROP CONSTRAINT "FK_9d948e19ba84b7d2e7fd4ebb5cc"`);
        await queryRunner.query(`ALTER TABLE "project_members" DROP CONSTRAINT "FK_e89aae80e010c2faa72e6a49ce8"`);
        await queryRunner.query(`ALTER TABLE "project_members" DROP CONSTRAINT "FK_b5729113570c20c7e214cf3f58d"`);
        await queryRunner.query(`ALTER TABLE "time_entries" DROP CONSTRAINT "FK_104aa11ede7c8d5afbbe1fdbb24"`);
        await queryRunner.query(`ALTER TABLE "time_entries" DROP CONSTRAINT "FK_f16c3c269283ee42429d09d693d"`);
        await queryRunner.query(`ALTER TABLE "user_pinned_tasks" DROP CONSTRAINT "FK_0a598e08fe35d26cb4a7b5cb528"`);
        await queryRunner.query(`ALTER TABLE "user_pinned_tasks" DROP CONSTRAINT "FK_627cfecdc414bb4a49146b98f18"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_9eecdb5b1ed8c7c2a1b392c28d4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9f3fbcea34df8152702a6cd7c2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6b3fcd985892f4a257a4adcd21"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c669bd52e517262b4ba5355860"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ac87495c37256655ae9306e458"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9d948e19ba84b7d2e7fd4ebb5c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d341f3f78e76282fa1397fb053"`);
        await queryRunner.query(`DROP TABLE "datalake_entry"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e89aae80e010c2faa72e6a49ce"`);
        await queryRunner.query(`DROP TABLE "project_members"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7e00172c88b3827166019a2b28"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_104aa11ede7c8d5afbbe1fdbb2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1ac96e6bfa198bca00f923b45a"`);
        await queryRunner.query(`DROP TABLE "time_entries"`);
        await queryRunner.query(`DROP TABLE "user_pinned_tasks"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9eecdb5b1ed8c7c2a1b392c28d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cb3724030e9674f2c17b7573aa"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2187088ab5ef2a918473cb9900"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5ad8d49e45d24ecc733a915716"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
