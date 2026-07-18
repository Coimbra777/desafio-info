import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Collection, Document, MongoClient, ObjectId, WithId } from "mongodb";
import { PaginatedDto } from "../../common/pagination/paginated.dto";
import { paginate } from "../../common/pagination/paginate";
import { AuditEvent, AuditLogResponse } from "./audit-event.type";

@Injectable()
export class AuditService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditService.name);
  private client?: MongoClient;
  private collection?: Collection<Document>;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const mongodbUri = this.configService.get<string>("MONGODB_URI");

    if (!mongodbUri) {
      this.logger.warn(
        "MongoDB is not configured. Audit logs will be skipped.",
      );
      return;
    }

    try {
      this.client = new MongoClient(mongodbUri);
      await this.client.connect();
      this.collection = this.client.db().collection("audit_logs");
    } catch (error) {
      const message =
        error instanceof Error ? (error.stack ?? error.message) : String(error);
      this.logger.error("Failed to connect to MongoDB for audit logs", message);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.close().catch(() => undefined);
    }
  }

  async saveLog(auditLog: AuditEvent): Promise<void> {
    if (!this.collection) {
      this.logger.warn(
        "MongoDB collection is not available. Skipping audit log save.",
      );
      return;
    }

    try {
      await this.collection.insertOne(auditLog);
    } catch (error) {
      const message =
        error instanceof Error ? (error.stack ?? error.message) : String(error);
      this.logger.error("Failed to save audit log in MongoDB", message);
    }
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<PaginatedDto<AuditLogResponse>> {
    if (!this.collection) {
      this.logger.warn(
        "MongoDB collection is not available. Returning empty audit log list.",
      );
      return paginate<AuditLogResponse>([], 0, page, limit);
    }

    const total = await this.collection.countDocuments();
    const auditLogs = await this.collection
      .find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return paginate(
      auditLogs.map((auditLog) => this.mapAuditLog(auditLog)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: string): Promise<AuditLogResponse> {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException("Invalid audit log id");
    }

    if (!this.collection) {
      throw new NotFoundException("Audit log not found");
    }

    const auditLog = await this.collection.findOne({
      _id: new ObjectId(id),
    });

    if (!auditLog) {
      throw new NotFoundException("Audit log not found");
    }

    return this.mapAuditLog(auditLog);
  }

  private mapAuditLog(auditLog: WithId<Document>): AuditLogResponse {
    const event =
      auditLog.event === "vehicle.updated" ||
      auditLog.event === "vehicle.deleted"
        ? auditLog.event
        : "vehicle.created";
    const entityId = typeof auditLog.entityId === "number" ? auditLog.entityId : 0;
    const userId = typeof auditLog.userId === "number" ? auditLog.userId : null;
    const payload =
      auditLog.payload && typeof auditLog.payload === "object"
        ? (auditLog.payload as Record<string, unknown>)
        : {};

    return {
      id: auditLog._id.toString(),
      event,
      entity: "vehicle",
      entityId,
      userId,
      payload,
      createdAt:
        auditLog.createdAt instanceof Date
          ? auditLog.createdAt
          : new Date(String(auditLog.createdAt)),
    };
  }
}
