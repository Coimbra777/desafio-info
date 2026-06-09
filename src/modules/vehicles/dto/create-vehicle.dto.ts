import { Transform, Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsString, Max, Min } from "class-validator";

const maxVehicleYear = new Date().getFullYear() + 1;

export class CreateVehicleDto {
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  licensePlate!: string;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  chassis!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  renavam!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(maxVehicleYear)
  year!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  modelId!: number;
}
