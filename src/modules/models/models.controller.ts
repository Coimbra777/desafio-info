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
import { CreateModelDto } from "./dto/create-model.dto";
import { UpdateModelDto } from "./dto/update-model.dto";
import { Model } from "./entities/model.entity";
import { ModelsService } from "./models.service";

@ApiTags("models")
@ApiBearerAuth("access-token")
@ApiUnauthorizedResponse({ description: "Token ausente ou inválido" })
@UseGuards(JwtAuthGuard)
@Controller("models")
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Post()
  @ApiOperation({ summary: "Cria um modelo vinculado a uma marca existente" })
  @ApiCreatedResponse({ type: Model })
  @ApiNotFoundResponse({ description: "Marca (brandId) não encontrada" })
  create(
    @Body() createModelDto: CreateModelDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.modelsService.create(createModelDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: "Lista os modelos com a marca (paginado)" })
  @ApiPaginatedResponse(Model)
  findAll(@Query() query: PaginationQueryDto) {
    return this.modelsService.findAll(query.page, query.limit);
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalha um modelo pelo id" })
  @ApiOkResponse({ type: Model })
  @ApiNotFoundResponse({ description: "Modelo não encontrado" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.modelsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualiza um modelo (pode trocar a marca)" })
  @ApiOkResponse({ type: Model })
  @ApiNotFoundResponse({ description: "Modelo ou marca não encontrado" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateModelDto: UpdateModelDto,
  ) {
    return this.modelsService.update(id, updateModelDto);
  }

  @Delete(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "Remove um modelo (bloqueado se tiver veículos)" })
  @ApiNoContentResponse({ description: "Modelo removido" })
  @ApiNotFoundResponse({ description: "Modelo não encontrado" })
  @ApiConflictResponse({
    description: "Não é possível excluir: existem veículos vinculados",
  })
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    await this.modelsService.remove(id);
  }
}
