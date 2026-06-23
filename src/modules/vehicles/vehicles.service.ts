import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditPublisherService } from "../audit/audit-publisher.service";
import { Model } from "../models/entities/model.entity";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";
import { VehiclesCacheService } from "./vehicles-cache.service";
import { Vehicle } from "./entities/vehicle.entity";

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehiclesRepository: Repository<Vehicle>,
    @InjectRepository(Model)
    private readonly modelsRepository: Repository<Model>,
    private readonly vehiclesCacheService: VehiclesCacheService,
    private readonly auditPublisherService: AuditPublisherService,
  ) {}

  async create(
    createVehicleDto: CreateVehicleDto,
    userId: number,
  ): Promise<Vehicle> {
    await this.ensureLicensePlateAvailable(createVehicleDto.licensePlate);
    await this.ensureChassisAvailable(createVehicleDto.chassis);
    await this.ensureRenavamAvailable(createVehicleDto.renavam);
    const model = await this.ensureModelExists(createVehicleDto.modelId);

    const vehicle = this.vehiclesRepository.create({
      ...createVehicleDto,
      createdBy: userId,
      model,
    });

    const savedVehicle = await this.vehiclesRepository.save(vehicle);
    await this.vehiclesCacheService.invalidateList();
    await this.auditPublisherService.publishVehicleEvent(
      "vehicle.created",
      savedVehicle.id,
      savedVehicle.createdBy,
      this.buildAuditPayload(savedVehicle),
    );

    return this.findOne(savedVehicle.id);
  }

  async findAll(page = 1, limit = 20) {
    const cachedVehicles = await this.vehiclesCacheService.getList(page, limit);

    if (cachedVehicles) {
      return cachedVehicles;
    }

    const [data, total] = await this.vehiclesRepository.findAndCount({
      relations: {
        model: true,
      },
      order: {
        createdAt: "ASC",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const result = {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.vehiclesCacheService.setList(page, limit, result);

    return result;
  }

  async findOne(id: number): Promise<Vehicle> {
    const cachedVehicle = await this.vehiclesCacheService.getDetail(id);

    if (cachedVehicle) {
      return cachedVehicle;
    }

    const vehicle = await this.vehiclesRepository.findOne({
      where: { id },
      relations: {
        model: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException("Vehicle not found");
    }

    await this.vehiclesCacheService.setDetail(vehicle);

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
    await this.vehiclesCacheService.invalidateList();
    await this.vehiclesCacheService.invalidateDetail(id);
    await this.auditPublisherService.publishVehicleEvent(
      "vehicle.updated",
      savedVehicle.id,
      savedVehicle.createdBy,
      this.buildAuditPayload(savedVehicle),
    );

    return this.findOne(savedVehicle.id);
  }

  async remove(id: number): Promise<void> {
    const vehicle = await this.findOne(id);

    await this.vehiclesRepository.remove(vehicle);
    await this.vehiclesCacheService.invalidateList();
    await this.vehiclesCacheService.invalidateDetail(id);
    await this.auditPublisherService.publishVehicleEvent(
      "vehicle.deleted",
      vehicle.id,
      vehicle.createdBy,
      this.buildAuditPayload(vehicle),
    );
  }

  private async ensureLicensePlateAvailable(
    licensePlate: string,
  ): Promise<void> {
    const existingVehicle = await this.vehiclesRepository.findOne({
      where: { licensePlate },
    });

    if (existingVehicle) {
      throw new ConflictException("License plate already exists");
    }
  }

  private async ensureChassisAvailable(chassis: string): Promise<void> {
    const existingVehicle = await this.vehiclesRepository.findOne({
      where: { chassis },
    });

    if (existingVehicle) {
      throw new ConflictException("Chassis already exists");
    }
  }

  private async ensureRenavamAvailable(renavam: string): Promise<void> {
    const existingVehicle = await this.vehiclesRepository.findOne({
      where: { renavam },
    });

    if (existingVehicle) {
      throw new ConflictException("Renavam already exists");
    }
  }

  private async ensureModelExists(modelId: number): Promise<Model> {
    const model = await this.modelsRepository.findOne({
      where: { id: modelId },
    });

    if (!model) {
      throw new BadRequestException("Model not found");
    }

    return model;
  }

  private buildAuditPayload(vehicle: Vehicle): Record<string, unknown> {
    return {
      licensePlate: vehicle.licensePlate,
      chassis: vehicle.chassis,
      renavam: vehicle.renavam,
      year: vehicle.year,
      modelId: vehicle.modelId,
      createdBy: vehicle.createdBy,
    };
  }
}
