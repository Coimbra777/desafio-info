import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { Vehicle } from "./entities/vehicle.entity";

@Injectable()
export class VehiclesCacheService implements OnModuleDestroy {
  private readonly listKey = "vehicles:list";
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

  async getList(page: number, limit: number): Promise<unknown | null> {
    const cachedValue = await this.redis.get(this.getListKey(page, limit));

    if (!cachedValue) {
      return null;
    }

    return JSON.parse(cachedValue);
  }

  async setList(page: number, limit: number, value: unknown): Promise<void> {
    await this.redis.set(
      this.getListKey(page, limit),
      JSON.stringify(value),
      "EX",
      this.ttl,
    );
  }

  private getListKey(page: number, limit: number): string {
    return `${this.listKey}:page:${page}:limit:${limit}`;
  }

  async invalidateList(): Promise<void> {
    await this.redis.del(this.listKey);
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

  private getDetailKey(id: number): string {
    return `vehicles:detail:${id}`;
  }
}
