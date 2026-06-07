import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ name: 'id' })
  id!: number;

  @Column({ name: 'nickname', type: 'nvarchar', length: 50, nullable: true })
  nickname!: string | null;

  @Column({ name: 'name', type: 'nvarchar', length: 120 })
  name!: string;

  @Column({ name: 'email', type: 'nvarchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'nvarchar', length: 255 })
  passwordHash!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime2',
    default: () => 'SYSUTCDATETIME()',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime2',
    default: () => 'SYSUTCDATETIME()',
  })
  updatedAt!: Date;
}
