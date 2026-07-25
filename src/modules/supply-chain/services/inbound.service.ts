import { Injectable, Inject } from '@nitrostack/core';
import { 
  IVisionService, VISION_SERVICE, 
  IAirtableService, AIRTABLE_SERVICE,
  ISlackService, SLACK_SERVICE,
  IGmailService, GMAIL_SERVICE 
} from '../../integrations/integrations.types.js';

@Injectable()
export class InboundService {
  constructor(
    @Inject(VISION_SERVICE) private readonly visionService: IVisionService,
    @Inject(AIRTABLE_SERVICE) private readonly airtableService: IAirtableService,
    @Inject(SLACK_SERVICE) private readonly slackService: ISlackService,
    @Inject(GMAIL_SERVICE) private readonly gmailService: IGmailService
  ) {}

  async processDeliveryReceipt(base64Image: string, forcedDamagedQty?: number) {
    return this.visionService.readDeliveryReceipt(base64Image, forcedDamagedQty);
  }

  calculateATP(poId: string, damagedQty: number) {
    // Deterministic math logic without LLM hallucination
    const orderedQty = 500; // Mock db fetch
    const requiredQty = 480; // Mock customer order need (Tata Motors)
    const survivingQty = orderedQty - damagedQty;
    const shortfallQty = requiredQty - survivingQty;
    
    return {
      orderedQty,
      survivingQty,
      requiredQty,
      shortfallQty: shortfallQty > 0 ? shortfallQty : 0,
      slaBreached: shortfallQty > 0,
      riskLevel: shortfallQty > 0 ? 'RED' : 'GREEN'
    };
  }

  async findBackupSupplier(sku: string, requiredQty: number) {
    return this.airtableService.findAlternateSupplier(sku, requiredQty);
  }

  async raiseEmergencyPO(supplierId: string, sku: string, qty: number, approved: boolean) {
    const poId = `EPO-${Date.now()}`;
    const status = approved ? 'APPROVED' : 'HITL_PENDING';
    
    if (approved) {
      await this.slackService.sendAlert('#procurement', `Emergency PO ${poId} approved for supplier ${supplierId}.`);
      await this.gmailService.sendEmail('vendor@example.com', `New PO ${poId}`, `Please fulfill ${qty} of ${sku}.`);
    }

    return { poId, status };
  }

  async queryERP(vendorName: string, date: string) {
    return this.airtableService.queryErpForPo(vendorName, date);
  }

  async penalizeSupplier(supplierId: string, defectType: string, affectedQty: number) {
    return this.airtableService.logQcFailure(supplierId, defectType, affectedQty);
  }

  generateRmaDocument(poId: string, sku: string, qty: number, reason: string) {
    return {
      rmaId: `RMA-${Date.now()}`,
      poId,
      sku,
      qty,
      reason,
      status: 'ISSUED'
    };
  }
}
