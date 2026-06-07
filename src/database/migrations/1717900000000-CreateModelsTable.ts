import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateModelsTable1717900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'models',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isNullable: false,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'nvarchar',
            length: '120',
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'datetime2',
            isNullable: false,
            default: 'SYSUTCDATETIME()',
          },
          {
            name: 'updated_at',
            type: 'datetime2',
            isNullable: false,
            default: 'SYSUTCDATETIME()',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'models',
      new TableForeignKey({
        name: 'FK_models_created_by_users_id',
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('models', 'FK_models_created_by_users_id');
    await queryRunner.dropTable('models');
  }
}
