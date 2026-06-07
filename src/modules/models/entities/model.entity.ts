import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Vehicle } from "../../vehicles/entities/vehicle.entity";

@Entity("models")
export class Model {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "name", type: "nvarchar", length: 120 })
  name!: string;

  @Column({ name: "created_by", type: "int" })
  createdBy!: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "created_by" })
  creator!: User;

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
