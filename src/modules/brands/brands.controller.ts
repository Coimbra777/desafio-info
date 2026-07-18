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
import { BrandsService } from "./brands.service";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";
import { Brand } from "./entities/brand.entity";

@ApiTags("brands")
@ApiBearerAuth("access-token")
@ApiUnauthorizedResponse({ description: "Token ausente ou inválido" })
@UseGuards(JwtAuthGuard)
@Controller("brands")
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @ApiOperation({ summary: "Cria uma marca (createdBy = usuário autenticado)" })
  @ApiCreatedResponse({ type: Brand })
  @ApiConflictResponse({ description: "Nome de marca já existe" })
  create(
    @Body() createBrandDto: CreateBrandDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.brandsService.create(createBrandDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: "Lista as marcas (paginado)" })
  @ApiPaginatedResponse(Brand)
  findAll(@Query() query: PaginationQueryDto) {
    return this.brandsService.findAll(query.page, query.limit);
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalha uma marca pelo id" })
  @ApiOkResponse({ type: Brand })
  @ApiNotFoundResponse({ description: "Marca não encontrada" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.brandsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualiza uma marca" })
  @ApiOkResponse({ type: Brand })
  @ApiNotFoundResponse({ description: "Marca não encontrada" })
  @ApiConflictResponse({ description: "Nome de marca já existe" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateBrandDto: UpdateBrandDto,
  ) {
    return this.brandsService.update(id, updateBrandDto);
  }

  @Delete(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "Remove uma marca (bloqueado se tiver modelos)" })
  @ApiNoContentResponse({ description: "Marca removida" })
  @ApiNotFoundResponse({ description: "Marca não encontrada" })
  @ApiConflictResponse({
    description: "Não é possível excluir: existem modelos vinculados",
  })
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    await this.brandsService.remove(id);
  }
}
