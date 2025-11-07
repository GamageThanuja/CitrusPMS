// utils/buildNightAuditGl.ts
export type TaxRow = {
  recordId: number;
  hotelId: number;
  taxName: string;
  percentage: number;
  calcBasedOn: "Base" | "Subtotal1" | "Subtotal2" | "Subtotal3" | "Subtotal4";
  accountId?: number | null;
};

export type MealAllocationCfg = {
  breakfast?: number;
  lunch?: number;
  dinner?: number;
  ai?: number;
  currencyCode?: string;
};

export type MealPlanRow = {
  mealPlanID: number;
  mealPlan: string;
  breakFast: boolean;
  lunch: boolean;
  dinner: boolean;
  ai: boolean;
  shortCode: string;
};

export type RoomTypeRow = {
  hotelRoomTypeID: number;
  roomType: string;
  glAccountId?: number;
};

export type RateCheckRow = {
  recordId: number;
  reservationId: number;
  reservationDetailId: number;
  rateDate: string; // ISO
  mealPlan?: string; // e.g. "FB" | "AI" | "BB" | name
  roomRate?: number; // tax-incl
  netRate?: number; // tax-incl (often same)
  currencyCode?: string;
  adult?: number;
  child?: number;
  isFOC?: boolean;
  roomType?: string; // OPTIONAL: if present, we can map GL directly
};

const MEAL_ACCOUNTS = { B: 21, L: 23, D: 22, AI: 24 } as const;
const TAX_ORDER: Array<TaxRow["calcBasedOn"]> = [
  "Base",
  "Subtotal1",
  "Subtotal2",
  "Subtotal3",
  "Subtotal4",
];

const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

function resolveMealPlan(mealPlans: MealPlanRow[], codeOrName?: string) {
  if (!codeOrName) return undefined;
  const key = codeOrName.trim().toLowerCase();
  return (
    mealPlans.find(
      (m) =>
        m.shortCode?.toLowerCase() === key || m.mealPlan?.toLowerCase() === key
    ) ?? mealPlans.find((m) => m.mealPlan?.toLowerCase() === key)
  );
}

function buildGrossFactorFromTaxes(taxes: TaxRow[]) {
  const layerPct = new Map<TaxRow["calcBasedOn"], number>();
  for (const t of taxes) {
    const prev = layerPct.get(t.calcBasedOn) ?? 0;
    layerPct.set(t.calcBasedOn, prev + (Number(t.percentage) || 0));
  }
  let factor = 1;
  for (const layer of TAX_ORDER) {
    const pct = layerPct.get(layer);
    if (!pct) continue;
    factor *= 1 + pct / 100;
  }
  return factor;
}

/** Convert tax-inclusive into tax-exclusive base using the ladder. */
function inclToBase(inclusive: number, taxes: TaxRow[]) {
  if (!inclusive) return 0;
  const factor = buildGrossFactorFromTaxes(taxes);
  return factor > 0 ? inclusive / factor : inclusive;
}

/** Per-record meal allocation = per-person * (Adults + Children/2) */
function calcMealAllocationForRow(
  rc: RateCheckRow,
  plans: MealPlanRow[],
  alloc: MealAllocationCfg
) {
  const A = Number(rc.adult ?? 0);
  const C = Number(rc.child ?? 0);
  const persons = A + C / 2;

  const mp = resolveMealPlan(plans, rc.mealPlan);
  const isAI = !!mp?.ai;
  const hasB = !!mp?.breakFast;
  const hasL = !!mp?.lunch;
  const hasD = !!mp?.dinner;

  const b = hasB ? (alloc.breakfast ?? 0) * persons : 0;
  const l = hasL ? (alloc.lunch ?? 0) * persons : 0;
  const d = hasD ? (alloc.dinner ?? 0) * persons : 0;
  const ai = isAI ? (alloc.ai ?? 0) * persons : 0;

  return {
    total: isAI ? ai : b + l + d,
    breakdown: { b, l, d, ai },
  };
}

