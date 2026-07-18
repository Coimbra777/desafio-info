import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AuditController } from "../src/modules/audit/audit.controller";
import { AuditService } from "../src/modules/audit/audit.service";
import { AuthController } from "../src/modules/auth/auth.controller";
import { AuthService } from "../src/modules/auth/auth.service";
import { BrandsController } from "../src/modules/brands/brands.controller";
import { BrandsService } from "../src/modules/brands/brands.service";
import { ModelsController } from "../src/modules/models/models.controller";
import { ModelsService } from "../src/modules/models/models.service";
import { UsersController } from "../src/modules/users/users.controller";
import { UsersService } from "../src/modules/users/users.service";
import { VehiclesController } from "../src/modules/vehicles/vehicles.controller";
import { VehiclesService } from "../src/modules/vehicles/vehicles.service";
import { setupSwagger } from "../src/swagger";

// Sobe uma app mínima com todos os controllers (serviços mockados) apenas para
// validar a geração do contrato OpenAPI, sem depender de banco/cache/mensageria.
async function createApp(swaggerEnabled: boolean): Promise<INestApplication> {
  const previous = process.env.SWAGGER_ENABLED;
  process.env.SWAGGER_ENABLED = swaggerEnabled ? "true" : "false";

  const moduleRef = await Test.createTestingModule({
    controllers: [
      AuthController,
      UsersController,
      BrandsController,
      ModelsController,
      VehiclesController,
      AuditController,
    ],
    providers: [
      { provide: AuthService, useValue: {} },
      { provide: UsersService, useValue: {} },
      { provide: BrandsService, useValue: {} },
      { provide: ModelsService, useValue: {} },
      { provide: VehiclesService, useValue: {} },
      { provide: AuditService, useValue: {} },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  setupSwagger(app);
  await app.init();

  if (previous === undefined) {
    delete process.env.SWAGGER_ENABLED;
  } else {
    process.env.SWAGGER_ENABLED = previous;
  }

  return app;
}

function http(app: INestApplication) {
  return request(app.getHttpAdapter().getInstance());
}

describe("Swagger e2e", () => {
  it("GET /api/swagger-json returns an OpenAPI doc with every resource path", async () => {
    const app = await createApp(true);

    try {
      const response = await http(app).get("/api/swagger-json");

      expect(response.status).toBe(200);
      expect(response.body.openapi).toMatch(/^3\./);

      const paths = Object.keys(response.body.paths);
      expect(paths).toEqual(
        expect.arrayContaining([
          "/auth/login",
          "/users",
          "/brands",
          "/models",
          "/vehicles",
          "/audit",
        ]),
      );
    } finally {
      await app.close();
    }
  });

  it("does not leak passwordHash into any generated schema", async () => {
    const app = await createApp(true);

    try {
      const response = await http(app).get("/api/swagger-json");
      const raw = JSON.stringify(response.body);

      expect(raw).not.toContain("passwordHash");
      expect(raw).not.toContain("password_hash");
    } finally {
      await app.close();
    }
  });

  it("GET /api/swagger returns 404 when SWAGGER_ENABLED=false", async () => {
    const app = await createApp(false);

    try {
      await http(app).get("/api/swagger").expect(404);
    } finally {
      await app.close();
    }
  });
});
