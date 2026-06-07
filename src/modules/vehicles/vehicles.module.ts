import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Model } from '../models/entities/model.entity';
import { Vehicle } from './entities/vehicle.entity';
import { VehiclesCacheService } from './vehicles-cache.service';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Vehicle, Model])],
  controllers: [VehiclesController],
  providers: [VehiclesService, VehiclesCacheService],
})
export class VehiclesModule {}
