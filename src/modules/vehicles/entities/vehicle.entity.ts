import { ApiHideProperty } from "@nestjs/swagger";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Model } from "../../models/entities/model.entity";
import { User } from "../../users/entities/user.entity";

@Entity("vehicles")
export class Vehicle {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: "license_plate",
    type: "nvarchar",
    length: 20,
    unique: true,
  })
  licensePlate!: string;

  @Column({
    name: "chassis",
    type: "nvarchar",
    length: 50,
    unique: true,
  })
  chassis!: string;

  @Column({
    name: "renavam",
    type: "nvarchar",
    length: 20,
    unique: true,
  })
  renavam!: string;

  @Column({ name: "year", type: "int" })
  year!: number;

  @Column({ name: "model_id", type: "int" })
  modelId!: number;

  @ManyToOne(() => Model, (model) => model.vehicles, { nullable: false })
  @JoinColumn({ name: "model_id" })
  model!: Model;

  @Column({ name: "created_by", type: "int" })
  createdBy!: number;

  @ApiHideProperty()
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "created_by" })
  creator!: User;

  @CreateDateColumn({
    name: "created_at",
    type: "datetime2",
    default: () => "SYSUTCDATETIME()",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "datetime2",
    default: () => "SYSUTCDATETIME()",
  })
  updatedAt!: Date;
}
