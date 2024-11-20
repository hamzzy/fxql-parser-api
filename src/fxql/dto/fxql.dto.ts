import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class FxqlDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '',
    minimum: 1,
    default: '',
    type: String,
  })
  FXQL: string;
}
