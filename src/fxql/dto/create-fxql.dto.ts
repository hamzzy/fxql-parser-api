import { IsString, MaxLength } from 'class-validator';

export class CreateFxqlDto {
  @IsString()
  @MaxLength(1000)
  FXQL: string;
}
