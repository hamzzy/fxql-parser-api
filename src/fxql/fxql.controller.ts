import { Controller, Post, Body } from '@nestjs/common';
import { FxqlService } from './fxql.service';
import { CreateFxqlDto } from './dto/create-fxql.dto';

@Controller('fxql')
export class FxqlController {
  constructor(private readonly fxqlService: FxqlService) {}

  @Post()
  create(@Body() createFxqlDto: CreateFxqlDto) {
    return this.fxqlService.create(createFxqlDto);
  }
}
