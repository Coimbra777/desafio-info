import { ConflictException, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { Brand } from "../brands/entities/brand.entity";
import { Vehicle } from "../vehicles/entities/vehicle.entity";
import { Model } from "./entities/model.entity";
import { ModelsService } from "./models.service";

describe("ModelsService", () => {
  let modelsService: ModelsService;
  let modelsRepository: jest.Mocked<Pick<
    Repository<Model>,
    "create" | "findOne" | "save" | "remove"
  >>;
  let vehiclesRepository: jest.Mocked<Pick<Repository<Vehicle>, "count">>;
  let brandsRepository: jest.Mocked<Pick<Repository<Brand>, "findOne">>;

  beforeEach(() => {
    modelsRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    vehiclesRepository = {
      count: jest.fn(),
    };

    brandsRepository = {
      findOne: jest.fn(),
    };

    modelsService = new ModelsService(
      modelsRepository as unknown as Repository<Model>,
      vehiclesRepository as unknown as Repository<Vehicle>,
      brandsRepository as unknown as Repository<Brand>,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns an existing model on findOne", async () => {
    const model = createModel();

    modelsRepository.findOne.mockResolvedValue(model);

    const result = await modelsService.findOne(model.id);

    expect(result).toEqual(model);
    expect(modelsRepository.findOne).toHaveBeenCalledWith({
      where: { id: model.id },
      relations: {
        brand: true,
      },
    });
  });

  it("throws NotFoundException on findOne when model does not exist", async () => {
    modelsRepository.findOne.mockResolvedValue(null);

    await expect(modelsService.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("creates a model with createdBy", async () => {
    const brand = createBrand();
    const createdModel = createModel();

    brandsRepository.findOne.mockResolvedValue(brand);
    modelsRepository.create.mockReturnValue(createdModel);
    modelsRepository.save.mockResolvedValue(createdModel);

    const result = await modelsService.create({ name: "Corolla", brandId: 1 }, 1);

    expect(modelsRepository.create).toHaveBeenCalledWith({
      name: "Corolla",
      brandId: 1,
      brand,
      createdBy: 1,
    });
    expect(modelsRepository.save).toHaveBeenCalledWith(createdModel);
    expect(result).toEqual(createdModel);
  });

  it("updates an existing model", async () => {
    const existingModel = createModel();
    const updatedModel = {
      ...existingModel,
      name: "Civic",
    };

    modelsRepository.findOne.mockResolvedValue(existingModel);
    modelsRepository.save.mockResolvedValue(updatedModel);

    const result = await modelsService.update(existingModel.id, {
      name: "Civic",
    });

    expect(modelsRepository.save).toHaveBeenCalledWith({
      ...existingModel,
      name: "Civic",
    });
    expect(result).toEqual(updatedModel);
  });

  it("removes a model when there are no linked vehicles", async () => {
    const model = createModel();

    modelsRepository.findOne.mockResolvedValue(model);
    vehiclesRepository.count.mockResolvedValue(0);
    modelsRepository.remove.mockResolvedValue(model);

    await modelsService.remove(model.id);

    expect(vehiclesRepository.count).toHaveBeenCalledWith({
      where: { modelId: model.id },
    });
    expect(modelsRepository.remove).toHaveBeenCalledWith(model);
  });

  it("throws ConflictException on remove when there are linked vehicles", async () => {
    const model = createModel();

    modelsRepository.findOne.mockResolvedValue(model);
    vehiclesRepository.count.mockResolvedValue(2);

    await expect(modelsService.remove(model.id)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(modelsRepository.remove).not.toHaveBeenCalled();
  });

  it("throws NotFoundException on remove when model does not exist", async () => {
    modelsRepository.findOne.mockResolvedValue(null);

    await expect(modelsService.remove(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(vehiclesRepository.count).not.toHaveBeenCalled();
    expect(modelsRepository.remove).not.toHaveBeenCalled();
  });
});

function createModel(): Model {
  return {
    id: 1,
    name: "Corolla",
    brandId: 1,
    brand: createBrand(),
    createdBy: 1,
    creator: undefined as never,
    vehicles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createBrand(): Brand {
  return {
    id: 1,
    name: "Toyota",
    createdBy: 1,
    creator: undefined as never,
    models: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
