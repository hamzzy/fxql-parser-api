import { Module } from '@nestjs/common';
import { FxqlService } from './fxql.service';
import { FxqlController } from './fxql.controller';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [FxqlController],
  providers: [FxqlService, PrismaService],
})
export class FxqlModule {}
