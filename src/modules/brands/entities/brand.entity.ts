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
import { Model } from "../../models/entities/model.entity";
import { User } from "../../users/entities/user.entity";

@Entity("brands")
export class Brand {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "name", type: "nvarchar", length: 120, unique: true })
  name!: string;

  @Column({ name: "created_by", type: "int" })
  createdBy!: number;

  @ApiHideProperty()
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "created_by" })
  creator!: User;

  @ApiHideProperty()
  @OneToMany(() => Model, (model) => model.brand)
  models!: Model[];

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
