import { Module } from '@nitrostack/core';
import { OrchestratorService } from './services/orchestrator.service.js';
import { OrchestratorTools } from './orchestrator.tools.js';

@Module({
  name: 'orchestrator',
  description: 'The top-level agent routing interface',
  controllers: [
    OrchestratorTools
  ],
  providers: [
    OrchestratorService
  ]
})
export class OrchestratorModule {}
