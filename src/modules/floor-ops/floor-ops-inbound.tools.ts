import { ToolDecorator as Tool, Widget, ExecutionContext, z, ControllerDecorator as Controller } from '@nitrostack/core';
import { DockService } from './services/dock.service.js';

@Controller()
export class FloorOpsInboundTools {
  constructor(private readonly dockService: DockService) {}

  @Tool({
    name: 'check_inbound_delays',
    description: 'Checks TomTom GPS webhook data for delayed inbound trucks.',
    inputSchema: z.object({}) // No input needed, reads global state or webhook events
  })
  async checkInboundDelays(input: any, ctx: ExecutionContext) {
    ctx.logger.info('Checking TomTom for inbound delays...');
    return this.dockService.checkInboundDelays();
  }

  @Tool({
    name: 'reschedule_dock_slot',
    description: 'Finds an empty dock door for a delayed truck.',
    inputSchema: z.object({
      truck_id: z.string(),
      new_time: z.string()
    })
  })
  @Widget('dock-schedule-tracker')
  async rescheduleDockSlot(input: { truck_id: string; new_time: string }, ctx: ExecutionContext) {
    return this.dockService.rescheduleDockSlot(input.truck_id, input.new_time);
  }

  @Tool({
    name: 'reassign_dock_workers',
    description: 'Shifts idle workers from one dock/time to another task.',
    inputSchema: z.object({
      from_slot: z.string(),
      to_task: z.string()
    })
  })
  async reassignDockWorkers(input: { from_slot: string; to_task: string }, ctx: ExecutionContext) {
    return this.dockService.reassignDockWorkers(input.from_slot, input.to_task);
  }

  @Tool({
    name: 'query_erp_for_po',
    description: 'Searches Airtable/ERP for a pending Purchase Order given a vendor name.',
    inputSchema: z.object({
      vendor_name: z.string(),
      date: z.string()
    })
  })
  async queryErpForPo(input: { vendor_name: string; date: string }, ctx: ExecutionContext) {
    return this.dockService.queryErpForPo(input.vendor_name, input.date);
  }

  @Tool({
    name: 'create_emergency_dock_slot',
    description: 'Allocates the least busy dock for a truck that arrived without an ASN.',
    inputSchema: z.object({
      truck_id: z.string()
    })
  })
  async createEmergencyDockSlot(input: { truck_id: string }, ctx: ExecutionContext) {
    return this.dockService.createEmergencyDockSlot(input.truck_id);
  }
}
