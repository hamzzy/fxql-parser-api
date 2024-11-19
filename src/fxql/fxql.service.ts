import { Injectable } from '@nestjs/common';
import { CreateFxqlDto } from './dto/create-fxql.dto';
import { UpdateFxqlDto } from './dto/update-fxql.dto';

@Injectable()
export class FxqlService {
  create(createFxqlDto: CreateFxqlDto) {
    return 'This action adds a new fxql';
  }

  findAll() {
    return `This action returns all fxql`;
  }

  findOne(id: number) {
    return `This action returns a #${id} fxql`;
  }

  update(id: number, updateFxqlDto: UpdateFxqlDto) {
    return `This action updates a #${id} fxql`;
  }

  remove(id: number) {
    return `This action removes a #${id} fxql`;
  }
}
