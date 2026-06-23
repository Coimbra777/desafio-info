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
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";
import { VehiclesService } from "./vehicles.service";
import { Query } from "@nestjs/common";

@UseGuards(JwtAuthGuard)
@Controller("vehicles")
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  create(
    @Body() createVehicleDto: CreateVehicleDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.vehiclesService.create(createVehicleDto, req.user.id);
  }

  @Get()
  findAll(@Query("page") page = "1", @Query("limit") limit = "20") {
    return this.vehiclesService.findAll(Number(page), Number(limit));
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    await this.vehiclesService.remove(id);
  }
}
