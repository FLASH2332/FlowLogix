import { ToolDecorator as Tool, Widget, ExecutionContext, z, ControllerDecorator as Controller } from '@nitrostack/core';
import { InboundService } from './services/inbound.service.js';

@Controller()
export class SupplyChainInboundTools {
  constructor(private readonly inboundService: InboundService) {}

  @Tool({
    name: 'read_delivery_receipt_ocr',
    description: 'Analyzes a photo of a damaged freight delivery using OCR to extract PO ID and damage counts.',
    inputSchema: z.object({
      file_content: z.string().describe('Base64 image of the delivery photo'),
      forced_damaged_qty: z.number().optional().describe('Override OCR damage count')
    })
  })
  @Widget('shipment-incident-card')
  async readDeliveryReceiptOcr(input: { file_content: string; forced_damaged_qty?: number }, ctx: ExecutionContext) {
    ctx.logger.info('OCR reading delivery receipt...');
    return this.inboundService.processDeliveryReceipt(input.file_content, input.forced_damaged_qty);
  }

  @Tool({
    name: 'check_order_impact',
    description: 'Calculates ATP math to determine SLA breach risk on a customer order due to damaged freight.',
    inputSchema: z.object({
      po_id: z.string(),
      damaged_qty: z.number()
    })
  })
  async checkOrderImpact(input: { po_id: string; damaged_qty: number }, ctx: ExecutionContext) {
    ctx.logger.info('Calculating ATP order impact...');
    return this.inboundService.calculateATP(input.po_id, input.damaged_qty);
  }

  @Tool({
    name: 'find_alternate_supplier',
    description: 'Searches Airtable for a backup vendor for a given SKU.',
    inputSchema: z.object({
      sku: z.string(),
      required_qty: z.number()
    })
  })
  async findAlternateSupplier(input: { sku: string; required_qty: number }, ctx: ExecutionContext) {
    return this.inboundService.findBackupSupplier(input.sku, input.required_qty);
  }

  @Tool({
    name: 'raise_emergency_po',
    description: 'Creates a PO. Set approved=false for HITL review. Set approved=true to send Slack/Gmail alerts.',
    inputSchema: z.object({
      supplier_id: z.string(),
      sku: z.string(),
      qty: z.number(),
      approved: z.boolean()
    })
  })
  @Widget('emergency-po-approval')
  async raiseEmergencyPo(input: { supplier_id: string; sku: string; qty: number; approved: boolean }, ctx: ExecutionContext) {
    return this.inboundService.raiseEmergencyPO(input.supplier_id, input.sku, input.qty, input.approved);
  }

  @Tool({
    name: 'log_qc_failure',
    description: 'Logs QC failure and penalizes supplier reliability score in Airtable.',
    inputSchema: z.object({
      supplier_id: z.string(),
      defect_type: z.string(),
      affected_qty: z.number()
    })
  })
  async logQcFailure(input: { supplier_id: string; defect_type: string; affected_qty: number }, ctx: ExecutionContext) {
    return this.inboundService.penalizeSupplier(input.supplier_id, input.defect_type, input.affected_qty);
  }

  @Tool({
    name: 'generate_rma_document',
    description: 'Generates an RMA document for returning non-conforming goods.',
    inputSchema: z.object({
      po_id: z.string(),
      sku: z.string(),
      qty: z.number(),
      reason: z.string()
    })
  })
  async generateRmaDocument(input: { po_id: string; sku: string; qty: number; reason: string }, ctx: ExecutionContext) {
    return this.inboundService.generateRmaDocument(input.po_id, input.sku, input.qty, input.reason);
  }
}
