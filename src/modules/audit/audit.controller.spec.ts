import { AuditController } from "./audit.controller";
import { AuditService } from "./audit.service";

describe("AuditController", () => {
  let auditController: AuditController;
  let auditService: jest.Mocked<Pick<AuditService, "findAll" | "findOne">>;

  beforeEach(() => {
    auditService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    auditController = new AuditController(auditService as unknown as AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("calls findAll on AuditService with pagination", async () => {
    const paginated = {
      data: [{ id: "507f1f77bcf86cd799439011", event: "vehicle.created" }],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };

    auditService.findAll.mockResolvedValue(paginated as never);

    const result = await auditController.findAll({ page: 1, limit: 20 } as never);

    expect(auditService.findAll).toHaveBeenCalledWith(1, 20);
    expect(result).toEqual(paginated);
  });

  it("calls findOne on AuditService", async () => {
    const log = { id: "507f1f77bcf86cd799439011", event: "vehicle.created" };

    auditService.findOne.mockResolvedValue(log as never);

    const result = await auditController.findOne(log.id);

    expect(auditService.findOne).toHaveBeenCalledWith(log.id);
    expect(result).toEqual(log);
  });
});
