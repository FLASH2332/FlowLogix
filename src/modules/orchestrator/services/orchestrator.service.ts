import { Injectable, Logger } from '@nitrostack/core';

@Injectable()
export class OrchestratorService {
  constructor(private readonly logger: Logger) {}

  getWarehouseSummary() {
    this.logger.info('OrchestratorService: Fetching Master RED/AMBER/GREEN status...');
    return {
      status: 'AMBER',
      activeIssues: 2,
      criticalAlerts: 1,
      healthScore: 88,
      timestamp: new Date().toISOString()
    };
  }

  readPersistentMemory() {
    this.logger.info('OrchestratorService: Reading Manager Rules...');
    return {
      rules: [
        'Always prioritize Tata Motors orders',
        'Hazmat goods must be isolated by 50 feet',
        'Do not automatically approve POs > $5000'
      ]
    };
  }

  routeToSupplyChain(intent: string) {
    this.logger.info(`OrchestratorService: Waking up Supply Chain Agent for intent: ${intent}`);
    return { routed: true, target: 'SupplyChainAgent', context: intent };
  }

  routeToFloorOps(intent: string) {
    this.logger.info(`OrchestratorService: Waking up Floor Operations Agent for intent: ${intent}`);
    return { routed: true, target: 'FloorOpsAgent', context: intent };
  }
}
