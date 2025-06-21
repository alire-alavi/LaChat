import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1750528016053 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL PRIMARY KEY,
        "user_name" VARCHAR(16) NOT NULL UNIQUE,
        "password" VARCHAR NOT NULL,
        "created" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

        await queryRunner.query(`
      CREATE TABLE "conversation" (
        "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR
      )
    `);

        await queryRunner.query(`
      CREATE TABLE "participant" (
        "id" SERIAL NOT NULL PRIMARY KEY,
        "isAdmin" BOOLEAN NOT NULL DEFAULT false,
        "userId" INTEGER,
        "conversationId" UUID,
        CONSTRAINT "FK_participant_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_participant_conversation" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

        await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" SERIAL NOT NULL PRIMARY KEY,
        "message" VARCHAR(2000) NOT NULL,
        "date" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "user_id" INTEGER,
        "conversationId" UUID,
        "reply_to" INTEGER,
        CONSTRAINT "FK_message_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_message_conversation" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_message_reply_to" FOREIGN KEY ("reply_to") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TABLE "participant"`);
        await queryRunner.query(`DROP TABLE "conversation"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}
