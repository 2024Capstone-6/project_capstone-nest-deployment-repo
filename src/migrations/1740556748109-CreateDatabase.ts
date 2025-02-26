import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDatabase1740556748109 implements MigrationInterface {
    name = 'CreateDatabase1740556748109'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE DATABASE IF NOT EXISTS capstone-db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP DATABASE capstone-db`);
    }

}
