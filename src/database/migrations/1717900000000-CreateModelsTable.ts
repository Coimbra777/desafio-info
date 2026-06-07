import { MigrationInterface, QueryRunner, Table } from 'typeorm';

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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('models');
  }
}
