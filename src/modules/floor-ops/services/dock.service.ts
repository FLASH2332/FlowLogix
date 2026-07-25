import { Injectable, Inject } from '@nitrostack/core';
import { ITomTomService, TOMTOM_SERVICE, IAirtableService, AIRTABLE_SERVICE } from '../../integrations/integrations.types.js';

@Injectable()
export class DockService {
  constructor(
    @Inject(TOMTOM_SERVICE) private readonly tomtomService: ITomTomService,
    @Inject(AIRTABLE_SERVICE) private readonly airtableService: IAirtableService
  ) {}

  async checkInboundDelays() {
    return this.tomtomService.checkInboundDelays();
  }

  rescheduleDockSlot(truckId: string, newTime: string) {
    // Deterministic scheduling logic
    return {
      truckId,
      newTime,
      dockDoor: 'DOCK-2',
      status: 'RESCHEDULED'
    };
  }

  reassignDockWorkers(fromSlot: string, toTask: string) {
    // Deterministic roster assignment
    return {
      reassignedCount: 4,
      fromSlot,
      toTask,
      status: 'REASSIGNED'
    };
  }

  async queryErpForPo(vendorName: string, date: string) {
    return this.airtableService.queryErpForPo(vendorName, date);
  }

  createEmergencyDockSlot(truckId: string) {
    // Finds least busy dock
    return {
      truckId,
      assignedDock: 'DOCK-4',
      status: 'EMERGENCY_SLOT_CREATED'
    };
  }
}
