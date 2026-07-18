import { ApiHideProperty } from "@nestjs/swagger";
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
import { Brand } from "../../brands/entities/brand.entity";
import { User } from "../../users/entities/user.entity";
import { Vehicle } from "../../vehicles/entities/vehicle.entity";

@Entity("models")
export class Model {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "name", type: "nvarchar", length: 120 })
  name!: string;

  @Column({ name: "brand_id", type: "int" })
  brandId!: number;

  @ManyToOne(() => Brand, (brand) => brand.models, { nullable: false })
  @JoinColumn({ name: "brand_id" })
  brand!: Brand;

  @Column({ name: "created_by", type: "int" })
  createdBy!: number;

  @ApiHideProperty()
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "created_by" })
  creator!: User;

  @ApiHideProperty()
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
