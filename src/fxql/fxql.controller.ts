import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FxqlService } from './fxql.service';
import { CreateFxqlDto } from './dto/create-fxql.dto';
import { UpdateFxqlDto } from './dto/update-fxql.dto';

@Controller('fxql')
export class FxqlController {
  constructor(private readonly fxqlService: FxqlService) {}

  @Post()
  create(@Body() createFxqlDto: CreateFxqlDto) {
    return this.fxqlService.create(createFxqlDto);
  }

  @Get()
  findAll() {
    return this.fxqlService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fxqlService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFxqlDto: UpdateFxqlDto) {
    return this.fxqlService.update(+id, updateFxqlDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fxqlService.remove(+id);
  }
}
