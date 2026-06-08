import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from "typeorm";

export class CreateBrandsTable1718100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "brands",
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
            name: "name",
            type: "nvarchar",
            length: "120",
            isNullable: false,
          },
          {
            name: "created_by",
            type: "int",
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

    await queryRunner.createForeignKey(
      "brands",
      new TableForeignKey({
        name: "FK_brands_created_by_users_id",
        columnNames: ["created_by"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "NO ACTION",
      }),
    );

    await queryRunner.createIndex(
      "brands",
      new TableIndex({
        name: "UQ_brands_name",
        columnNames: ["name"],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex("brands", "UQ_brands_name");
    await queryRunner.dropForeignKey("brands", "FK_brands_created_by_users_id");
    await queryRunner.dropTable("brands");
  }
}
