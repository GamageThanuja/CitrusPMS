// utils/blockDuplicateCreate.ts
import { findDuplicatePlanGroups } from "./ratePlanDuplicates";

type NewPlanDay = {
  rateDate: string; // "YYYY-MM-DD"
  defaultRate: number | null;
  child: number | null;
  pax1?: number | null;
  pax2?: number | null;
  pax3?: number | null;
  // ... same shape as HotelRate relevant fields
};

export function willDuplicateExistingPlan(
  existingHotelRates: any[], // same items as payload.data[0].hotelRates
  newPlanDays: NewPlanDay[], // the schedule you're about to POST (for the same room type)
  fromISO: string,
  toISO: string
) {
  // Build a temporary "existing + candidate" list with a fake negative ID for the new plan
  const candidatePlanId = -1;
  const candidateRates = newPlanDays.map((d) => ({
    hotelRatePlanID: candidatePlanId,
    rateDate: d.rateDate,
    defaultRate: d.defaultRate,
    child: d.child,
    pax1: d.pax1 ?? null,
    pax2: d.pax2 ?? null,
    pax3: d.pax3 ?? null,
    pax4: null,
    pax5: null,
    pax6: null,
    pax7: null,
    pax8: null,
    pax9: null,
    pax10: null,
    pax11: null,
    pax12: null,
    pax13: null,
    pax14: null,
    pax15: null,
    pax16: null,
    pax17: null,
    pax18: null,
    sellMode: null,
    rateMode: null,
  }));

  const merged = [...existingHotelRates, ...candidateRates];
  const { duplicateGroups } = findDuplicatePlanGroups(merged, fromISO, toISO);

  // If any group contains our candidate (-1) and at least one real plan id, it's a duplicate
  const dupAgainst = duplicateGroups.find(
    (g) => g.includes(candidatePlanId) && g.some((id) => id !== candidatePlanId)
  );
  const duplicateOfPlanIds =
    dupAgainst?.filter((id) => id !== candidatePlanId) ?? [];
  return { isDuplicate: duplicateOfPlanIds.length > 0, duplicateOfPlanIds };
}
