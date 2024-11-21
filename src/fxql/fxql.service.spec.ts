import { Test, TestingModule } from '@nestjs/testing';
import { FxqlService } from './fxql.service';
import { PrismaService } from '../database/prisma.service';
import { PinoLogger } from 'nestjs-pino';
import { BadRequestException } from '@nestjs/common';
import { parseFXQLStatements } from './fxql.parser';

jest.mock('./fxql.parser');

describe('FxqlService', () => {
  let service: FxqlService;
  let prismaService: PrismaService;
  let loggerMock: Partial<PinoLogger>;

  beforeEach(async () => {
    loggerMock = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const prismaMock = {
      $transaction: jest.fn(),
      fXQLStatement: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FxqlService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: PinoLogger,
          useValue: loggerMock,
        },
      ],
    }).compile();

    service = module.get<FxqlService>(FxqlService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should throw an error for short FXQL input', async () => {
    await expect(service.handleFXQL('short')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw an error if FXQL parsing fails', async () => {
    (parseFXQLStatements as jest.Mock).mockReturnValue({
      success: [],
      errors: [{ line: 1, column: 1, error: 'Parse error' }],
    });

    await expect(service.handleFXQL('INVALID FXQL')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw an error if more than 1000 statements are provided', async () => {
    (parseFXQLStatements as jest.Mock).mockReturnValue({
      success: new Array(1001).fill({
        baseCurrency: 'USD',
        quoteCurrency: 'EUR',
        buyAmount: { value: 1.1 },
      }),
      errors: [],
    });

    await expect(service.handleFXQL('LARGE FXQL')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should successfully process and save FXQL statements', async () => {
    const mockParsedStatements = [
      {
        baseCurrency: 'USD',
        quoteCurrency: 'EUR',
        buyAmount: { value: 1.1 },
        sellAmount: { value: 1.2 },
        capAmount: { value: 10000 },
      },
    ];

    const mockSavedEntry = {
      id: 'test-uuid',
      sourceCurrency: 'USD',
      destinationCurrency: 'EUR',
      buyPrice: 1.1,
      sellPrice: 1.2,
      capAmount: 10000,
    };

    // Mock parsing
    (parseFXQLStatements as jest.Mock).mockReturnValue({
      success: mockParsedStatements,
      errors: [],
    });

    // Mock database transaction
    (prismaService.$transaction as jest.Mock).mockImplementation(async (fn) => {
      return fn({
        fXQLStatement: {
          create: jest.fn().mockResolvedValue(mockSavedEntry),
        },
      });
    });

    const result = await service.handleFXQL('VALID FXQL');

    expect(result.code).toBe('FXQL-201');
    expect(result.message).toBe('FXQL Statement Parsed Successfully.');
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual({
      EntryId: 'test-uuid',
      SourceCurrency: 'USD',
      DestinationCurrency: 'EUR',
      BuyPrice: 1.1,
      SellPrice: 1.2,
      CapAmount: 10000,
    });
  });

  it('should handle database save errors', async () => {
    const mockParsedStatements = [
      {
        baseCurrency: 'USD',
        quoteCurrency: 'EUR',
        buyAmount: { value: 1.1 },
      },
    ];

    (parseFXQLStatements as jest.Mock).mockReturnValue({
      success: mockParsedStatements,
      errors: [],
    });

    // Simulate database error
    (prismaService.$transaction as jest.Mock).mockRejectedValue(
      new Error('Database error'),
    );

    await expect(service.handleFXQL('VALID FXQL')).rejects.toThrow(
      BadRequestException,
    );
  });
});
