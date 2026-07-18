import { ApiProperty } from "@nestjs/swagger";

export class LoginResponseDto {
  @ApiProperty({
    description: "Token JWT a ser enviado no header Authorization",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  accessToken!: string;

  @ApiProperty({ example: "Bearer", enum: ["Bearer"] })
  tokenType!: "Bearer";
}
