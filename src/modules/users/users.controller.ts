import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserResponseDto } from "./dto/user-response.dto";
import { UsersService } from "./users.service";

@ApiTags("users")
@ApiBearerAuth("access-token")
@ApiUnauthorizedResponse({ description: "Token ausente ou inválido" })
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: "Cria um novo usuário" })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiConflictResponse({ description: "Email ou nickname já em uso" })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: "Lista os usuários" })
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalha um usuário pelo id" })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: "Usuário não encontrado" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualiza um usuário" })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: "Usuário não encontrado" })
  @ApiConflictResponse({ description: "Email ou nickname já em uso" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "Remove um usuário" })
  @ApiNoContentResponse({ description: "Usuário removido" })
  @ApiNotFoundResponse({ description: "Usuário não encontrado" })
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    await this.usersService.remove(id);
  }
}
