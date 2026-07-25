import { ToolDecorator as Tool, Widget, ExecutionContext, z } from '@nitrostack/core';
import { DockService } from './services/dock.service.js';

/**
 * Floor Operations Agent — Inbound Tools
 *
 * Handles: UC2 (Inbound Traffic Delay & Dock Re-scheduling) and UC3 (Blind Receiving)
 * Agent: Floor Operations Agent
 * Stage: Stage 1 — Inbound & Receiving
 */
export class FloorOpsInboundTools {
  constructor(private readonly dockService: DockService) {}

  // ══════════════════════════════════════════════════════════
  // USE CASE 2: Inbound Traffic Delay & Dock Re-scheduling
  // ══════════════════════════════════════════════════════════

  /**
   * TOOL 1 — check_inbound_delays
   * Ingests a GPS telemetry delay event for an inbound truck.
   * Must be called before reschedule_dock_slot.
   */
  @Tool({
    name: 'check_inbound_delays',
    description:
      'Ingests a GPS-based delay event for an inbound supplier truck. ' +
      'Returns the truck\'s original arrival time, estimated delay in minutes, new ETA, and the currently assigned dock door. ' +
      'This is the entry point for all dock rescheduling workflows. ' +
      'Call this first when a GPS alert or dispatch notification reports a truck running late. ' +
      'Always follow this with reschedule_dock_slot to update the physical door assignment.',
    inputSchema: z.object({
      truck_id: z
        .string()
        .describe('Unique truck identifier from the GPS or dispatch system (e.g. "TRK-DELAY-001")'),
      delay_minutes: z
        .number()
        .int()
        .min(1)
        .describe('Confirmed delay duration in minutes as reported by GPS telemetry (e.g. 75 for 1 hour 15 min delay)'),
    }),
  })
  async checkInboundDelays(
    input: { truck_id: string; delay_minutes: number },
    ctx: ExecutionContext
  ) {
    ctx.logger.info('Ingesting GPS delay event', {
      truckId: input.truck_id,
      delayMinutes: input.delay_minutes,
    });

    const result = this.dockService.ingestGpsDelay(input.truck_id, input.delay_minutes);

    ctx.logger.warn('Truck delay registered', {
      truckId: result.truckId,
      newEta: result.newEta,
      currentDoor: result.currentDoorId,
    });

    return result;
  }

  /**
   * TOOL 2 — reschedule_dock_slot
   * Finds the next available dock door and shifts the truck's assignment.
   * Renders the DockScheduleTracker widget showing the before/after timeline.
   */
  @Tool({
    name: 'reschedule_dock_slot',
    description:
      'Finds the next available dock door and shifts a delayed truck\'s slot to a new door and time. ' +
      'Scans the dock door schedule (same zone first, then any available), updates the assignment, ' +
      'and releases the original door for other trucks. ' +
      'Always call check_inbound_delays before this tool to confirm the delay. ' +
      'Returns the new door ID, shifted schedule, and list of affected workers who must be notified.',
    inputSchema: z.object({
      truck_id: z
        .string()
        .describe('Truck ID from check_inbound_delays result (e.g. "TRK-DELAY-001")'),
      delay_minutes: z
        .number()
        .int()
        .min(1)
        .describe('Delay in minutes from the GPS event — used to calculate the new arrival time'),
    }),
  })
  @Widget('dock-schedule-tracker')
  async rescheduleDockSlot(
    input: { truck_id: string; delay_minutes: number },
    ctx: ExecutionContext
  ) {
    ctx.logger.info('Rescheduling dock slot', {
      truckId: input.truck_id,
      delayMinutes: input.delay_minutes,
    });

    const result = this.dockService.findNextDockSlot(input.truck_id, input.delay_minutes);

    ctx.logger.info('Dock slot rescheduled', {
      from: result.originalDoorId,
      to: result.newDoorId,
      newArrival: result.newScheduledArrival,
    });

    return result;
  }

