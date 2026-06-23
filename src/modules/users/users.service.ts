import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    if (createUserDto.nickname) {
      await this.ensureNicknameAvailable(createUserDto.nickname);
    }

    await this.ensureEmailAvailable(createUserDto.email);

    const passwordHash = await bcrypt.hash(
      this.normalizePassword(createUserDto.password),
      10,
    );

    const user = this.usersRepository.create({
      nickname: createUserDto.nickname,
      name: createUserDto.name,
      email: createUserDto.email,
      passwordHash,
    });

    const savedUser = await this.usersRepository.save(user);

    return this.toResponse(savedUser);
  }

  async findAll() {
    const users = await this.usersRepository.find({
      order: {
        createdAt: "ASC",
      },
    });

    return users.map((user) => this.toResponse(user));
  }

  async findOne(id: number) {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.toResponse(user);
  }

  findByNickname(nickname: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { nickname },
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (updateUserDto.nickname && updateUserDto.nickname !== user.nickname) {
      await this.ensureNicknameAvailable(updateUserDto.nickname);
      user.nickname = updateUserDto.nickname;
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      await this.ensureEmailAvailable(updateUserDto.email);
      user.email = updateUserDto.email;
    }

    if (updateUserDto.name) {
      user.name = updateUserDto.name;
    }

    if (updateUserDto.password) {
      user.passwordHash = await bcrypt.hash(
        this.normalizePassword(updateUserDto.password),
        10,
      );
    }

    const updatedUser = await this.usersRepository.save(user);

    return this.toResponse(updatedUser);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.usersRepository.remove(user);
  }

  private async ensureNicknameAvailable(nickname: string): Promise<void> {
    const existingUser = await this.findByNickname(nickname);

    if (existingUser) {
      throw new ConflictException("Nickname already exists");
    }
  }

  private async ensureEmailAvailable(email: string): Promise<void> {
    const existingUser = await this.findByEmail(email);

    if (existingUser) {
      throw new ConflictException("Email already exists");
    }
  }

  private toResponse(user: User) {
    return {
      id: user.id,
      nickname: user.nickname,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private normalizePassword(password: unknown): string {
    return String(password);
  }
}
