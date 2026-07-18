import { ApiProperty } from "@nestjs/swagger";

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: "aivacol", nullable: true })
  nickname!: string | null;

  @ApiProperty({ example: "Aivacol" })
  name!: string;

  @ApiProperty({ example: "aivacol@example.com" })
  email!: string;

  @ApiProperty({ example: "2026-07-18T12:00:00.000Z" })
  createdAt!: Date;

  @ApiProperty({ example: "2026-07-18T12:00:00.000Z" })
  updatedAt!: Date;
}
