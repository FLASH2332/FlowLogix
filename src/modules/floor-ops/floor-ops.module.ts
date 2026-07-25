import { Module } from '@nitrostack/core';
import { IntegrationsModule } from '../integrations/integrations.module.js';
import { DockService } from './services/dock.service.js';
import { FloorOpsInboundTools } from './floor-ops-inbound.tools.js';

@Module({
  name: 'floor-ops',
  description: 'Handles physical dock routing and labor scheduling',
  imports: [IntegrationsModule],
  controllers: [
    FloorOpsInboundTools
  ],
  providers: [
    DockService
  ]
})
export class FloorOpsModule {}
