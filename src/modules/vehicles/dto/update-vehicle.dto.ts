import { Transform, Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from "class-validator";

const maxVehicleYear = new Date().getFullYear() + 1;

export class UpdateVehicleDto {
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  licensePlate?: string;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  chassis?: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  renavam?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(maxVehicleYear)
  year?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  modelId?: number;
}
