import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { parseFXQLStatements } from './fxql.parser';
import { FXQLResponse } from './fxql.response';

@Injectable()
export class FxqlService {
  constructor(private readonly prisma: PrismaService) {}

  async handleFXQL(fxql: string): Promise<FXQLResponse> {
    // Check if input is empty
    if (!fxql || fxql.trim() === '') {
      throw new BadRequestException({
        message: 'FXQL input cannot be empty',
        code: 'FXQL-400',
      });
    }

    // Parse the FXQL statements
    const parseResult = parseFXQLStatements(fxql);

    // Check for parsing errors
    if (parseResult.errors.length > 0) {
      // Return the first error
      const firstError = parseResult.errors;
      throw new BadRequestException({
        code: 'FXQL-400',
        details: firstError,
      });
    }

    // Check statement count limit
    if (parseResult.success.length > 1000) {
      throw new BadRequestException({
        message: 'Maximum 1000 currency pairs per request',
        code: 'FXQL-400',
      });
    }

    // Transform parsed statements to database format
    const currencyEntries = parseResult.success.map((statement) => ({
      sourceCurrency: statement.baseCurrency,
      destinationCurrency: statement.quoteCurrency,
      buyPrice: statement.buyAmount ? statement.buyAmount.value : null,
      sellPrice: statement.sellAmount ? statement.sellAmount.value : null,
      capAmount: statement.capAmount ? statement.capAmount.value : null,
    }));

    try {
      // Begin a transaction to ensure atomic operation
      const result = await this.prisma.$transaction(async (prisma) => {
        // Insert new entries
        await prisma.fXQLStatement.createMany({
          data: currencyEntries,
        });

        // Return the inserted entries
        return currencyEntries;
      });

      return {
        message: 'FXQL Statement Parsed Successfully.',
        code: 'FXQL-200',
        data: result,
      };
    } catch (error) {
      // Handle database errors
      throw new BadRequestException({
        message: 'Error saving FXQL statements to database',
        code: 'FXQL-500',
        details: error.message,
      });
    }
  }
}
