import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validateEnv } from './config/validation.config';
import { AuthModule } from './modules/auth/auth.module';
import { ModelsModule } from './modules/models/models.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mssql',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USERNAME'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_DATABASE'),
        options: {
          encrypt: configService.getOrThrow<boolean>('DB_ENCRYPT'),
          trustServerCertificate: configService.getOrThrow<boolean>(
            'DB_TRUST_SERVER_CERTIFICATE',
          ),
        },
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: false,
      }),
    }),
    RedisModule,
    AuthModule,
    UsersModule,
    ModelsModule,
    VehiclesModule,
  ],
})
export class AppModule {}
