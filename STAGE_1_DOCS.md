# 📦 FlowLogix — Stage 1: Inbound & Receiving

> **Pipeline Stage:** 1 of 6 · **Agents Involved:** Supply Chain Agent + Floor Operations Agent  
> **Tools:** 11 · **Widgets:** 3 · **HITL Gates:** 1

---

## Overview

Stage 1 is the **front door of the warehouse**. Every physical item that enters the facility passes through this stage. FlowLogix uses two specialized sub-agents — activated by the Orchestrator — to handle everything from damaged freight to unannounced truck arrivals.

---

## Agent Routing

```
[Orchestrator Agent]
        │
        ├── route_to_supply_chain ──▶ [Supply Chain Agent]
        │                               UC1: Damaged Freight Dispute & Emergency Sourcing
        │                               UC4: QC Failure & Supplier Penalization
        │
        └── route_to_floor_ops   ──▶ [Floor Operations Agent]
                                        UC2: Inbound Traffic Delay & Dock Re-scheduling
                                        UC3: Blind Receiving (Unannounced Truck Arrival)
```

---

## Use Case 1: Damaged Freight Dispute & Emergency Sourcing

### Scenario
A truck arrives at Dock A2. Worker scans the pallet and finds 50 of 200 brake pads (SKU-BRAKE-PAD-X1) are crushed. A Tata Motors order for 180 units ships in 2 days.

### Execution Flow

```
Worker uploads photo
        │
        ▼
[1] read_delivery_receipt_ocr
    ├── Input:  file_content (base64 photo), forced_damaged_qty (optional)
    ├── Output: { poId, sku, damagedQty: 50, totalQty: 200, damagePercentage: 25% }
    └── Widget: ShipmentIncidentCard renders (damage bar + SLA preview)
        │
        ▼
[2] check_order_impact
    ├── Input:  po_id: "PO-2024-001", damaged_qty: 50
    ├── Math:   survivingQty = 200 - 50 = 150
    │           shortfall    = 180 - 150 = 30 units
    │           slaBreached  = (shortfall > 0) AND (slaDeliveryDays <= 2) = TRUE
    └── Output: { riskLevel: "RED", shortfallQty: 30, financialExposureUsd: 1350, slaBreached: true }
        │
        ▼
[3] find_alternate_supplier
    ├── Input:  sku: "SKU-BRAKE-PAD-X1", required_qty: 30, base_unit_cost_usd: 45
    ├── Logic:  Query mock vendor DB -> rank by reliability DESC, lead_time ASC
    └── Output: { supplier: "Alpha Auto Parts Ltd.", leadTimeDays: 1, canMeetSla: true, estimatedTotal: $1552.50 }
        │
        ▼
[4] raise_emergency_po  <- HITL GATE (approved: false first call)
    ├── Input:  supplier_id, sku, qty: 30, linked_original_po_id, approved: false
    ├── Output: { status: "HITL_PENDING", poId: "EPO-...", hitlMessage: "Awaiting approval" }
    └── Widget: EmergencyPOApproval renders (countdown + [Approve]/[Reject] buttons)
        │
        ├── Manager clicks [APPROVE]
        │       ▼
        │   raise_emergency_po (approved: true)
        │   Output: { status: "APPROVED", slackPayload dispatched to #warehouse-alerts }
        │
        └── Manager clicks [REJECT]
                ▼
            Output: { status: "REJECTED" } -> Escalate to procurement team
```

### Math Formulas

| Formula | Expression |
|---|---|
| Surviving Quantity | `survivingQty = orderedQty - damagedQty` |
| Shortfall | `shortfall = max(0, requiredQty - survivingQty)` |
| SLA Breach | `slaBreached = (shortfall > 0) AND (slaDeliveryDays <= 2)` |
| Financial Exposure | `exposure = shortfallQty x unitCostUsd` |
| Alternate Cost | `altCost = qty x baseUnitCost x supplierPriceMultiplier` |

### Zod Input Schemas

```typescript
// read_delivery_receipt_ocr
z.object({
  file_name: z.string(),
  file_type: z.string(),
  file_content: z.string(),            // base64
  forced_damaged_qty: z.number().int().positive().optional()
})

// check_order_impact
z.object({
  po_id: z.string(),                   // e.g. "PO-2024-001"
  damaged_qty: z.number().int().min(0)
})

// find_alternate_supplier
z.object({
  sku: z.string(),
  required_qty: z.number().int().positive(),
  base_unit_cost_usd: z.number().positive()
})

// raise_emergency_po
z.object({
  supplier_id: z.string(),
  sku: z.string(),
  qty: z.number().int().positive(),
  linked_original_po_id: z.string(),
  estimated_total_cost_usd: z.number().positive(),
  approved: z.boolean()               // false = HITL_PENDING, true = APPROVED
})
```

