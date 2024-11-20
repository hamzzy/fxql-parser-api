import { IsString, IsNotEmpty } from 'class-validator';

export class FxqlDto {
  @IsString()
  @IsNotEmpty()
  FXQL: string;
}
