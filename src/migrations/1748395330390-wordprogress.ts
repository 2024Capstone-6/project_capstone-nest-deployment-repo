import { MigrationInterface, QueryRunner } from "typeorm";

export class Wordprogress1748395330390 implements MigrationInterface {
    name = 'Wordprogress1748395330390'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`word_progress\` (\`word_progress_id\` int NOT NULL AUTO_INCREMENT, \`learning_level\` varchar(10) NOT NULL, \`current_index\` int NOT NULL DEFAULT '0', \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` int NULL, UNIQUE INDEX \`IDX_9d1d418851da1613144cd6dfa9\` (\`user_id\`, \`learning_level\`), PRIMARY KEY (\`word_progress_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`word_progress\` ADD CONSTRAINT \`FK_9e5e83ab5443d8fc32355fe4eca\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`user_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`word_progress\` DROP FOREIGN KEY \`FK_9e5e83ab5443d8fc32355fe4eca\``);
        await queryRunner.query(`DROP INDEX \`IDX_9d1d418851da1613144cd6dfa9\` ON \`word_progress\``);
        await queryRunner.query(`DROP TABLE \`word_progress\``);
    }

}
