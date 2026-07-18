import { MigrationInterface, QueryRunner, TableIndex } from "typeorm";

/**
 * Índices de suporte à paginação e escala (meta 50k+):
 * - `created_at` em todas as tabelas: cobre o ORDER BY das listagens paginadas.
 * - `vehicles.model_id`: acelera a contagem de integridade (excluir modelo com veículos)
 *   e futuras junções por modelo.
 *
 * `models.brand_id` já possui índice (IDX_models_brand_id) e colunas únicas já são
 * indexadas, então não são recriadas aqui.
 */
export class AddPaginationIndexes1718300000000 implements MigrationInterface {
  private readonly indexes: Array<{ table: string; index: TableIndex }> = [
    {
      table: "users",
      index: new TableIndex({
        name: "IX_users_created_at",
        columnNames: ["created_at"],
      }),
    },
    {
      table: "brands",
      index: new TableIndex({
        name: "IX_brands_created_at",
        columnNames: ["created_at"],
      }),
    },
    {
      table: "models",
      index: new TableIndex({
        name: "IX_models_created_at",
        columnNames: ["created_at"],
      }),
    },
    {
      table: "vehicles",
      index: new TableIndex({
        name: "IX_vehicles_created_at",
        columnNames: ["created_at"],
      }),
    },
    {
      table: "vehicles",
      index: new TableIndex({
        name: "IX_vehicles_model_id",
        columnNames: ["model_id"],
      }),
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const { table, index } of this.indexes) {
      await queryRunner.createIndex(table, index);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const { table, index } of [...this.indexes].reverse()) {
      await queryRunner.dropIndex(table, index.name!);
    }
  }
}
