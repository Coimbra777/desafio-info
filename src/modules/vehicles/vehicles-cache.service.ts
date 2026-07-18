import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { PaginatedDto } from "../../common/pagination/paginated.dto";
import { Vehicle } from "./entities/vehicle.entity";

@Injectable()
export class VehiclesCacheService implements OnModuleDestroy {
  private readonly listVersionKey = "vehicles:list:version";
  private readonly ttl: number;
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisPassword = this.configService.get<string>("REDIS_PASSWORD");

    this.ttl = Number(
      this.configService.getOrThrow<string>("VEHICLES_CACHE_TTL"),
    );
    this.redis = new Redis({
      host: this.configService.getOrThrow<string>("REDIS_HOST"),
      port: Number(this.configService.getOrThrow<string>("REDIS_PORT")),
      password: redisPassword ? redisPassword : undefined,
      db: Number(this.configService.getOrThrow<string>("REDIS_DB")),
    });
  }

  async getList(
    page: number,
    limit: number,
  ): Promise<PaginatedDto<Vehicle> | null> {
    const key = await this.getListKey(page, limit);
    const cachedValue = await this.redis.get(key);

    if (!cachedValue) {
      return null;
    }

    return JSON.parse(cachedValue) as PaginatedDto<Vehicle>;
  }

  async setList(
    page: number,
    limit: number,
    result: PaginatedDto<Vehicle>,
  ): Promise<void> {
    const key = await this.getListKey(page, limit);
    await this.redis.set(key, JSON.stringify(result), "EX", this.ttl);
  }

  /**
   * Invalida TODAS as páginas de listagem em O(1) incrementando a versão.
   * As chaves das versões anteriores expiram naturalmente pelo TTL.
   */
  async invalidateList(): Promise<void> {
    await this.redis.incr(this.listVersionKey);
  }

  async getDetail(id: number): Promise<Vehicle | null> {
    const cachedValue = await this.redis.get(this.getDetailKey(id));

    if (!cachedValue) {
      return null;
    }

    return JSON.parse(cachedValue) as Vehicle;
  }

  async setDetail(vehicle: Vehicle): Promise<void> {
    await this.redis.set(
      this.getDetailKey(vehicle.id),
      JSON.stringify(vehicle),
      "EX",
      this.ttl,
    );
  }

  async invalidateDetail(id: number): Promise<void> {
    await this.redis.del(this.getDetailKey(id));
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  private async getListVersion(): Promise<number> {
    const version = await this.redis.get(this.listVersionKey);
    return version ? Number(version) : 0;
  }

  private async getListKey(page: number, limit: number): Promise<string> {
    const version = await this.getListVersion();
    return `vehicles:list:v${version}:p${page}:l${limit}`;
  }

  private getDetailKey(id: number): string {
    return `vehicles:detail:${id}`;
  }
}
