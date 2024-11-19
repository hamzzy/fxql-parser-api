import { PartialType } from '@nestjs/swagger';
import { CreateFxqlDto } from './create-fxql.dto';

export class UpdateFxqlDto extends PartialType(CreateFxqlDto) {}
