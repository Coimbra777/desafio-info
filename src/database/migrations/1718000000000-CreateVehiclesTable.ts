import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateVehiclesTable1718000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'vehicles',
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
            name: 'license_plate',
            type: 'nvarchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'chassis',
            type: 'nvarchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'renavam',
            type: 'nvarchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'year',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'model_id',
            type: 'int',
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
      'vehicles',
      new TableForeignKey({
        name: 'FK_vehicles_model_id_models_id',
        columnNames: ['model_id'],
        referencedTableName: 'models',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
      }),
    );

    await queryRunner.createForeignKey(
      'vehicles',
      new TableForeignKey({
        name: 'FK_vehicles_created_by_users_id',
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
      }),
    );

    await queryRunner.createIndex(
      'vehicles',
      new TableIndex({
        name: 'UQ_vehicles_license_plate',
        columnNames: ['license_plate'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'vehicles',
      new TableIndex({
        name: 'UQ_vehicles_chassis',
        columnNames: ['chassis'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'vehicles',
      new TableIndex({
        name: 'UQ_vehicles_renavam',
        columnNames: ['renavam'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('vehicles', 'FK_vehicles_created_by_users_id');
    await queryRunner.dropForeignKey('vehicles', 'FK_vehicles_model_id_models_id');
    await queryRunner.dropIndex('vehicles', 'UQ_vehicles_renavam');
    await queryRunner.dropIndex('vehicles', 'UQ_vehicles_chassis');
    await queryRunner.dropIndex('vehicles', 'UQ_vehicles_license_plate');
    await queryRunner.dropTable('vehicles');
  }
}
