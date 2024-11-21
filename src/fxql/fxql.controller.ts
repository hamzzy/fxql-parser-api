import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FxqlService } from './fxql.service';
import { FxqlDto } from './dto/fxql.dto';
import { FXQLResponse } from '../fxql/fxql.types';

@ApiTags('FXQL Statements') // Swagger grouping
@Controller('fxql-statements')
export class FxqlController {
  constructor(private readonly fxqlService: FxqlService) {}

  @Post()
  @ApiOperation({
    summary: 'Parse FXQL Statements',
    description:
      'This endpoint accepts FXQL statements, validates their syntax, and processes them to return the parsed results or an error.',
  })
  @ApiResponse({
    status: 200,
    description: 'FXQL statements parsed successfully.',
    schema: {
      example: {
        message: 'Rates Parsed Successfully.',
        code: 'FXQL-200',
        data: [
          {
            EntryId: 192,
            SourceCurrency: 'USD',
            DestinationCurrency: 'GBP',
            SellPrice: 200,
            BuyPrice: 100,
            CapAmount: 93800,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid FXQL statement syntax.',
    schema: {
      example: {
        message: 'Syntax error at line 3, column 5: Invalid CAP amount.',
        code: 'FXQL-400',
      },
    },
  })
  public async parseFXQL(@Body() fxqlDto: FxqlDto): Promise<FXQLResponse> {
    try {
      return await this.fxqlService.handleFXQL(fxqlDto.FXQL);
    } catch (error) {
      // Catch and format error
      throw error;
    }
  }
}
