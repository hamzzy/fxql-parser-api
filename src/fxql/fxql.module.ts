import { Module } from '@nestjs/common';
import { FxqlService } from './fxql.service';
import { FxqlController } from './fxql.controller';

@Module({
  controllers: [FxqlController],
  providers: [FxqlService],
})
export class FxqlModule {}
