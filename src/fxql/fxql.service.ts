import { Injectable } from '@nestjs/common';
import { CreateFxqlDto } from './dto/create-fxql.dto';

@Injectable()
export class FxqlService {
  create(createFxqlDto: CreateFxqlDto) {
    return `This action adds a new fxql ${createFxqlDto}`;
  }
}
