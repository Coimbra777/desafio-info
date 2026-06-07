import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateVehicleDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  licensePlate?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  chassis?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  renavam?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  year?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  modelId?: number;
}
