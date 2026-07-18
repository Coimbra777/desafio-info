import { NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { paginate } from "../../common/pagination/paginate";
import { AuditPublisherService } from "../audit/audit-publisher.service";
import { Brand } from "../brands/entities/brand.entity";
import { Model } from "../models/entities/model.entity";
import { VehiclesCacheService } from "./vehicles-cache.service";
import { Vehicle } from "./entities/vehicle.entity";
import { VehiclesService } from "./vehicles.service";

describe("VehiclesService", () => {
  let vehiclesService: VehiclesService;
  let vehiclesRepository: jest.Mocked<
    Pick<
      Repository<Vehicle>,
      "create" | "findAndCount" | "findOne" | "save" | "remove"
    >
  >;
  let modelsRepository: jest.Mocked<Pick<Repository<Model>, "findOne">>;
  let vehiclesCacheService: jest.Mocked<
    Pick<
      VehiclesCacheService,
      | "getList"
      | "setList"
      | "invalidateList"
      | "getDetail"
      | "setDetail"
      | "invalidateDetail"
    >
  >;
  let auditPublisherService: jest.Mocked<
    Pick<AuditPublisherService, "publishVehicleEvent">
  >;

  beforeEach(() => {
    vehiclesRepository = {
      create: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    modelsRepository = {
      findOne: jest.fn(),
    };

    vehiclesCacheService = {
      getList: jest.fn(),
      setList: jest.fn(),
      invalidateList: jest.fn(),
      getDetail: jest.fn(),
      setDetail: jest.fn(),
      invalidateDetail: jest.fn(),
    };

    auditPublisherService = {
      publishVehicleEvent: jest.fn(),
    };

    vehiclesService = new VehiclesService(
      vehiclesRepository as unknown as Repository<Vehicle>,
      modelsRepository as unknown as Repository<Model>,
      vehiclesCacheService as unknown as VehiclesCacheService,
      auditPublisherService as unknown as AuditPublisherService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns cached paginated list without querying repository", async () => {
    const cachedList = paginate([createVehicle()], 1, 1, 20);

    vehiclesCacheService.getList.mockResolvedValue(cachedList);

    const result = await vehiclesService.findAll(1, 20);

    expect(result).toEqual(cachedList);
    expect(vehiclesCacheService.getList).toHaveBeenCalledWith(1, 20);
    expect(vehiclesRepository.findAndCount).not.toHaveBeenCalled();
    expect(vehiclesCacheService.setList).not.toHaveBeenCalled();
  });

  it("queries repository, caches and returns paginated list when cache is empty", async () => {
    const vehicles = [createVehicle()];

    vehiclesCacheService.getList.mockResolvedValue(null);
    vehiclesRepository.findAndCount.mockResolvedValue([vehicles, 1]);

    const result = await vehiclesService.findAll(1, 20);

    expect(result).toEqual(paginate(vehicles, 1, 1, 20));
    expect(vehiclesRepository.findAndCount).toHaveBeenCalledWith({
      relations: {
        model: true,
      },
      order: {
        createdAt: "ASC",
        id: "ASC",
      },
      skip: 0,
      take: 20,
    });
    expect(vehiclesCacheService.setList).toHaveBeenCalledWith(
      1,
      20,
      paginate(vehicles, 1, 1, 20),
    );
  });

  it("returns cached detail without querying repository", async () => {
    const cachedVehicle = createVehicle();

    vehiclesCacheService.getDetail.mockResolvedValue(cachedVehicle);

    const result = await vehiclesService.findOne(cachedVehicle.id);

    expect(result).toEqual(cachedVehicle);
    expect(vehiclesRepository.findOne).not.toHaveBeenCalled();
    expect(vehiclesCacheService.setDetail).not.toHaveBeenCalled();
  });

  it("queries repository, caches and returns detail when cache is empty", async () => {
    const vehicle = createVehicle();

    vehiclesCacheService.getDetail.mockResolvedValue(null);
    vehiclesRepository.findOne.mockResolvedValue(vehicle);

    const result = await vehiclesService.findOne(vehicle.id);

    expect(result).toEqual(vehicle);
    expect(vehiclesRepository.findOne).toHaveBeenCalledWith({
      where: { id: vehicle.id },
      relations: {
        model: true,
      },
    });
    expect(vehiclesCacheService.setDetail).toHaveBeenCalledWith(vehicle);
  });

  it("throws NotFoundException when detail is not found", async () => {
    vehiclesCacheService.getDetail.mockResolvedValue(null);
    vehiclesRepository.findOne.mockResolvedValue(null);

    await expect(vehiclesService.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("invalidates list cache on create", async () => {
    const model = createModel();
    const createdVehicle = createVehicle();
    const savedVehicle = createVehicle();

    vehiclesRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(savedVehicle);
    modelsRepository.findOne.mockResolvedValue(model);
    vehiclesRepository.create.mockReturnValue(createdVehicle);
    vehiclesRepository.save.mockResolvedValue(savedVehicle);
    vehiclesCacheService.getDetail.mockResolvedValue(null);

    await vehiclesService.create(
      {
        licensePlate: "ABC1234",
        chassis: "9BWZZZ377VT004251",
        renavam: "12345678901",
        year: 2024,
        modelId: model.id,
      },
      1,
    );

    expect(vehiclesCacheService.invalidateList).toHaveBeenCalledTimes(1);
    expect(auditPublisherService.publishVehicleEvent).toHaveBeenCalledWith(
      "vehicle.created",
      savedVehicle.id,
      savedVehicle.createdBy,
      {
        licensePlate: savedVehicle.licensePlate,
        chassis: savedVehicle.chassis,
        renavam: savedVehicle.renavam,
        year: savedVehicle.year,
        modelId: savedVehicle.modelId,
        createdBy: savedVehicle.createdBy,
      },
    );
  });

  it("invalidates list and detail cache on update", async () => {
    const existingVehicle = createVehicle();
    const updatedVehicle = {
      ...createVehicle(),
      id: existingVehicle.id,
      year: 2025,
    };

    vehiclesCacheService.getDetail
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    vehiclesRepository.findOne
      .mockResolvedValueOnce(existingVehicle)
      .mockResolvedValueOnce(updatedVehicle);
    vehiclesRepository.save.mockResolvedValue(updatedVehicle);

    await vehiclesService.update(existingVehicle.id, {
      year: 2025,
    });

    expect(vehiclesCacheService.invalidateList).toHaveBeenCalledTimes(1);
    expect(vehiclesCacheService.invalidateDetail).toHaveBeenCalledWith(
      existingVehicle.id,
    );
    expect(auditPublisherService.publishVehicleEvent).toHaveBeenCalledWith(
      "vehicle.updated",
      updatedVehicle.id,
      updatedVehicle.createdBy,
      {
        licensePlate: updatedVehicle.licensePlate,
        chassis: updatedVehicle.chassis,
        renavam: updatedVehicle.renavam,
        year: updatedVehicle.year,
        modelId: updatedVehicle.modelId,
        createdBy: updatedVehicle.createdBy,
      },
    );
  });

  it("invalidates list and detail cache on remove", async () => {
    const vehicle = createVehicle();

    vehiclesCacheService.getDetail.mockResolvedValue(null);
    vehiclesRepository.findOne.mockResolvedValue(vehicle);
    vehiclesRepository.remove.mockResolvedValue(vehicle);

    await vehiclesService.remove(vehicle.id);

    expect(vehiclesCacheService.invalidateList).toHaveBeenCalledTimes(1);
    expect(vehiclesCacheService.invalidateDetail).toHaveBeenCalledWith(
      vehicle.id,
    );
    expect(auditPublisherService.publishVehicleEvent).toHaveBeenCalledWith(
      "vehicle.deleted",
      vehicle.id,
      vehicle.createdBy,
      {
        licensePlate: vehicle.licensePlate,
        chassis: vehicle.chassis,
        renavam: vehicle.renavam,
        year: vehicle.year,
        modelId: vehicle.modelId,
        createdBy: vehicle.createdBy,
      },
    );
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

function createVehicle(): Vehicle {
  return {
    id: 1,
    licensePlate: "ABC1234",
    chassis: "9BWZZZ377VT004251",
    renavam: "12345678901",
    year: 2024,
    modelId: 1,
    model: createModel(),
    createdBy: 1,
    creator: undefined as never,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
