import { Controller, Post, Body } from '@nestjs/common';
import { FxqlService } from './fxql.service';
import { FxqlDto } from './dto/fxql.dto';
import { FXQLResponse } from './fxql.response';

@Controller('fxql-statements')
export class FxqlController {
  constructor(private readonly fxqlService: FxqlService) {}

  @Post()
  public async parseFXQL(@Body() fxqlDto: FxqlDto): Promise<FXQLResponse> {
    try {
      return await this.fxqlService.handleFXQL(fxqlDto.FXQL);
    } catch (error) {
      // The error is already formatted by the service, so we can rethrow
      throw error;
    }
  }
}
