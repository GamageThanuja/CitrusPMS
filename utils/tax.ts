/* tax.ts
 * Fully API-driven tax ladder engine.
 * Uses only { taxName, percentage, calcBasedOn } from your API.
 *
 * calcBasedOn grammar (simple):
 *   "<Token>(+<Token>)*"
 * where <Token> is "Base" or any prior tax's taxName (case-insensitive).
 *
 * Examples your API can return:
 *  - { taxName: "SERVICE CHARGE", percentage: 10, calcBasedOn: "Base" }
 *  - { taxName: "TDL", percentage: 1, calcBasedOn: "Base+SERVICE CHARGE" }
 *  - { taxName: "SSCL", percentage: 2.5, calcBasedOn: "Base+SERVICE CHARGE" }
 *  - { taxName: "VAT", percentage: 18, calcBasedOn: "Base+SERVICE CHARGE+TDL+SSCL" }
 */

export type ApiTax = {
  taxName: string;
  percentage: number; // e.g., 10 means 10%
  calcBasedOn: string; // e.g., "Base", "Base+SERVICE CHARGE+TDL"
  accountId?: number | null;
};

export type ForwardLine = {
  label: string; // "Base" or taxName
  baseForThisTax?: number; // base used to compute this tax (for taxes)
  rate?: number; // decimal (e.g., 0.10)
  amount: number; // amount contributed by this line
  percentage?: number; // original percentage (for taxes)
  calcBasedOn?: string; // original expression (for taxes)
};

export type ForwardResult = {
  exclusiveBase: number; // input
  inclusiveTotal: number; // output
  lines: ForwardLine[]; // detailed breakdown
  unresolved: string[]; // any tax names we could not compute due to dependency issues
};

export type ReverseLine = {
  label: string; // "Base" or taxName or "Factor"
  amountWhenBaseIs1: number; // contribution when Base = 1
  percentage?: number;
  calcBasedOn?: string;
};

export type ReverseResult = {
  base: number; // exclusive amount (output)
  factor: number; // effective multiplier
  lines: ReverseLine[]; // breakdown when Base = 1
  unresolved: string[]; // any unresolved tax names
};

/** Utility: trim + collapse spaces; case-insensitive key builder */
const toKey = (s: string) => s.trim().toLowerCase();

/** Parse "Base+SERVICE CHARGE+TDL" → ["Base","SERVICE CHARGE","TDL"] preserving tokens */
const parseTokens = (expr?: string): string[] =>
  (expr || "Base")
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * Resolve tax amounts (FORWARD) given an exclusive base and API taxes.
 * - Computes each tax only when all its referenced tokens are known.
 * - Tokens can reference "Base" and/or tax names from other rows.
 * - Order-agnostic: we iterate until everything that can be computed is computed.
 */
export function computeInclusiveFromExclusive_API(
  exclusiveBase: number,
  taxes: ApiTax[]
): ForwardResult {
  const lines: ForwardLine[] = [{ label: "Base", amount: exclusiveBase }];
  const unresolved: string[] = [];

  // Known symbol table for forward calc (case-insensitive)
  // Initialize with Base
  const valueBySymbol = new Map<string, number>([["base", exclusiveBase]]);

  // Keep a working list to resolve in dependency order
  const pending = [...(taxes || [])];
  const maxIters = Math.max(1, pending.length * 5);
  let iters = 0;

  while (pending.length && iters < maxIters) {
    iters++;
    let progressed = false;

    for (let i = 0; i < pending.length; i++) {
      const t = pending[i];
      const nameKey = toKey(t.taxName || "");
      if (!nameKey) continue;

      const refs = parseTokens(t.calcBasedOn);
      // ensure all refs are known
      const allKnown = refs.every((r) => valueBySymbol.has(toKey(r)));
      if (!allKnown) continue;

      // compute base for this tax
      const baseForTax = refs.reduce(
        (sum, r) => sum + (valueBySymbol.get(toKey(r)) || 0),
        0
      );

      const rate = (Number(t.percentage) || 0) / 100;
      const taxAmt = baseForTax * rate;

      // persist
      valueBySymbol.set(nameKey, taxAmt);
      lines.push({
        label: t.taxName,
        baseForThisTax: baseForTax,
        rate,
        amount: taxAmt,
        percentage: Number(t.percentage) || 0,
        calcBasedOn: t.calcBasedOn,
      });

      // remove from pending
      pending.splice(i, 1);
      i--;
      progressed = true;
    }

    if (!progressed) break;
  }

  // anything left is unresolved
  if (pending.length) {
    unresolved.push(...pending.map((t) => t.taxName || "(unnamed tax)"));
  }

  const inclusiveTotal = lines.reduce((sum, l) => sum + l.amount, 0);

  return {
    exclusiveBase,
    inclusiveTotal,
    lines,
    unresolved,
  };
}

