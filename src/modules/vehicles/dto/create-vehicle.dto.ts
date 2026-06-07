import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  licensePlate!: string;

  @IsString()
  @IsNotEmpty()
  chassis!: string;

  @IsString()
  @IsNotEmpty()
  renavam!: string;

  @Type(() => Number)
  @IsInt()
  year!: number;

  @Type(() => Number)
  @IsNotEmpty()
  @IsInt()
  modelId!: number;
}
