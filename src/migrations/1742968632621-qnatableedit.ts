import { MigrationInterface, QueryRunner } from "typeorm";

export class Qnatableedit1742968632621 implements MigrationInterface {
    name = 'Qnatableedit1742968632621'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`chatbot_qna\` DROP COLUMN \`chatbot_question\``);
        await queryRunner.query(`ALTER TABLE \`chatbot_qna\` ADD \`jp_question\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`chatbot_qna\` ADD \`kr_question\` varchar(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`chatbot_qna\` DROP COLUMN \`kr_question\``);
        await queryRunner.query(`ALTER TABLE \`chatbot_qna\` DROP COLUMN \`jp_question\``);
        await queryRunner.query(`ALTER TABLE \`chatbot_qna\` ADD \`chatbot_question\` varchar(255) NOT NULL`);
    }

}