/**
 * Reverse out taxes (INCLUSIVE → EXCLUSIVE) using the same ladder.
 * Idea: simulate with Base = 1 to get a total factor, then divide.
 * - Resolve all dependencies exactly like forward calc, but with Base = 1.
 * - factor = 1 + sum(taxAmountsWhenBaseIs1)
 * - exclusive = inclusive / factor
 */
export function reverseExclusiveFromInclusive_API(
  inclusiveAmount: number,
  taxes: ApiTax[]
): ReverseResult {
  if (!inclusiveAmount || !Array.isArray(taxes) || taxes.length === 0) {
    return {
      base: inclusiveAmount || 0,
      factor: 1,
      lines: [
        { label: "Base", amountWhenBaseIs1: 1 },
        { label: "Factor", amountWhenBaseIs1: 1 },
      ],
      unresolved: [],
    };
  }

  const lines: ReverseLine[] = [{ label: "Base", amountWhenBaseIs1: 1 }];
  const unresolved: string[] = [];

  // Known symbol table for reverse calc with Base = 1
  const valueBySymbol = new Map<string, number>([["base", 1]]);
  const taxAmountByName = new Map<string, number>();

  const pending = [...taxes];
  const maxIters = Math.max(1, pending.length * 5);
  let iters = 0;

  while (pending.length && iters < maxIters) {
    iters++;
    let progressed = false;

    for (let i = 0; i < pending.length; i++) {
      const t = pending[i];
      const nameKey = toKey(t.taxName || "");
      if (!nameKey) continue;

      const refs = parseTokens(t.calcBasedOn);
      const allKnown = refs.every((r) => valueBySymbol.has(toKey(r)));
      if (!allKnown) continue;

      const baseForTax = refs.reduce(
        (sum, r) => sum + (valueBySymbol.get(toKey(r)) || 0),
        0
      );

      const rate = (Number(t.percentage) || 0) / 100;
      const taxAmtWhenBaseIs1 = baseForTax * rate;

      valueBySymbol.set(nameKey, taxAmtWhenBaseIs1);
      taxAmountByName.set(t.taxName, taxAmtWhenBaseIs1);

      lines.push({
        label: t.taxName,
        amountWhenBaseIs1: round6(taxAmtWhenBaseIs1),
        percentage: Number(t.percentage) || 0,
        calcBasedOn: t.calcBasedOn,
      });

      pending.splice(i, 1);
      i--;
      progressed = true;
    }

    if (!progressed) break;
  }

  if (pending.length) {
    unresolved.push(...pending.map((t) => t.taxName || "(unnamed tax)"));
  }

  // factor = Base(=1) + all tax amounts when Base=1
  let factor = 1;
  for (const amt of taxAmountByName.values()) {
    factor += amt;
  }

  lines.push({ label: "Factor", amountWhenBaseIs1: round6(factor) });

  const exclusive = inclusiveAmount / factor;

  return {
    base: exclusive,
    factor,
    lines,
    unresolved,
  };
}

/** Convenience: run forward calc but return only totals. */
export function inclusiveTotal_API(
  exclusiveBase: number,
  taxes: ApiTax[]
): number {
  return computeInclusiveFromExclusive_API(exclusiveBase, taxes).inclusiveTotal;
}

/** Convenience: run reverse calc but return only exclusive base. */
export function exclusiveBase_API(
  inclusiveAmount: number,
  taxes: ApiTax[]
): number {
  return reverseExclusiveFromInclusive_API(inclusiveAmount, taxes).base;
}

/** Sum helper for a given token list against a symbol table */
function sumTokensKnown(
  tokens: string[],
  symbolTable: Map<string, number>
): number {
  return tokens.reduce((sum, r) => sum + (symbolTable.get(toKey(r)) || 0), 0);
}

/** Round to avoid floating noise in debug lines (keeps full precision for core math). */
function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
