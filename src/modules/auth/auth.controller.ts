import { Body, Controller, Post } from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { LoginResponseDto } from "./dto/login-response.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @ApiOperation({ summary: "Autentica por email/senha e retorna um token JWT" })
  @ApiCreatedResponse({
    description: "Autenticado com sucesso",
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({ description: "Credenciais inválidas" })
  login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }
}
