import { MigrationInterface, QueryRunner } from "typeorm";

export class Wordentityrefactor1745197842370 implements MigrationInterface {
    name = 'Wordentityrefactor1745197842370'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`words\` DROP COLUMN \`word_quiz\``);
        await queryRunner.query(`ALTER TABLE \`words\` ADD \`word_quiz\` json NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`words\` DROP COLUMN \`word_quiz\``);
        await queryRunner.query(`ALTER TABLE \`words\` ADD \`word_quiz\` text NULL`);
    }

}
