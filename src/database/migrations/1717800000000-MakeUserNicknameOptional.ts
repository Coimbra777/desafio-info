import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeUserNicknameOptional1717800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users', 'UQ_users_nickname');
    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN nickname NVARCHAR(50) NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX UQ_users_nickname
      ON users (nickname)
      WHERE nickname IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users', 'UQ_users_nickname');
    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN nickname NVARCHAR(50) NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX UQ_users_nickname
      ON users (nickname)
    `);
  }
}
