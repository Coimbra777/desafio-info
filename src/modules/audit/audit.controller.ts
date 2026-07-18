import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { ApiPaginatedResponse } from "../../common/pagination/api-paginated-response.decorator";
import { PaginationQueryDto } from "../../common/pagination/pagination-query.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuditService } from "./audit.service";
import { AuditLogResponseDto } from "./dto/audit-log-response.dto";

@ApiTags("audit")
@ApiBearerAuth("access-token")
@ApiUnauthorizedResponse({ description: "Token ausente ou inválido" })
@UseGuards(JwtAuthGuard)
@Controller("audit")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: "Lista os logs de auditoria (paginado)" })
  @ApiPaginatedResponse(AuditLogResponseDto)
  findAll(@Query() query: PaginationQueryDto) {
    return this.auditService.findAll(query.page, query.limit);
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalha um log de auditoria pelo ObjectId" })
  @ApiOkResponse({ type: AuditLogResponseDto })
  @ApiBadRequestResponse({ description: "Id de auditoria inválido" })
  @ApiNotFoundResponse({ description: "Log de auditoria não encontrado" })
  findOne(@Param("id") id: string) {
    return this.auditService.findOne(id);
  }
}
