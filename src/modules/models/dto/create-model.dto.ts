import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsDefined, IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class CreateModelDto {
  @ApiProperty({ example: "Corolla" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 1, description: "Id de uma marca existente" })
  @Type(() => Number)
  @IsDefined({ message: "brandId is required" })
  @IsInt()
  @Min(1)
  brandId!: number;
}
