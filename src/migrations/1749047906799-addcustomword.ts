import { MigrationInterface, QueryRunner } from "typeorm";

export class Addcustomword1749047906799 implements MigrationInterface {
    name = 'Addcustomword1749047906799'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`word_progress\` ADD \`custom_word_ids\` json NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`word_progress\` DROP COLUMN \`custom_word_ids\``);
    }

}