---

## Use Case 2: Inbound Traffic Delay & Dock Re-scheduling

### Scenario
GPS telemetry detects that truck TRK-DELAY-001 (Apex Auto Parts, PO-2024-001) is stuck in traffic. It will miss its 09:30 slot at Dock A2 by 75 minutes. Workers Rajesh and Priya are standing idle.

### Execution Flow

```
GPS alert fires
        │
        ▼
[1] check_inbound_delays
    ├── Input:  truck_id: "TRK-DELAY-001", delay_minutes: 75
    ├── Logic:  newEta = scheduledArrival + 75min
    └── Output: { truckId, originalArrival: "09:30", newEta: "10:45", currentDoorId: "DOCK-A2" }
        │
        ▼
[2] reschedule_dock_slot
    ├── Input:  truck_id, delay_minutes: 75
    ├── Logic:  Scan doors -> DOCK-B2 available -> assign truck -> release DOCK-A2
    ├── Output: { newDoorId: "DOCK-B2", newScheduledArrival: "10:45", affectedWorkers: ["WRK-001","WRK-002"] }
    └── Widget: DockScheduleTracker renders (before/after timeline + worker tab)
        │
        ▼
[3] reassign_dock_workers
    ├── Input:  original_dock_id: "DOCK-A2"
    ├── Logic:  Filter workers at DOCK-A2 -> check PICKING certification -> reassign
    └── Output: { reassigned: [{WRK-001: RECEIVING->PICKING}, {WRK-002: RECEIVING->PICKING}], idleNow: [] }
```

### Zod Input Schemas

```typescript
// check_inbound_delays
z.object({
  truck_id: z.string(),
  delay_minutes: z.number().int().min(1)
})

// reschedule_dock_slot
z.object({
  truck_id: z.string(),
  delay_minutes: z.number().int().min(1)
})

// reassign_dock_workers
z.object({
  original_dock_id: z.string()        // e.g. "DOCK-A2"
})
```

---

## Use Case 3: Blind Receiving (Unannounced Truck Arrival)

### Scenario
A truck pulls into the yard without any Advance Shipment Notice (ASN). The gate guard has the driver's license plate (KA-05-EF-9012) and vendor name (Nova Freight).

### Execution Flow

```
Gate guard reports unknown truck
        │
        ▼
[1] query_erp_for_po
    ├── Input:  license_plate: "KA-05-EF-9012", vendor_name: "Nova Freight"
    ├── Logic:  Exact plate match -> PO-2024-004 found (confidence: 0.99)
    │           Fallback: fuzzy vendor name match (confidence: 0.75)
    └── Output: { found: true, matchedBy: "LICENSE_PLATE", poRecord: {...}, confidence: 0.99 }
        │
        ▼
[2] create_emergency_dock_slot
    ├── Input:  vendor_name: "Nova Freight"
    ├── Logic:  Assign overflow door DOCK-B99 — hold truck, DO NOT unload
    └── Output: { doorId: "DOCK-B99", instruction: "Do NOT unload until PO confirmed." }
```

### Zod Input Schemas

```typescript
// query_erp_for_po
z.object({
  license_plate: z.string(),          // e.g. "KA-05-EF-9012"
  vendor_name: z.string()
})

// create_emergency_dock_slot
z.object({
  vendor_name: z.string()
})
```

---

## Use Case 4: Quality Control Failure & Supplier Penalization

### Scenario
100 Engine Gaskets (SKU-ENGINE-GASKET-V2) arrive intact but fail QC — wrong grade (Grade B delivered, Grade A ordered). Supplier Delta Components' reliability score must be penalized and goods returned.

### Execution Flow

```
QC inspector flags failure
        │
        ▼
[1] log_qc_failure
    ├── Input:  item_id: "SKU-ENGINE-GASKET-V2", defect_type: "Wrong spec — Grade B, expected Grade A", affected_qty: 100
    ├── Math:   penaltyApplied = (1 - 0.01)^min(100, 30) = 0.99^30 = 0.7397
    │           newScore = 0.78 x 0.7397 = 0.5770
    └── Output: { previousScore: 0.78, newScore: 0.5772, supplierId: "SUPP-DELTA-002" }

    NOTE: Orchestrator should confirm with manager before calling — penalization is irreversible.
        │
        ▼
[2] generate_rma_document
    ├── Input:  po_id: "PO-2024-002", item_id: "SKU-ENGINE-GASKET-V2", qty: 100, reason: "QC Failure..."
    └── Output: { rmaId: "RMA-...", returnInstruction: "Affix label. Ship to Supplier Returns Dock C within 48h.", estimatedCreditUsd: 1250 }
```

