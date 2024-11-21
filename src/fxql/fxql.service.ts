import { Injectable, BadRequestException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../database/prisma.service';
import { parseFXQLStatements } from './fxql.parser';
import { v4 as uuidv4 } from 'uuid';
import { FXQLEntry, FXQLResponse } from './fxql.types';

@Injectable()
export class FxqlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FxqlService.name);
  }

  async handleFXQL(fxql: string): Promise<FXQLResponse> {
    const requestId = uuidv4();
    this.logger.info('Processing FXQL request', { requestId });

    this.validateFXQLInput(fxql);

    const parseResult = parseFXQLStatements(fxql);
    if (parseResult.errors.length > 0) {
      this.logger.error(
        {
          requestId,
          errors: parseResult.errors,
        },
        'Parsing errors encountered',
      );
      throw new BadRequestException({
        code: 'FXQL-400-PARSE',
        details: parseResult.errors.map((err) => ({
          line: err.line,
          column: err.column,
          message: err.error,
        })),
      });
    }

    const currencyEntries = this.transformParsedStatements(parseResult.success);
    if (currencyEntries.length > 1000) {
      this.logger.warn(
        {
          requestId,
          count: currencyEntries.length,
        },
        'Exceeded maximum statement count',
      );
      throw new BadRequestException({
        message: 'Maximum 1000 currency pairs per request',
        code: 'FXQL-400-LIMIT',
      });
    }

    const savedEntries = await this.saveToDatabase(currencyEntries);
    const paginatedResult = this.paginate(savedEntries, 1, 100);

    this.logger.info(
      { requestId, paginatedResult },
      'FXQL request processed successfully',
    );
    return {
      message: 'FXQL Statement Parsed Successfully.',
      code: 'FXQL-201',
      data: paginatedResult,
    };
  }

  private validateFXQLInput(fxql: string): void {
    const trimmedFXQL = fxql.trim();
    if (trimmedFXQL.length < 10) {
      this.logger.warn('FXQL input is too short');
      throw new BadRequestException({
        message: 'FXQL input is too short to be valid.',
        code: 'FXQL-400',
      });
    }
  }

  private transformParsedStatements(statements): FXQLEntry[] {
    return statements.map((statement) => ({
      SourceCurrency: statement.baseCurrency,
      DestinationCurrency: statement.quoteCurrency,
      BuyPrice: statement.buyAmount?.value || null,
      SellPrice: statement.sellAmount?.value || null,
      CapAmount: statement.capAmount?.value || null,
    }));
  }

  private paginate(
    data: FXQLEntry[],
    page: number,
    limit: number,
  ): FXQLEntry[] {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return data.slice(startIndex, endIndex);
  }

  private async saveToDatabase(
    currencyEntries: FXQLEntry[],
  ): Promise<FXQLEntry[]> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Create entries and return the saved entries with their database IDs
        const savedEntries = await Promise.all(
          currencyEntries.map(async (entry) => {
            const savedEntry = await prisma.fXQLStatement.create({
              data: {
                sourceCurrency: entry.SourceCurrency,
                destinationCurrency: entry.DestinationCurrency,
                buyPrice: entry.BuyPrice,
                sellPrice: entry.SellPrice,
                capAmount: entry.CapAmount,
              },
            });

            return {
              EntryId: savedEntry.id, // Assuming the database model has an 'id' field
              SourceCurrency: savedEntry.sourceCurrency,
              DestinationCurrency: savedEntry.destinationCurrency,
              BuyPrice: savedEntry.buyPrice,
              SellPrice: savedEntry.sellPrice,
              CapAmount: savedEntry.capAmount,
            };
          }),
        );

        return savedEntries;
      });
    } catch (error) {
      this.logger.error(
        {
          error: error.message,
        },
        'Database transaction failed',
      );
      throw new BadRequestException({
        message: 'Error saving FXQL statements to database',
        code: 'FXQL-500',
        details: error.message,
      });
    }
  }
}
