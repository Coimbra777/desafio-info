import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from '../models/entities/model.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehiclesRepository: Repository<Vehicle>,
    @InjectRepository(Model)
    private readonly modelsRepository: Repository<Model>,
  ) {}

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    await this.ensureLicensePlateAvailable(createVehicleDto.licensePlate);
    await this.ensureChassisAvailable(createVehicleDto.chassis);
    await this.ensureRenavamAvailable(createVehicleDto.renavam);
    const model = await this.ensureModelExists(createVehicleDto.modelId);

    const vehicle = this.vehiclesRepository.create({
      ...createVehicleDto,
      model,
    });

    const savedVehicle = await this.vehiclesRepository.save(vehicle);

    return this.findOne(savedVehicle.id);
  }

  findAll(): Promise<Vehicle[]> {
    return this.vehiclesRepository.find({
      relations: {
        model: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async findOne(id: number): Promise<Vehicle> {
    const vehicle = await this.vehiclesRepository.findOne({
      where: { id },
      relations: {
        model: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  async update(
    id: number,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    if (
      updateVehicleDto.licensePlate !== undefined &&
      updateVehicleDto.licensePlate !== vehicle.licensePlate
    ) {
      await this.ensureLicensePlateAvailable(updateVehicleDto.licensePlate);
      vehicle.licensePlate = updateVehicleDto.licensePlate;
    }

    if (
      updateVehicleDto.chassis !== undefined &&
      updateVehicleDto.chassis !== vehicle.chassis
    ) {
      await this.ensureChassisAvailable(updateVehicleDto.chassis);
      vehicle.chassis = updateVehicleDto.chassis;
    }

    if (
      updateVehicleDto.renavam !== undefined &&
      updateVehicleDto.renavam !== vehicle.renavam
    ) {
      await this.ensureRenavamAvailable(updateVehicleDto.renavam);
      vehicle.renavam = updateVehicleDto.renavam;
    }

    if (updateVehicleDto.year !== undefined) {
      vehicle.year = updateVehicleDto.year;
    }

    if (updateVehicleDto.modelId !== undefined) {
      const model = await this.ensureModelExists(updateVehicleDto.modelId);
      vehicle.modelId = updateVehicleDto.modelId;
      vehicle.model = model;
    }

    const savedVehicle = await this.vehiclesRepository.save(vehicle);

    return this.findOne(savedVehicle.id);
  }

  async remove(id: number): Promise<void> {
    const vehicle = await this.findOne(id);

    await this.vehiclesRepository.remove(vehicle);
  }

  private async ensureLicensePlateAvailable(
    licensePlate: string,
  ): Promise<void> {
    const existingVehicle = await this.vehiclesRepository.findOne({
      where: { licensePlate },
    });

    if (existingVehicle) {
      throw new ConflictException('License plate already exists');
    }
  }

  private async ensureChassisAvailable(chassis: string): Promise<void> {
    const existingVehicle = await this.vehiclesRepository.findOne({
      where: { chassis },
    });

    if (existingVehicle) {
      throw new ConflictException('Chassis already exists');
    }
  }

  private async ensureRenavamAvailable(renavam: string): Promise<void> {
    const existingVehicle = await this.vehiclesRepository.findOne({
      where: { renavam },
    });

    if (existingVehicle) {
      throw new ConflictException('Renavam already exists');
    }
  }

  private async ensureModelExists(modelId: number): Promise<Model> {
    const model = await this.modelsRepository.findOne({
      where: { id: modelId },
    });

    if (!model) {
      throw new BadRequestException('Model not found');
    }

    return model;
  }
}
