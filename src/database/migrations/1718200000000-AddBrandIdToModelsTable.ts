import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from "typeorm";

export class AddBrandIdToModelsTable1718200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "models",
      new TableColumn({
        name: "brand_id",
        type: "int",
        isNullable: false,
      }),
    );

    await queryRunner.createForeignKey(
      "models",
      new TableForeignKey({
        name: "FK_models_brand_id_brands_id",
        columnNames: ["brand_id"],
        referencedTableName: "brands",
        referencedColumnNames: ["id"],
        onDelete: "NO ACTION",
      }),
    );

    await queryRunner.createIndex(
      "models",
      new TableIndex({
        name: "IDX_models_brand_id",
        columnNames: ["brand_id"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex("models", "IDX_models_brand_id");
    await queryRunner.dropForeignKey("models", "FK_models_brand_id_brands_id");
    await queryRunner.dropColumn("models", "brand_id");
  }
}
