import { Test, TestingModule } from '@nestjs/testing';
import { FxqlController } from './fxql.controller';
import { BadRequestException } from '@nestjs/common';
import { FxqlService } from './fxql.service';

describe('FxqlController', () => {
  let controller: FxqlController;
  let mockFxqlService: Partial<FxqlService>;

  beforeEach(async () => {
    // Mock FxqlService
    mockFxqlService = {
      handleFXQL: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FxqlController],
      providers: [
        { 
          provide: FxqlService, 
          useValue: mockFxqlService 
        }
      ],
    }).compile();

    controller = module.get<FxqlController>(FxqlController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should successfully parse FXQL statement', async () => {
    const mockResponse = {
      message: 'FXQL Statement Parsed Successfully.',
      code: 'FXQL-200',
      data: [
        {
          EntryId: 1,
          SourceCurrency: 'USD',
          DestinationCurrency: 'GBP',
          SellPrice: 0.85,
          BuyPrice: 100,
          CapAmount: 10000
        }
      ]
    };

    (mockFxqlService.handleFXQL as jest.Mock).mockResolvedValue(mockResponse);

    const result = await controller.parseFXQL({ FXQL: 'USD-GBP { BUY 100 SELL 0.85 CAP 10000 }' });

    expect(result).toEqual(mockResponse);
    expect(mockFxqlService.handleFXQL).toHaveBeenCalledWith('USD-GBP { BUY 100 SELL 0.85 CAP 10000 }');
  });

  it('should handle service errors', async () => {
    const errorResponse = {
      message: 'Invalid FXQL statement',
      code: 'FXQL-400'
    };

    (mockFxqlService.handleFXQL as jest.Mock).mockRejectedValue(
      new BadRequestException(errorResponse)
    );

    await expect(
      controller.parseFXQL({ FXQL: 'INVALID STATEMENT' })
    ).rejects.toThrow(BadRequestException);
  });
});