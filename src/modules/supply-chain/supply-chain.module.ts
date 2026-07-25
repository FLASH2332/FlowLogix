import { Module } from '@nitrostack/core';
import { IntegrationsModule } from '../integrations/integrations.module.js';
import { InboundService } from './services/inbound.service.js';
import { SupplyChainInboundTools } from './supply-chain-inbound.tools.js';

@Module({
  name: 'supply-chain',
  description: 'Handles inventory and procurement',
  imports: [IntegrationsModule],
  controllers: [
    SupplyChainInboundTools
  ],
  providers: [
    InboundService
  ]
})
export class SupplyChainModule {}