  /**
   * TOOL 3 — reassign_dock_workers
   * Moves idle receiving workers from a vacated dock to picking duties.
   */
  @Tool({
    name: 'reassign_dock_workers',
    description:
      'Reassigns receiving workers from a delayed/vacated dock door to picking duties to prevent idle labor time. ' +
      'Matches workers by their PICKING certification. Workers without the certification are marked idle. ' +
      'Call this after reschedule_dock_slot using the originalDoorId from its result. ' +
      'Returns a reassignment log showing each worker\'s transition from RECEIVING to PICKING.',
    inputSchema: z.object({
      original_dock_id: z
        .string()
        .describe(
          'The dock door ID that was vacated/rescheduled (from reschedule_dock_slot.originalDoorId, e.g. "DOCK-A2")'
        ),
    }),
  })
  async reassignDockWorkers(
    input: { original_dock_id: string },
    ctx: ExecutionContext
  ) {
    ctx.logger.info('Reassigning dock workers', { dockId: input.original_dock_id });

    const result = this.dockService.shiftWorkers(input.original_dock_id);

    ctx.logger.info('Worker reassignment complete', {
      reassigned: result.reassigned.length,
      idle: result.idleNow.length,
    });

    return result;
  }

  // ══════════════════════════════════════════════════════════
  // USE CASE 3: Blind Receiving (Unannounced Truck Arrival)
  // ══════════════════════════════════════════════════════════

  /**
   * TOOL 4 — query_erp_for_po
   * Searches the ERP system using license plate or vendor name to find the missing PO.
   */
  @Tool({
    name: 'query_erp_for_po',
    description:
      'Searches the ERP database for a Purchase Order matching an unannounced truck\'s license plate or vendor name. ' +
      'Tries license plate exact match first (confidence: 0.99), falls back to fuzzy vendor name match (confidence: 0.75). ' +
      'Use this when a truck arrives without an Advance Shipment Notice (ASN) — i.e., no PO was pre-associated. ' +
      'Returns the matched PO record, match method, and confidence score. ' +
      'If found via vendor name only, instruct the gate supervisor to verify the plate manually.',
    inputSchema: z.object({
      license_plate: z
        .string()
        .describe('Vehicle license plate as read by the gate camera or reported by the driver (e.g. "KA-05-EF-9012")'),
      vendor_name: z
        .string()
        .describe('Vendor or transport company name as provided by the driver (e.g. "Nova Freight")'),
    }),
  })
  async queryErpForPo(
    input: { license_plate: string; vendor_name: string },
    ctx: ExecutionContext
  ) {
    ctx.logger.info('Querying ERP for unannounced truck', {
      plate: input.license_plate,
      vendor: input.vendor_name,
    });

    const result = this.dockService.erpPoLookup(input.license_plate, input.vendor_name);

    ctx.logger.info('ERP lookup complete', {
      found: result.found,
      matchedBy: result.matchedBy,
      confidence: result.confidence,
    });

    return result;
  }

  /**
   * TOOL 5 — create_emergency_dock_slot
   * Allocates the overflow dock door (B-99) for an unannounced truck.
   */
  @Tool({
    name: 'create_emergency_dock_slot',
    description:
      'Allocates the overflow dock door (B-99) for an unannounced truck that has no pre-scheduled slot. ' +
      'The truck is held at the overflow dock until the PO is verified via query_erp_for_po. ' +
      'DO NOT allow unloading until a PO is confirmed. ' +
      'Call this after query_erp_for_po to give the truck a physical location while investigation continues. ' +
      'Returns the dock assignment and supervisor instructions.',
    inputSchema: z.object({
      vendor_name: z
        .string()
        .describe('Vendor/driver name for the overflow dock assignment log (e.g. "Nova Freight")'),
    }),
  })
  async createEmergencyDockSlot(
    input: { vendor_name: string },
    ctx: ExecutionContext
  ) {
    ctx.logger.info('Allocating overflow dock for unannounced truck', {
      vendor: input.vendor_name,
    });

    const result = this.dockService.allocateOverflowDock(input.vendor_name);

    ctx.logger.info('Overflow dock allocated', {
      doorId: result.doorId,
      vendor: result.vendorName,
    });

    return result;
  }
}
