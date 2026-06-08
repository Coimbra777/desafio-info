import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Model } from "../models/entities/model.entity";
import { Brand } from "./entities/brand.entity";
import { BrandsController } from "./brands.controller";
import { BrandsService } from "./brands.service";

@Module({
  imports: [TypeOrmModule.forFeature([Brand, Model])],
  controllers: [BrandsController],
  providers: [BrandsService],
})
export class BrandsModule {}
