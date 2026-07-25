import { McpApp, Module, ConfigModule } from '@nitrostack/core';
import { SupplyChainModule } from './modules/supply-chain/supply-chain.module.js';
import { FloorOpsModule } from './modules/floor-ops/floor-ops.module.js';
import { OrchestratorModule } from './modules/orchestrator/orchestrator.module.js';
import { SystemHealthCheck } from './health/system.health.js';

/**
 * Root Application Module
 * 
 * This is the main module that bootstraps the MCP server.
 * It registers all feature modules and health checks.
 */
@McpApp({
  module: AppModule,
  server: {
    name: 'flowlogix-server',
    version: '1.0.0'
  },
  logging: {
    level: 'info'
  }
})

@Module({
  name: 'app',
  description: 'Root application module',
  imports: [
    ConfigModule.forRoot(),
    SupplyChainModule,
    FloorOpsModule,
    OrchestratorModule
  ],
  providers: [
    // Health Checks
    SystemHealthCheck,
  ]
})
export class AppModule {}

