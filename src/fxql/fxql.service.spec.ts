import { Test, TestingModule } from '@nestjs/testing';
import { FxqlService } from './fxql.service';
import { PrismaService } from '../database/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { parseFXQLStatements } from './fxql.parser';

jest.mock('./fxql.parser'); // Mock parseFXQLStatements

describe('FxqlService', () => {
  let service: FxqlService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const prismaMock = {
      $transaction: jest.fn(), // Mock transaction method
      fXQLStatement: {
        createMany: jest.fn(), // Mock createMany method
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FxqlService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<FxqlService>(FxqlService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw an error if FXQL input is empty', async () => {
    await expect(service.handleFXQL('')).rejects.toThrow(BadRequestException);
  });

  it('should throw an error if FXQL input parsing fails', async () => {
    (parseFXQLStatements as jest.Mock).mockReturnValue({
      success: [],
      errors: ['Invalid FXQL statement'],
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

    await expect(service.handleFXQL('VALID FXQL')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should save parsed statements to the database and return a success response', async () => {
    const mockParsedStatements = [
      {
        baseCurrency: 'USD',
        quoteCurrency: 'EUR',
        buyAmount: { value: 1.1 },
        sellAmount: { value: 1.2 },
        capAmount: null,
      },
    ];

    (parseFXQLStatements as jest.Mock).mockReturnValue({
      success: mockParsedStatements,
      errors: [],
    });

    // Mock transaction and database interaction
    (prismaService.$transaction as jest.Mock).mockImplementation(
      async (callback) => callback(prismaService),
    );
    (prismaService.fXQLStatement.createMany as jest.Mock).mockResolvedValueOnce(
      undefined,
    );

    const result = await service.handleFXQL('VALID FXQL');
    expect(result).toEqual({
      message: 'FXQL Statement Parsed Successfully.',
      code: 'FXQL-200',
      data: [
        {
          sourceCurrency: 'USD',
          destinationCurrency: 'EUR',
          buyPrice: 1.1,
          sellPrice: 1.2,
          capAmount: null,
        },
      ],
    });
    expect(prismaService.fXQLStatement.createMany).toHaveBeenCalledWith({
      data: [
        {
          sourceCurrency: 'USD',
          destinationCurrency: 'EUR',
          buyPrice: 1.1,
          sellPrice: 1.2,
          capAmount: null,
        },
      ],
    });
  });

  it('should throw an error if saving to the database fails', async () => {
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

    // Mock transaction to simulate a database error
    (prismaService.$transaction as jest.Mock).mockImplementationOnce(
      async () => {
        throw new Error('Database error');
      },
    );

    await expect(service.handleFXQL('VALID FXQL')).rejects.toThrow(
      BadRequestException,
    );
  });
});
