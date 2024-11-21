import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { FxqlModule } from './fxql/fxql.module';
import { PrismaModule } from './database/prisma.module';
import { RateLimiterModule } from 'nestjs-rate-limiter';
import { LoggerModule } from 'nestjs-pino';
@Module({
  imports: [
    RateLimiterModule.register({
      points: 1000,
      duration: 3600, // 1 hour
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    FxqlModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
