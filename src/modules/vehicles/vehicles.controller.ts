import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { ApiPaginatedResponse } from "../../common/pagination/api-paginated-response.decorator";
import { PaginationQueryDto } from "../../common/pagination/pagination-query.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";
import { Vehicle } from "./entities/vehicle.entity";
import { VehiclesService } from "./vehicles.service";

@ApiTags("vehicles")
@ApiBearerAuth("access-token")
@ApiUnauthorizedResponse({ description: "Token ausente ou inválido" })
@UseGuards(JwtAuthGuard)
@Controller("vehicles")
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @ApiOperation({
    summary: "Cria um veículo (placa/chassi/renavam únicos, modelo existente)",
  })
  @ApiCreatedResponse({ type: Vehicle })
  @ApiBadRequestResponse({ description: "modelId não encontrado" })
  @ApiConflictResponse({
    description: "Placa, chassi ou renavam já cadastrado",
  })
  create(
    @Body() createVehicleDto: CreateVehicleDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.vehiclesService.create(createVehicleDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: "Lista os veículos, paginado (com cache Redis)" })
  @ApiPaginatedResponse(Vehicle)
  findAll(@Query() query: PaginationQueryDto) {
    return this.vehiclesService.findAll(query.page, query.limit);
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalha um veículo pelo id (com cache Redis)" })
  @ApiOkResponse({ type: Vehicle })
  @ApiNotFoundResponse({ description: "Veículo não encontrado" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualiza um veículo (invalida cache e audita)" })
  @ApiOkResponse({ type: Vehicle })
  @ApiNotFoundResponse({ description: "Veículo não encontrado" })
  @ApiBadRequestResponse({ description: "modelId não encontrado" })
  @ApiConflictResponse({
    description: "Placa, chassi ou renavam já cadastrado",
  })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Delete(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "Remove um veículo (invalida cache e audita)" })
  @ApiNoContentResponse({ description: "Veículo removido" })
  @ApiNotFoundResponse({ description: "Veículo não encontrado" })
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    await this.vehiclesService.remove(id);
  }
}
