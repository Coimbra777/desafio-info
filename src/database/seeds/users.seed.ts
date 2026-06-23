import * as bcrypt from "bcrypt";
import { DataSource, FindOptionsWhere } from "typeorm";
import { User } from "../../modules/users/entities/user.entity";

export interface SeedUserOptions {
  nickname?: string | null;
  name?: string;
  email?: string;
  password?: string;
}

export interface SeedUserResult {
  user: User;
  created: boolean;
}

const DEFAULT_SEED_USER = {
  nickname: "aivacol",
  name: "Aivacol",
  email: "aivacol@example.com",
  password: "ChangeMe123!",
};

export async function ensureSeedUser(
  dataSource: DataSource,
  options: SeedUserOptions = {},
): Promise<SeedUserResult> {
  const repository = dataSource.getRepository(User);
  const seedUser = {
    ...DEFAULT_SEED_USER,
    ...options,
  };

  const where: FindOptionsWhere<User>[] = [{ email: seedUser.email }];

  if (seedUser.nickname) {
    where.push({ nickname: seedUser.nickname });
  }

  const existingUser = await repository.findOne({ where });

  if (existingUser) {
    return { user: existingUser, created: false };
  }

  const passwordHash = await bcrypt.hash(seedUser.password, 10);
  const user = repository.create({
    nickname: seedUser.nickname,
    name: seedUser.name,
    email: seedUser.email,
    passwordHash,
  });

  await repository.save(user);

  return { user, created: true };
}
