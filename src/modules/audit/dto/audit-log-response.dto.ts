import { ApiProperty } from "@nestjs/swagger";
import { AuditEventName } from "../audit-event.type";

export class AuditLogResponseDto {
  @ApiProperty({ example: "665f1c2a9b1e4a0012a3b4c5" })
  id!: string;

  @ApiProperty({
    example: "vehicle.created",
    enum: ["vehicle.created", "vehicle.updated", "vehicle.deleted"],
  })
  event!: AuditEventName;

  @ApiProperty({ example: "vehicle", enum: ["vehicle"] })
  entity!: "vehicle";

  @ApiProperty({ example: 123, description: "Id do veículo afetado" })
  entityId!: number;

  @ApiProperty({
    example: 1,
    nullable: true,
    description: "Id do usuário associado ao veículo (createdBy)",
  })
  userId!: number | null;

  @ApiProperty({
    description: "Snapshot do veículo no momento do evento",
    example: {
      licensePlate: "ABC1234",
      chassis: "9BWZZZ377VT004251",
      renavam: "12345678901",
      year: 2024,
      modelId: 1,
      createdBy: 1,
    },
  })
  payload!: Record<string, unknown>;

  @ApiProperty({ example: "2026-07-18T12:00:00.000Z" })
  createdAt!: Date;
}
