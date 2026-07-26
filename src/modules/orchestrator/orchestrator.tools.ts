import { ToolDecorator as Tool, PromptDecorator as Prompt, Widget, ExecutionContext, z, ControllerDecorator as Controller } from '@nitrostack/core';
import { OrchestratorService } from './services/orchestrator.service.js';

@Controller()
export class OrchestratorTools {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Prompt({
    name: 'orchestrator_system_prompt',
    description: 'The core instructions for the FlowLogix Orchestrator Agent.',
    arguments: []
  })
  getOrchestratorPrompt() {
    return {
      messages: [
        {
          role: 'system',
          content: 'You are the Orchestrator Agent for FlowLogix. You act as the main front desk gatekeeper. Intercept user queries, read persistent memory rules, and delegate tasks to the Supply Chain Agent or Floor Operations Agent. Do not calculate ATP or schedule docks yourself; use the provided routing tools.'
        }
      ]
    };
  }

  @Tool({
    name: 'get_warehouse_summary',
    description: 'Pulls the master RED/AMBER/GREEN status of the warehouse.',
    inputSchema: z.object({})
  })
  // @Widget('warehouse-health-summary')
  async getWarehouseSummary(input: any, ctx: ExecutionContext) {
    return this.orchestratorService.getWarehouseSummary();
  }

  @Tool({
    name: 'read_persistent_memory',
    description: 'Checks rules set by the manager (e.g. VIP clients, Hazmat rules).',
    inputSchema: z.object({})
  })
  async readPersistentMemory(input: any, ctx: ExecutionContext) {
    return this.orchestratorService.readPersistentMemory();
  }

  @Tool({
    name: 'route_to_supply_chain',
    description: 'Delegates procurement and inventory crises to the Supply Chain Agent.',
    inputSchema: z.object({
      intent_summary: z.string().describe('A summary of what the Supply Chain Agent needs to solve.')
    })
  })
  async routeToSupplyChain(input: { intent_summary: string }, ctx: ExecutionContext) {
    return this.orchestratorService.routeToSupplyChain(input.intent_summary);
  }

  @Tool({
    name: 'route_to_floor_ops',
    description: 'Delegates physical movement, dock schedules, and labor issues to the Floor Operations Agent.',
    inputSchema: z.object({
      intent_summary: z.string().describe('A summary of what the Floor Operations Agent needs to solve.')
    })
  })
  async routeToFloorOps(input: { intent_summary: string }, ctx: ExecutionContext) {
    return this.orchestratorService.routeToFloorOps(input.intent_summary);
  }
}
