import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateModelDto } from "./dto/create-model.dto";
import { UpdateModelDto } from "./dto/update-model.dto";
import { Model } from "./entities/model.entity";

@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(Model)
    private readonly modelsRepository: Repository<Model>,
  ) {}

  async create(createModelDto: CreateModelDto): Promise<Model> {
    const model = this.modelsRepository.create(createModelDto);

    return this.modelsRepository.save(model);
  }

  findAll(): Promise<Model[]> {
    return this.modelsRepository.find({
      order: {
        createdAt: "ASC",
      },
    });
  }

  async findOne(id: number): Promise<Model> {
    const model = await this.modelsRepository.findOne({
      where: { id },
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

    return this.modelsRepository.save(model);
  }

  async remove(id: number): Promise<void> {
    const model = await this.findOne(id);

    await this.modelsRepository.remove(model);
  }
}
