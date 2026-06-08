import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Brand } from "../brands/entities/brand.entity";
import { Vehicle } from "../vehicles/entities/vehicle.entity";
import { Model } from "./entities/model.entity";
import { ModelsController } from "./models.controller";
import { ModelsService } from "./models.service";

@Module({
  imports: [TypeOrmModule.forFeature([Model, Vehicle, Brand])],
  controllers: [ModelsController],
  providers: [ModelsService],
})
export class ModelsModule {}
