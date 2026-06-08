import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Brand } from "../brands/entities/brand.entity";
import { Vehicle } from "../vehicles/entities/vehicle.entity";
import { CreateModelDto } from "./dto/create-model.dto";
import { UpdateModelDto } from "./dto/update-model.dto";
import { Model } from "./entities/model.entity";

@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(Model)
    private readonly modelsRepository: Repository<Model>,
    @InjectRepository(Vehicle)
    private readonly vehiclesRepository: Repository<Vehicle>,
    @InjectRepository(Brand)
    private readonly brandsRepository: Repository<Brand>,
  ) {}

  async create(createModelDto: CreateModelDto, userId: number): Promise<Model> {
    const brand = await this.ensureBrandExists(createModelDto.brandId);

    const model = this.modelsRepository.create({
      ...createModelDto,
      brand,
      createdBy: userId,
    });

    return this.modelsRepository.save(model);
  }

  findAll(): Promise<Model[]> {
    return this.modelsRepository.find({
      relations: {
        brand: true,
      },
      order: {
        createdAt: "ASC",
      },
    });
  }

  async findOne(id: number): Promise<Model> {
    const model = await this.modelsRepository.findOne({
      where: { id },
      relations: {
        brand: true,
      },
    });

    if (!model) {
      throw new NotFoundException("Model not found");
    }

    return model;
  }

  async update(id: number, updateModelDto: UpdateModelDto): Promise<Model> {
    const model = await this.findOne(id);

    if (updateModelDto.name !== undefined) {
      model.name = updateModelDto.name;
    }

    if (updateModelDto.brandId !== undefined) {
      const brand = await this.ensureBrandExists(updateModelDto.brandId);
      model.brandId = updateModelDto.brandId;
      model.brand = brand;
    }

    return this.modelsRepository.save(model);
  }

  async remove(id: number): Promise<void> {
    const model = await this.findOne(id);
    const linkedVehiclesCount = await this.vehiclesRepository.count({
      where: { modelId: id },
    });

    if (linkedVehiclesCount > 0) {
      throw new ConflictException(
        "Cannot delete model because it has vehicles linked",
      );
    }

    await this.modelsRepository.remove(model);
  }

  private async ensureBrandExists(brandId: number): Promise<Brand> {
    const brand = await this.brandsRepository.findOne({
      where: { id: brandId },
    });

    if (!brand) {
      throw new NotFoundException("Brand not found");
    }

    return brand;
  }
}