export function buildNightAuditGl(params: {
  rateChecks: RateCheckRow[];
  hotelTaxes: TaxRow[]; // must include accountId
  mealAllocation: MealAllocationCfg;
  mealPlans: MealPlanRow[];
  roomTypes: RoomTypeRow[];
  tranDateISO: string;
  currencyCode?: string;
  guestLedgerAccountId: number; // debit
  defaultRoomRevenueAccountId?: number; // fallback for room revenue
  // Optional resolver if rateChecks do not carry roomType name:
  resolveRoomTypeAccountId?: (rc: RateCheckRow) => number | undefined;
}) {
  const {
    rateChecks,
    hotelTaxes,
    mealAllocation,
    mealPlans,
    roomTypes,
    tranDateISO,
    currencyCode,
    guestLedgerAccountId,
    defaultRoomRevenueAccountId = 0,
    resolveRoomTypeAccountId,
  } = params;

  // roomTypeName -> GL account
  const roomTypeToAcc = new Map<string, number>();
  for (const rt of roomTypes) {
    if (rt.roomType && rt.glAccountId) {
      roomTypeToAcc.set(rt.roomType.toLowerCase(), Number(rt.glAccountId));
    }
  }

  // Totals
  const roomRevenueByAcc = new Map<number, number>();
  const taxTotalsByAcc = new Map<number, number>();
  let totalB = 0,
    totalL = 0,
    totalD = 0,
    totalAI = 0;

  for (const rc of rateChecks) {
    if (rc.isFOC) continue;

    const gross = Number(rc.netRate ?? rc.roomRate ?? 0);
    if (!gross) continue;

    // base (tax-exclusive)
    const base = inclToBase(gross, hotelTaxes);

    // meal allocation
    const { total: mealTotal, breakdown } = calcMealAllocationForRow(
      rc,
      mealPlans,
      mealAllocation
    );
    const roomBase = Math.max(0, base - mealTotal);

    // compute tax amounts per ladder layer (proportional split by percentage)
    let running = base;
    for (const layer of TAX_ORDER) {
      const inLayer = hotelTaxes.filter((t) => t.calcBasedOn === layer);
      if (!inLayer.length) continue;

      const sumPct = inLayer.reduce(
        (s, t) => s + (Number(t.percentage) || 0),
        0
      );
      const layerAmt = (sumPct / 100) * running;

      for (const t of inLayer) {
        const acc = Number(t.accountId || 0);
        if (!acc) continue;
        const share =
          sumPct > 0 ? (Number(t.percentage) / sumPct) * layerAmt : 0;
        taxTotalsByAcc.set(acc, (taxTotalsByAcc.get(acc) ?? 0) + share);
      }
      running += layerAmt;
    }

    // add meals
    if (breakdown.ai > 0) totalAI += breakdown.ai;
    else {
      totalB += breakdown.b;
      totalL += breakdown.l;
      totalD += breakdown.d;
    }

    // room revenue → room type GL
    let roomAcc: number | undefined;
    if (resolveRoomTypeAccountId) roomAcc = resolveRoomTypeAccountId(rc);
    if (!roomAcc && rc.roomType) {
      roomAcc = roomTypeToAcc.get(rc.roomType.toLowerCase());
    }
    roomAcc ||= defaultRoomRevenueAccountId;

    if (roomAcc) {
      roomRevenueByAcc.set(
        roomAcc,
        (roomRevenueByAcc.get(roomAcc) ?? 0) + roomBase
      );
    }
  }

  // Build lines
  const lines: Array<{
    accountID: number;
    debit?: number;
    credit?: number;
    memo?: string;
  }> = [];

  // Room revenue (credit) per room-type account
  for (const [acc, amt] of roomRevenueByAcc.entries()) {
    const v = r2(amt);
    if (v <= 0) continue;
    lines.push({
      accountID: acc,
      credit: v,
      memo: "Room Revenue (tax-excl) · Night Audit",
    });
  }

  // Taxes (credit) per tax account
  for (const [acc, amt] of taxTotalsByAcc.entries()) {
    const v = r2(amt);
    if (v <= 0) continue;
    lines.push({
      accountID: acc,
      credit: v,
      memo: "Taxes · Night Audit",
    });
  }

  // Meal allocations (credit)
  if (r2(totalB) > 0)
    lines.push({
      accountID: MEAL_ACCOUNTS.B,
      credit: r2(totalB),
      memo: "Meal Allocation · Breakfast",
    });
  if (r2(totalL) > 0)
    lines.push({
      accountID: MEAL_ACCOUNTS.L,
      credit: r2(totalL),
      memo: "Meal Allocation · Lunch",
    });
  if (r2(totalD) > 0)
    lines.push({
      accountID: MEAL_ACCOUNTS.D,
      credit: r2(totalD),
      memo: "Meal Allocation · Dinner",
    });
  if (r2(totalAI) > 0)
    lines.push({
      accountID: MEAL_ACCOUNTS.AI,
      credit: r2(totalAI),
      memo: "Meal Allocation · All Inclusive",
    });

  // Balancing debit → Guest Ledger
  const totalCredits = r2(
    lines.reduce((s, l) => s + (Number(l.credit) || 0), 0)
  );
  if (totalCredits > 0) {
    lines.push({
      accountID: guestLedgerAccountId,
      debit: totalCredits,
      memo: "Guest Ledger · Night Audit",
    });
  }

  return {
    header: {
      tranTypeId: 2, // 🔒 as requested: ALL tranType = 2
      tranDate: tranDateISO,
      currencyCode: currencyCode,
    },
    glAccTransactions: lines,
  };
}
