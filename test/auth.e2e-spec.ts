import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import * as bcrypt from "bcrypt";
import request from "supertest";
import { AuditController } from "../src/modules/audit/audit.controller";
import { AuditService } from "../src/modules/audit/audit.service";
import { AuthController } from "../src/modules/auth/auth.controller";
import { AuthService } from "../src/modules/auth/auth.service";
import { JwtAuthGuard } from "../src/modules/auth/guards/jwt-auth.guard";
import { JwtStrategy } from "../src/modules/auth/strategies/jwt.strategy";
import { Brand } from "../src/modules/brands/entities/brand.entity";
import { Model } from "../src/modules/models/entities/model.entity";
import { ModelsController } from "../src/modules/models/models.controller";
import { ModelsService } from "../src/modules/models/models.service";
import { User } from "../src/modules/users/entities/user.entity";
import { UsersService } from "../src/modules/users/users.service";
import { VehiclesController } from "../src/modules/vehicles/vehicles.controller";
import { Vehicle } from "../src/modules/vehicles/entities/vehicle.entity";
import { VehiclesService } from "../src/modules/vehicles/vehicles.service";

describe("Auth e2e", () => {
  let app: INestApplication;
  let auditServiceMock: {
    findAll: jest.Mock;
    findOne: jest.Mock;
  };
  let modelsServiceMock: Pick<ModelsService, "findAll" | "create">;
  let vehiclesServiceMock: Pick<VehiclesService, "findAll" | "create">;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("ChangeMe123!", 10);
    const user = createUser(passwordHash);

    const usersServiceMock: Pick<UsersService, "findByEmail"> = {
      findByEmail: jest.fn(async (email: string) => {
        return email === user.email ? user : null;
      }),
    };

    modelsServiceMock = {
      findAll: jest.fn(async (page: number, limit: number) =>
        emptyPage(page, limit),
      ),
      create: jest.fn(async (createModelDto, userId: number) =>
        createModel(createModelDto.name, createBrand(), userId),
      ),
    };

    vehiclesServiceMock = {
      findAll: jest.fn(async (page: number, limit: number) =>
        emptyPage(page, limit),
      ),
      create: jest.fn(async (createVehicleDto, userId: number) =>
        createVehicle(createVehicleDto, userId),
      ),
    };

    auditServiceMock = {
      findAll: jest.fn(async (page: number, limit: number) => ({
        data: [createAuditLog()],
        meta: pageMeta(page, limit, 1),
      })),
      findOne: jest.fn(async (id: string) => createAuditLog(id)),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: "test-jwt-secret",
          signOptions: {
            expiresIn: "1h",
          },
        }),
      ],

      controllers: [
        AuthController,
        AuditController,
        ModelsController,
        VehiclesController,
      ],
      providers: [
        AuthService,
        JwtAuthGuard,
        JwtStrategy,
        {
          provide: AuditService,
          useValue: auditServiceMock,
        },
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: ModelsService,
          useValue: modelsServiceMock,
        },
        {
          provide: VehiclesService,
          useValue: vehiclesServiceMock,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              if (key === "JWT_SECRET") {
                return "test-jwt-secret";
              }

              throw new Error(`Unexpected config key: ${key}`);
            },
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /auth/login returns accessToken and tokenType for valid credentials", async () => {
    const response = await createRequest(app).post("/auth/login").send({
      email: "aivacol@example.com",
      password: "ChangeMe123!",
    });

    expect([200, 201]).toContain(response.status);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.tokenType).toBe("Bearer");
  });

  it("GET /models returns 401 without token", async () => {
    await createRequest(app).get("/models").expect(401);
  });

  it("GET /models returns 200 with valid token", async () => {
    const accessToken = await loginAndGetToken(app);

    const response = await createRequest(app)
      .get("/models")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(emptyPage(1, 20));
  });

  it("GET /vehicles returns 401 without token", async () => {
    await createRequest(app).get("/vehicles").expect(401);
  });

  it("GET /vehicles returns 200 with valid token", async () => {
    const accessToken = await loginAndGetToken(app);

    const response = await createRequest(app)
      .get("/vehicles")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(emptyPage(1, 20));
  });

  it("GET /audit returns 401 without token", async () => {
    await createRequest(app).get("/audit").expect(401);
  });

  it("GET /audit returns 200 with valid token", async () => {
    const accessToken = await loginAndGetToken(app);

    const response = await createRequest(app)
      .get("/audit")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [createAuditLog()],
      meta: pageMeta(1, 20, 1),
    });
  });

  it("GET /vehicles?limit above the cap returns 400", async () => {
    const accessToken = await loginAndGetToken(app);

    await createRequest(app)
      .get("/vehicles?limit=1000")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400);
  });

  it("GET /vehicles forwards page and limit to the service", async () => {
    const accessToken = await loginAndGetToken(app);

    const response = await createRequest(app)
      .get("/vehicles?page=3&limit=15")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(emptyPage(3, 15));
    expect(vehiclesServiceMock.findAll).toHaveBeenCalledWith(3, 15);
  });

  it("GET /audit/:id returns 200 with valid token", async () => {
    const accessToken = await loginAndGetToken(app);
    const auditLog = createAuditLog();

    const response = await createRequest(app)
      .get(`/audit/${auditLog.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(auditLog);
  });

  it("POST /models returns success with valid token and uses authenticated user id", async () => {
    const accessToken = await loginAndGetToken(app);

    const response = await createRequest(app)
      .post("/models")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Corolla",
        brandId: 1,
      });

    expect([200, 201]).toContain(response.status);
    expect(response.body).toMatchObject({
      id: 1,
      name: "Corolla",
      brandId: 1,
      createdBy: 1,
    });
    expect(modelsServiceMock.create).toHaveBeenCalledWith(
      { name: "Corolla", brandId: 1 },
      1,
    );
  });

  it("POST /models returns clear required message when brandId is missing", async () => {
    const accessToken = await loginAndGetToken(app);

    const response = await createRequest(app)
      .post("/models")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Corolla",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("brandId is required");
  });

  it("POST /vehicles returns success with valid token and uses authenticated user id", async () => {
    const accessToken = await loginAndGetToken(app);
    const body = {
      licensePlate: "ABC1234",
      chassis: "9BWZZZ377VT004251",
      renavam: "12345678901",
      year: 2024,
      modelId: 1,
    };

    const response = await createRequest(app)
      .post("/vehicles")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(body);

    expect([200, 201]).toContain(response.status);
    expect(response.body).toMatchObject({
      id: 1,
      licensePlate: "ABC1234",
      chassis: "9BWZZZ377VT004251",
      renavam: "12345678901",
      year: 2024,
      modelId: 1,
      createdBy: 1,
    });
    expect(vehiclesServiceMock.create).toHaveBeenCalledWith(body, 1);
  });

  it("POST /vehicles returns clear required message when year is missing", async () => {
    const accessToken = await loginAndGetToken(app);

    const response = await createRequest(app)
      .post("/vehicles")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        licensePlate: "ABC1234",
        chassis: "9BWZZZ377VT004251",
        renavam: "12345678901",
        modelId: 1,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("year is required");
  });

  it("POST /vehicles returns clear required message when modelId is missing", async () => {
    const accessToken = await loginAndGetToken(app);

    const response = await createRequest(app)
      .post("/vehicles")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        licensePlate: "ABC1234",
        chassis: "9BWZZZ377VT004251",
        renavam: "12345678901",
        year: 2024,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("modelId is required");
  });
});

function pageMeta(page: number, limit: number, total: number) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && total > 0,
  };
}

function emptyPage(page: number, limit: number) {
  return {
    data: [],
    meta: pageMeta(page, limit, 0),
  };
}

function createUser(passwordHash: string): User {
  return {
    id: 1,
    nickname: "aivacol",
    name: "Aivacol",
    email: "aivacol@example.com",
    passwordHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createRequest(app: INestApplication) {
  return request(app.getHttpAdapter().getInstance());
}

async function loginAndGetToken(app: INestApplication): Promise<string> {
  const response = await createRequest(app).post("/auth/login").send({
    email: "aivacol@example.com",
    password: "ChangeMe123!",
  });

  return response.body.accessToken;
}

function createModel(name: string, brand: Brand, createdBy: number): Model {
  return {
    id: 1,
    name,
    brandId: brand.id,
    brand,
    createdBy,
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

function createVehicle(
  dto: {
    licensePlate: string;
    chassis: string;
    renavam: string;
    year: number;
    modelId: number;
  },
  createdBy: number,
): Vehicle {
  return {
    id: 1,
    licensePlate: dto.licensePlate,
    chassis: dto.chassis,
    renavam: dto.renavam,
    year: dto.year,
    modelId: dto.modelId,
    model: createModel("Corolla", createBrand(), createdBy),
    createdBy,
    creator: undefined as never,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createAuditLog(id = "507f1f77bcf86cd799439011") {
  return {
    id,
    event: "vehicle.created",
    entity: "vehicle",
    entityId: 1,
    userId: 1,
    payload: {
      licensePlate: "ABC1234",
    },
    createdAt: "2026-06-08T00:30:28.704Z",
  };
}
