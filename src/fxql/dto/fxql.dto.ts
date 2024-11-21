import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class FxqlDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description:
      'The FXQL statement(s) to be processed. Each statement should follow the specified syntax format.', // Detailed description
    example: 'USD-GBP {\\n  BUY 100\\n  SELL 200\\n  CAP 93800\\n}', // Valid example
    type: String,
    required: true, // Marks the property as required in Swagger
  })
  FXQL: string;
}
