import { Transform, Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateModelDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  brandId?: number;
}
