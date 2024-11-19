import { Test, TestingModule } from '@nestjs/testing';
import { FxqlController } from './fxql.controller';
import { FxqlService } from './fxql.service';

describe('FxqlController', () => {
  let controller: FxqlController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FxqlController],
      providers: [FxqlService],
    }).compile();

    controller = module.get<FxqlController>(FxqlController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
