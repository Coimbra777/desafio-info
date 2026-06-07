import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";
import { AuthService } from "./auth.service";

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
}));

describe("AuthService", () => {
  let authService: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, "findByEmail">>;
  let jwtService: jest.Mocked<Pick<JwtService, "signAsync">>;
  let compareMock: jest.MockedFunction<typeof bcrypt.compare>;

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
    };

    authService = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
    );

    compareMock = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns accessToken and tokenType for valid credentials", async () => {
    const user = createUser();

    usersService.findByEmail.mockResolvedValue(user);
    jwtService.signAsync.mockResolvedValue("jwt-token");
    compareMock.mockResolvedValue(true as never);

    const result = await authService.login({
      email: user.email,
      password: "ChangeMe123!",
    });

    expect(result).toEqual({
      accessToken: "jwt-token",
      tokenType: "Bearer",
    });
    expect(usersService.findByEmail).toHaveBeenCalledWith(user.email);
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: user.id,
      nickname: user.nickname,
      email: user.email,
    });
  });

  it("throws UnauthorizedException when user does not exist", async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({
        email: "missing@example.com",
        password: "ChangeMe123!",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it("throws UnauthorizedException when password is invalid", async () => {
    const user = createUser();

    usersService.findByEmail.mockResolvedValue(user);
    compareMock.mockResolvedValue(false as never);

    await expect(
      authService.login({
        email: user.email,
        password: "WrongPassword123!",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });
});

function createUser(): User {
  return {
    id: 1,
    nickname: "aivacol",
    name: "Aivacol",
    email: "aivacol@example.com",
    passwordHash: "hashed-password",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
