// utils/buildNightAuditPayload.ts

export type TaxRow = {
  recordId: number;
  hotelId: number;
  taxName: string;
  percentage: number;
  calcBasedOn: "Base" | "Subtotal1" | "Subtotal2" | "Subtotal3" | "Subtotal4";
  accountId?: number | null; // tax GL to credit
  taxCode?: string | null; // optional (e.g., CITYTA, GST, SERVIC)
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
  mealPlan?: string;
  roomRate?: number; // tax-incl
  netRate?: number; // tax-incl
  currencyCode?: string;
  adult?: number;
  child?: number;
  isFOC?: boolean;
  roomType?: string;
  // optional memo helpers if you have them
  roomNumber?: string;
  guestName?: string;
};

const TAX_ORDER: Array<TaxRow["calcBasedOn"]> = [
  "Base",
  "Subtotal1",
  "Subtotal2",
  "Subtotal3",
  "Subtotal4",
];

// Optional meal GLs (only used if includeMealAlloc=true)
const MEAL_ACCOUNTS = { B: 21, L: 23, D: 22, AI: 24 } as const;

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

function inclToBase(inclusive: number, taxes: TaxRow[]) {
  if (!inclusive) return 0;
  const factor = buildGrossFactorFromTaxes(taxes);
  return factor > 0 ? inclusive / factor : inclusive;
}

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

type BuildParams = {
  // audit inputs
  rateChecks: RateCheckRow[];
  hotelTaxes: TaxRow[];
  mealAllocation: MealAllocationCfg;
  mealPlans: MealPlanRow[];
  roomTypes: RoomTypeRow[];

  // posting context
  tranDateISO: string; // posting date for audit (e.g., system date at hotel TZ)
  createdOnISO: string; // now
  hotelCode: string; // e.g., "1017"
  propertyID: number; // e.g., 17
  currencyCode: string; // e.g., "USD"
  guestLedgerAccountId: number; // DR control
  defaultRoomRevenueAccountId: number; // CR fallback

  // behavior
  includeMealAlloc?: boolean; // default false (your example didn't split meals)

  // helper to map roomType -> GL
  resolveRoomTypeAccountId?: (rc: RateCheckRow) => number | undefined;
};

export type NightAuditPostChargesPayload = {
  glAccTransactions: any[];
  finAct: boolean;
  hotelCode: string;
  tranTypeId: number;
  tranDate: string;
  createdOn: string;
  createdBy: string;
  posted: boolean;
  tranValue: number;
  vatValue: number;
  currencyCode: string;
  isTaxInclusive: boolean;
  status: string;
  remarks: string;
  dueDate: string;
  refNo: string;
  refInvNo: string;
  isGuestLedger: boolean;
  effectiveDate: string;
  reservationDetailId: number;
  reservationId: number;
  grossTotal: number;
};

/**
 * Returns ONE payload per reservationDetailId, shaped exactly like your "Post Charges" example.
 * Lines:
 *  - DR Guest Ledger (gross)
 *  - CR Room Revenue (base net of meals if includeMealAlloc=false, base-minus-meals if true)
 *  - CR Tax for each tax GL from the ladder
 * Optionally:
 *  - CR Meals (Breakfast/Lunch/Dinner/AI) if includeMealAlloc = true
 */
