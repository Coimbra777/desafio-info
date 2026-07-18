import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PaginatedDto } from "../../common/pagination/paginated.dto";
import { paginate } from "../../common/pagination/paginate";
import { Model } from "../models/entities/model.entity";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";
import { Brand } from "./entities/brand.entity";

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandsRepository: Repository<Brand>,
    @InjectRepository(Model)
    private readonly modelsRepository: Repository<Model>,
  ) {}

  async create(createBrandDto: CreateBrandDto, userId: number): Promise<Brand> {
    await this.ensureNameAvailable(createBrandDto.name);

    const brand = this.brandsRepository.create({
      ...createBrandDto,
      createdBy: userId,
    });

    return this.brandsRepository.save(brand);
  }

  async findAll(page: number, limit: number): Promise<PaginatedDto<Brand>> {
    const [brands, total] = await this.brandsRepository.findAndCount({
      order: {
        createdAt: "ASC",
        id: "ASC",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginate(brands, total, page, limit);
  }

  async findOne(id: number): Promise<Brand> {
    const brand = await this.brandsRepository.findOne({
      where: { id },
    });

    if (!brand) {
      throw new NotFoundException("Brand not found");
    }

    return brand;
  }

  async update(id: number, updateBrandDto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.findOne(id);

    if (updateBrandDto.name !== undefined && updateBrandDto.name !== brand.name) {
      await this.ensureNameAvailable(updateBrandDto.name);
      brand.name = updateBrandDto.name;
    }

    return this.brandsRepository.save(brand);
  }

  async remove(id: number): Promise<void> {
    const brand = await this.findOne(id);
    const linkedModelsCount = await this.modelsRepository.count({
      where: { brandId: id },
    });

    if (linkedModelsCount > 0) {
      throw new ConflictException(
        "Cannot delete brand because it has models linked",
      );
    }

    await this.brandsRepository.remove(brand);
  }

  private async ensureNameAvailable(name: string): Promise<void> {
    const existingBrand = await this.brandsRepository.findOne({
      where: { name },
    });

    if (existingBrand) {
      throw new ConflictException("Brand name already exists");
    }
  }
}
