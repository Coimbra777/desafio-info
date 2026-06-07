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
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateModelDto } from "./dto/create-model.dto";
import { UpdateModelDto } from "./dto/update-model.dto";
import { ModelsService } from "./models.service";

@UseGuards(JwtAuthGuard)
@Controller("models")
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Post()
  create(
    @Body() createModelDto: CreateModelDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.modelsService.create(createModelDto, req.user.id);
  }

  @Get()
  findAll() {
    return this.modelsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.modelsService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateModelDto: UpdateModelDto,
  ) {
    return this.modelsService.update(id, updateModelDto);
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    await this.modelsService.remove(id);
  }
}
