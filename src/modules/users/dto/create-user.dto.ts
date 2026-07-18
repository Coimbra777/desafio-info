import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from "class-validator";

export class CreateUserDto {
  @ApiPropertyOptional({
    example: "jsilva",
    description: "Único quando informado",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  nickname?: string;

  @ApiProperty({ example: "João da Silva" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "joao.silva@example.com", format: "email" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: "ChangeMe123!", minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