export function buildNightAuditPayloads(
  params: BuildParams
): NightAuditPostChargesPayload[] {
  const {
    rateChecks,
    hotelTaxes,
    mealAllocation,
    mealPlans,
    roomTypes,
    tranDateISO,
    createdOnISO,
    hotelCode,
    propertyID,
    currencyCode,
    guestLedgerAccountId,
    defaultRoomRevenueAccountId,
    includeMealAlloc = false,
    resolveRoomTypeAccountId,
  } = params;

  // roomType -> GL
  const roomTypeToAcc = new Map<string, number>();
  for (const rt of roomTypes) {
    if (rt.roomType && rt.glAccountId) {
      roomTypeToAcc.set(rt.roomType.toLowerCase(), Number(rt.glAccountId));
    }
  }

  // group by reservationDetailId
  const byRD = new Map<number, RateCheckRow[]>();
  for (const rc of rateChecks) {
    if (rc.isFOC) continue;
    const gross = Number(rc.netRate ?? rc.roomRate ?? 0);
    if (!gross) continue;
    const key = rc.reservationDetailId;
    if (!byRD.has(key)) byRD.set(key, []);
    byRD.get(key)!.push(rc);
  }

  const mkBase = (rd: RateCheckRow, overrides: Partial<any> = {}) => ({
    finAct: false,
    accountID: 0,
    amount: 0,
    currAmount: 0,
    amtInCurr: 0,
    debit: 0,
    credit: 0,
    currDebit: 0,
    currCredit: 0,
    comment: "",
    createdOn: createdOnISO,
    createdBy: "System",
    tranTypeID: 2,
    refAccountID: 0,
    itemID: 0,
    siteID: 0,
    memo: "",
    tranDate: tranDateISO,
    dueDate: tranDateISO,
    chequeDate: createdOnISO,
    chequePrinted: false,
    paymentVoucherNo: "",
    offSetAccID: 0,
    chequeNo: "",
    supplierInvoNo: "",
    taxCode: "",
    costCenterID: 0,
    billRef: "",
    paymentReceiptRef: "",
    reconciled: 0,
    recDate: createdOnISO,
    propertyID,
    recMasID: 0,
    batchID: 0,
    active: true,
    collectionScheduledOn: createdOnISO,
    isDue: false,
    isArrears: false,
    isEarlySettlement: false,
    batchNo: 0,
    split: "",
    narration: "",
    effectiveDate: createdOnISO,
    currencyCode,
    tranDetailID: 0,
    pumpID: 0,
    currCode: currencyCode,
    convRate: "1",
    cardType: "",
    reservationDetailID: rd.reservationDetailId,
    ...overrides,
  });

  const mkDebit = (base: any, val: number) => {
    const v = r2(val);
    return {
      ...base,
      amount: v,
      currAmount: v,
      amtInCurr: v,
      debit: v,
      currDebit: v,
      credit: 0,
      currCredit: 0,
    };
  };

  const mkCredit = (base: any, val: number) => {
    const v = r2(val);
    return {
      ...base,
      amount: -v,
      currAmount: -v,
      amtInCurr: -v,
      debit: 0,
      currDebit: 0,
      credit: v,
      currCredit: v,
    };
  };

  const payloads: NightAuditPostChargesPayload[] = [];

  for (const [rdId, rows] of byRD.entries()) {
    let grossTotal = 0;
    let baseTotalForRevenue = 0;

    let totalB = 0,
      totalL = 0,
      totalD = 0,
      totalAI = 0; // only used if includeMealAlloc

    const taxTotalsByAcc = new Map<number, number>();
    const revenueByAcc = new Map<number, number>();

    const sample = rows[0];
    const rd = sample.reservationDetailId;
    const roomNo = sample.roomNumber || "";
    const guest = sample.guestName || "";
    const resId = sample.reservationId;

    for (const rc of rows) {
      const gross = Number(rc.netRate ?? rc.roomRate ?? 0);
      if (!gross) continue;
      grossTotal += gross;

      const baseInclMeals = inclToBase(gross, hotelTaxes);

      // (optional) meal allocation
      const mealAlloc = calcMealAllocationForRow(rc, mealPlans, mealAllocation);
      const roomBase = includeMealAlloc
        ? Math.max(0, baseInclMeals - mealAlloc.total)
        : baseInclMeals;

      baseTotalForRevenue += roomBase;

      if (includeMealAlloc) {
        if (mealAlloc.breakdown.ai > 0) totalAI += mealAlloc.breakdown.ai;
        else {
          totalB += mealAlloc.breakdown.b;
          totalL += mealAlloc.breakdown.l;
          totalD += mealAlloc.breakdown.d;
        }
      }

      // ladder taxes from baseInclMeals
      let running = baseInclMeals;
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

      // revenue GL mapping
      let revAcc: number | undefined;
      if (resolveRoomTypeAccountId) revAcc = resolveRoomTypeAccountId(rc);
      if (!revAcc && rc.roomType) {
        revAcc = roomTypeToAcc.get(rc.roomType.toLowerCase());
      }
      revAcc ||= defaultRoomRevenueAccountId;
      if (revAcc) {
        revenueByAcc.set(revAcc, (revenueByAcc.get(revAcc) ?? 0) + roomBase);
      }
    }

    grossTotal = r2(grossTotal);
    baseTotalForRevenue = r2(baseTotalForRevenue);

    const lines: any[] = [];

    // DR Guest Ledger (gross)
    if (grossTotal > 0) {
      lines.push(
        mkDebit(
          mkBase(sample, {
            accountID: guestLedgerAccountId,
            comment: "Post Charges (Guest Ledger)",
            memo: `Night Audit • Guest Ledger • RD:${rd} • Room:${roomNo} • ${guest} `,
          }),
          grossTotal
        )
      );
    }

    // CR Room Revenue (per account)
    for (const [acc, amt] of revenueByAcc.entries()) {
      const v = r2(amt);
      if (v <= 0) continue;
      lines.push(
        mkCredit(
          mkBase(sample, {
            accountID: acc,
            comment: "Post Charges (Revenue)",
            memo: `Night Audit • Revenue • RD:${rd} • Room:${roomNo} • ${guest} `,
          }),
          v
        )
      );
    }

    // (optional) CR Meals
    if (includeMealAlloc) {
      const pushMeal = (acc: number, name: string, v: number) => {
        const val = r2(v);
        if (val <= 0) return;
        lines.push(
          mkCredit(
            mkBase(sample, {
              accountID: acc,
              comment: `Post Charges (${name})`,
              memo: `Night Audit • ${name} • RD:${rd} • Room:${roomNo} • ${guest} `,
              taxCode: "",
              narration: name,
            }),
            val
          )
        );
      };
      pushMeal(MEAL_ACCOUNTS.B, "BREAKFAST", totalB);
      pushMeal(MEAL_ACCOUNTS.L, "LUNCH", totalL);
      pushMeal(MEAL_ACCOUNTS.D, "DINNER", totalD);
      pushMeal(MEAL_ACCOUNTS.AI, "ALL INCLUSIVE", totalAI);
    }

    // CR Taxes per account
    for (const [acc, amt] of taxTotalsByAcc.entries()) {
      const v = r2(amt);
      if (v <= 0) continue;

      const t = hotelTaxes.find((x) => Number(x.accountId || 0) === acc);
      const name = t?.taxName || "TAX";
      const code = (t?.taxCode || "").toString();

      lines.push(
        mkCredit(
          mkBase(sample, {
            accountID: acc,
            comment: `Post Charges (${name})`,
            memo: `Night Audit • ${name} • RD:${rd} • Room:${roomNo} • ${guest} `,
            taxCode: code,
            narration: name,
          }),
          v
        )
      );
    }

    // envelope
    const remarks = `Night Audit • RD:${rd} • Room:${roomNo} • ${guest} `;
    const refNo = `CHG-${hotelCode}-${rd}-${createdOnISO
      .slice(0, 10)
      .replace(/-/g, "")}`;

    const payload: NightAuditPostChargesPayload = {
      glAccTransactions: lines,
      finAct: false,
      hotelCode,
      tranTypeId: 2,
      tranDate: tranDateISO,
      createdOn: createdOnISO,
      createdBy: "System",
      posted: false,
      tranValue: grossTotal,
      vatValue: 0,
      currencyCode,
      isTaxInclusive: true, // rateChecks are tax-incl; we split base/tax
      status: "Active",
      remarks,
      dueDate: tranDateISO,
      refNo,
      refInvNo: "",
      isGuestLedger: true,
      effectiveDate: createdOnISO,
      reservationDetailId: rdId,
      reservationId: sample.reservationId,
      grossTotal: grossTotal,
    };

    payloads.push(payload);
  }

  return payloads;
}
