import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BrandsModule } from "./modules/brands/brands.module";
import { ModelsModule } from "./modules/models/models.module";
import { UsersModule } from "./modules/users/users.module";
import { VehiclesModule } from "./modules/vehicles/vehicles.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ".env",
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "mssql",
        host: configService.getOrThrow<string>("DB_HOST"),
        port: Number(configService.getOrThrow<string>("DB_PORT")),
        username: configService.getOrThrow<string>("DB_USERNAME"),
        password: configService.getOrThrow<string>("DB_PASSWORD"),
        database: configService.getOrThrow<string>("DB_DATABASE"),
        options: {
          encrypt: configService.getOrThrow<string>("DB_ENCRYPT") === "true",
          trustServerCertificate:
            configService.getOrThrow<string>("DB_TRUST_SERVER_CERTIFICATE") ===
            "true",
        },
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: false,
      }),
    }),

    AuditModule,
    AuthModule,
    BrandsModule,
    ModelsModule,
    UsersModule,
    VehiclesModule,
  ],
})
export class AppModule {}