### Supplier Penalty Formula

```
penaltyMultiplier = (1 - penaltyRate)^min(affectedQty, 30)
  where penaltyRate = 0.01 per unit
        cap         = 30 units (prevents one event from zeroing out a supplier)

newScore = currentScore x penaltyMultiplier

Example: 100 damaged -> capped at 30 -> 0.99^30 = 0.7397
         0.78 x 0.7397 = 0.5770  (dropped from 0.78 to 0.58)
```

### Zod Input Schemas

```typescript
// log_qc_failure
z.object({
  item_id: z.string(),
  defect_type: z.string(),
  affected_qty: z.number().int().positive()
})

// generate_rma_document
z.object({
  po_id: z.string(),
  item_id: z.string(),
  qty: z.number().int().positive(),
  reason: z.string()
})
```

---

## Widgets Reference

### 1. ShipmentIncidentCard (/shipment-incident-card)

| Property | Value |
|---|---|
| Bound Tool | `read_delivery_receipt_ocr` |
| Data Hook | `getToolOutput<ShipmentIncidentData>()` |
| State | `expanded: boolean` toggles ATP risk section |
| Action Buttons | "Source Replacement Stock" and "Log QC" via `sendFollowUpMessage` |
| Risk Colors | RED = #ef4444, AMBER = #f59e0b, GREEN = #10b981 |

### 2. EmergencyPOApproval (/emergency-po-approval)

| Property | Value |
|---|---|
| Bound Tool | `raise_emergency_po` |
| Data Hook | `getToolOutput<EmergencyPoData>()` |
| HITL Approve | `callTool('raise_emergency_po', { ...data, approved: true })` |
| HITL Reject | `callTool('raise_emergency_po', { ...data, approved: false })` |
| Countdown | Live SLA timer counting down to `estimatedDeliveryDate` |
| Lock State | Buttons disabled once `APPROVED` or `REJECTED` |

### 3. DockScheduleTracker (/dock-schedule-tracker)

| Property | Value |
|---|---|
| Bound Tool | `reschedule_dock_slot` |
| Data Hook | `getToolOutput<DockRescheduleData>()` |
| Tabs | Timeline (before/after slot) + Workers (reassignment list) |
| Slot States | ORIGINAL (grey), NEW SLOT (green), ACTIVE (amber) |
| Action | "Reassign All Dock Workers" via `sendFollowUpMessage` |

---

## File Structure

```
src/
├── modules/
│   ├── supply-chain/
│   │   ├── supply-chain.module.ts           Supply Chain Agent NitroStack module
│   │   ├── supply-chain-inbound.tools.ts    6 @Tool definitions (UC1 + UC4)
│   │   └── services/
│   │       ├── inbound.service.ts           ATP math, OCR mock, QC scoring, RMA
│   │       └── supplier.service.ts          Vendor DB, PO creation, Slack payload
│   └── floor-ops/
│       ├── floor-ops.module.ts              Floor Ops Agent NitroStack module
│       ├── floor-ops-inbound.tools.ts       5 @Tool definitions (UC2 + UC3)
│       └── services/
│           └── dock.service.ts              Dock scheduling, ERP lookup, worker shifts
└── widgets/app/
    ├── shipment-incident-card/page.tsx      UC1 damage summary widget
    ├── emergency-po-approval/page.tsx       UC1 HITL approval gate widget
    └── dock-schedule-tracker/page.tsx       UC2 dock timeline widget
```

---

## Core Design Principles Applied

| Principle | How It Is Applied in Stage 1 |
|---|---|
| No LLM Math | ATP math, penalty formula, and dock time calculations are all TypeScript — never delegated to the LLM |
| Strict Zod Guardrails | Every tool has a strict z.object schema — invalid types are rejected before execution |
| Human-in-the-Loop | raise_emergency_po always starts as HITL_PENDING — the EmergencyPOApproval widget is the mandatory gate before money is spent |
| Hierarchical Routing | Orchestrator wakes only the needed sub-agent — supplier delay = Supply Chain Agent only; dock issue = Floor Ops Agent only |

---

*Generated by FlowLogix · Agentic AI Hackathon 2026 · Manufacturing & Industry 4.0 Track*
