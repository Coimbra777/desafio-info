import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Vehicle } from "../../vehicles/entities/vehicle.entity";

@Entity("models")
export class Model {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "name", type: "nvarchar", length: 120 })
  name!: string;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.model)
  vehicles!: Vehicle[];

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
