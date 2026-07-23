import { Body, Controller, Post } from "@nestjs/common";
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { CreateUserDto } from "../users/dto/create-user.dto";
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

  @Post("register")
  @ApiOperation({
    summary: "Cadastro público de usuário; retorna um token JWT (auto-login)",
  })
  @ApiCreatedResponse({
    description: "Usuário cadastrado e autenticado com sucesso",
    type: LoginResponseDto,
  })
  @ApiConflictResponse({ description: "Email ou nickname já em uso" })
  register(@Body() registerDto: CreateUserDto): Promise<LoginResponseDto> {
    return this.authService.register(registerDto);
  }
}
