// utils/ratePlanDuplicates.ts
type HotelRate = {
  hotelRatePlanID: number;
  rateDate: string; // "YYYY-MM-DD"
  defaultRate: number | null;
  child: number | null;
  pax1?: number | null;
  pax2?: number | null;
  pax3?: number | null;
  pax4?: number | null;
  pax5?: number | null;
  pax6?: number | null;
  pax7?: number | null;
  pax8?: number | null;
  pax9?: number | null;
  pax10?: number | null;
  pax11?: number | null;
  pax12?: number | null;
  pax13?: number | null;
  pax14?: number | null;
  pax15?: number | null;
  pax16?: number | null;
  pax17?: number | null;
  pax18?: number | null;
  sellMode?: string | null;
  rateMode?: string | null;
};

const FIELDS = [
  "defaultRate",
  "child",
  "pax1",
  "pax2",
  "pax3",
  "pax4",
  "pax5",
  "pax6",
  "pax7",
  "pax8",
  "pax9",
  "pax10",
  "pax11",
  "pax12",
  "pax13",
  "pax14",
  "pax15",
  "pax16",
  "pax17",
  "pax18",
  "sellMode",
  "rateMode",
] as const;

function daySignature(r: HotelRate) {
  const o: any = {};
  for (const k of FIELDS) o[k] = (r as any)[k] ?? null;
  return JSON.stringify(o);
}

function buildPlanMatrix(hotelRates: HotelRate[]) {
  // planId -> date -> sig
  const matrix = new Map<number, Map<string, string>>();
  for (const r of hotelRates) {
    if (!matrix.has(r.hotelRatePlanID))
      matrix.set(r.hotelRatePlanID, new Map());
    matrix.get(r.hotelRatePlanID)!.set(r.rateDate, daySignature(r));
  }
  return matrix;
}

/**
 * Groups plan IDs that are exact duplicates over the given [from, to] period.
 * "Duplicate" = every date in the period exists for both plans AND the signatures match per day.
 */
export function findDuplicatePlanGroups(
  hotelRates: HotelRate[],
  fromISO: string, // "2025-08-01"
  toISO: string // "2025-08-30"
) {
  const inRange = hotelRates.filter(
    (r) => r.rateDate >= fromISO && r.rateDate <= toISO
  );
  const matrix = buildPlanMatrix(inRange);

  // Build an ordered date list
  const dates = Array.from(new Set(inRange.map((r) => r.rateDate))).sort();

  // Compute a long signature per plan across the date window
  const planLongSig = new Map<number, string>();
  for (const [planId, dateMap] of matrix) {
    // if a day is missing, we keep "~" so it won't match a full plan
    const seq = dates
      .map((d) => (dateMap.has(d) ? dateMap.get(d)! : "~"))
      .join("|");
    planLongSig.set(planId, seq);
  }

  // Group by signature
  const buckets = new Map<string, number[]>();
  for (const [planId, sig] of planLongSig) {
    if (!buckets.has(sig)) buckets.set(sig, []);
    buckets.get(sig)!.push(planId);
  }

  // Only groups with >1 are duplicates
  const duplicateGroups = Array.from(buckets.values()).filter(
    (g) => g.length > 1
  );
  return { dates, duplicateGroups };
}
