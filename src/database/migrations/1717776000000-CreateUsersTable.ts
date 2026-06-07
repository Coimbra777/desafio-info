import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateUsersTable1717776000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "users",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isNullable: false,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "nickname",
            type: "nvarchar",
            length: "50",
            isNullable: false,
          },
          {
            name: "name",
            type: "nvarchar",
            length: "120",
            isNullable: false,
          },
          {
            name: "email",
            type: "nvarchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "password_hash",
            type: "nvarchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "created_at",
            type: "datetime2",
            isNullable: false,
            default: "SYSUTCDATETIME()",
          },
          {
            name: "updated_at",
            type: "datetime2",
            isNullable: false,
            default: "SYSUTCDATETIME()",
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      "users",
      new TableIndex({
        name: "UQ_users_nickname",
        columnNames: ["nickname"],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      "users",
      new TableIndex({
        name: "UQ_users_email",
        columnNames: ["email"],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex("users", "UQ_users_email");
    await queryRunner.dropIndex("users", "UQ_users_nickname");
    await queryRunner.dropTable("users");
  }
}
