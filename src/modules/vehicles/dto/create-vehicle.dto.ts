import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsDefined, IsInt, IsNotEmpty, IsString, Max, Min } from "class-validator";

const maxVehicleYear = new Date().getFullYear() + 1;

export class CreateVehicleDto {
  @ApiProperty({
    example: "ABC1234",
    description: "Placa única (normalizada para maiúsculas)",
  })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  licensePlate!: string;

  @ApiProperty({
    example: "9BWZZZ377VT004251",
    description: "Chassi único (normalizado para maiúsculas)",
  })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  chassis!: string;

  @ApiProperty({ example: "12345678901", description: "RENAVAM único" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  renavam!: string;

  @ApiProperty({
    example: 2024,
    minimum: 1900,
    maximum: maxVehicleYear,
    description: "Entre 1900 e o ano atual + 1",
  })
  @Type(() => Number)
  @IsDefined({ message: "year is required" })
  @IsInt()
  @Min(1900)
  @Max(maxVehicleYear)
  year!: number;

  @ApiProperty({ example: 1, description: "Id de um modelo existente" })
  @Type(() => Number)
  @IsDefined({ message: "modelId is required" })
  @IsInt()
  @Min(1)
  modelId!: number;
}
