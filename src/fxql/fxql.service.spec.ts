import { Test, TestingModule } from '@nestjs/testing';
import { FxqlService } from './fxql.service';

describe('FxqlService', () => {
  let service: FxqlService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FxqlService],
    }).compile();

    service = module.get<FxqlService>(FxqlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
