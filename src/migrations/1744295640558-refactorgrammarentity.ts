import { MigrationInterface, QueryRunner } from "typeorm";

export class Refactorgrammarentity1744295640558 implements MigrationInterface {
    name = 'Refactorgrammarentity1744295640558'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`grammar_middle\` DROP FOREIGN KEY \`FK_001103f0c7742cff4c5605d6e01\``);
        await queryRunner.query(`ALTER TABLE \`grammar_middle\` DROP FOREIGN KEY \`FK_ab90a2fa57e45627c57b491a65a\``);
        await queryRunner.query(`ALTER TABLE \`grammar_books\` DROP FOREIGN KEY \`FK_edabcada86205b5ccc32860407e\``);
        await queryRunner.query(`ALTER TABLE \`grammar_books\` CHANGE \`userUserId\` \`user_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`grammar_middle\` DROP COLUMN \`grammarbookGrammarbookId\``);
        await queryRunner.query(`ALTER TABLE \`grammar_middle\` DROP COLUMN \`grammarGrammarId\``);
        await queryRunner.query(`ALTER TABLE \`grammar_middle\` ADD \`grammar_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`grammar_middle\` ADD \`grammarbook_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`grammar_middle\` ADD CONSTRAINT \`FK_b833d81b4b7a0b5f3638fb72790\` FOREIGN KEY (\`grammar_id\`) REFERENCES \`grammars\`(\`grammar_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`grammar_middle\` ADD CONSTRAINT \`FK_1a6473dae167166fde1fdfc30e1\` FOREIGN KEY (\`grammarbook_id\`) REFERENCES \`grammar_books\`(\`grammarbook_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`grammar_books\` ADD CONSTRAINT \`FK_98716dd7ab7746eed3604c9b4c4\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`user_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`grammar_books\` DROP FOREIGN KEY \`FK_98716dd7ab7746eed3604c9b4c4\``);
        await queryRunner.query(`ALTER TABLE \`grammar_middle\` DROP FOREIGN KEY \`FK_1a6473dae167166fde1fdfc30e1\``);
        await queryRunner.query(`ALTER TABLE \`grammar_middle\` DROP FOREIGN KEY \`FK_b833d81b4b7a0b5f3638fb72790\``);
        await queryRunner.query(`ALTER TABLE \`grammar_middle\` DROP COLUMN \`grammarbook_id\``);
        await queryRunner.query(`ALTER TABLE \`grammar_middle\` DROP COLUMN \`grammar_id\``);
        await queryRunner.query(`ALTER TABLE \`grammar_middle\` ADD \`grammarGrammarId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`grammar_middle\` ADD \`grammarbookGrammarbookId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`grammar_books\` CHANGE \`user_id\` \`userUserId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`grammar_books\` ADD CONSTRAINT \`FK_edabcada86205b5ccc32860407e\` FOREIGN KEY (\`userUserId\`) REFERENCES \`user\`(\`user_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`grammar_middle\` ADD CONSTRAINT \`FK_ab90a2fa57e45627c57b491a65a\` FOREIGN KEY (\`grammarGrammarId\`) REFERENCES \`grammars\`(\`grammar_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`grammar_middle\` ADD CONSTRAINT \`FK_001103f0c7742cff4c5605d6e01\` FOREIGN KEY (\`grammarbookGrammarbookId\`) REFERENCES \`grammar_books\`(\`grammarbook_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
