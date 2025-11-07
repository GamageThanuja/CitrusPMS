// src/lib/email/buildPOSReceiptEmailHtml.ts
export type EmailReceiptLine = {
  itemDescription: string;
  quantity: number;
  price: number;
  lineTotal: number;
};

export type EmailTaxRow = { label: string; amount: number };

export interface BuildReceiptEmailArgs {
  hotelName?: string;
  docNo: string;
  dateISO?: string;
  tableNo?: string;
  roomNo?: string | number;
  cashier?: string;
  items: EmailReceiptLine[];
  subtotal: number;

  // ✅ accept array OR legacy object
  taxes?:
    | EmailTaxRow[]
    | {
        serviceCharge?: number;
        tdl?: number;
        sscl?: number;
        vat?: number;
      };

  grand: number;
  payments?: {
    label: string;
    foreignAmount?: number;
    localAmount: number;
  }[];
  footerNote?: string;
}

const fmt = (n: number) => Number(n || 0).toFixed(2);
const esc = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Normalize taxes to an array
function normalizeTaxes(
  taxes: BuildReceiptEmailArgs["taxes"] | undefined
): EmailTaxRow[] {
  if (!taxes) return [];
  if (Array.isArray(taxes)) {
    return taxes
      .filter((t) => t && typeof t.amount === "number" && t.amount !== 0)
      .map((t) => ({ label: String(t.label || ""), amount: Number(t.amount) }));
  }
  const legacy = taxes as NonNullable<
    Exclude<BuildReceiptEmailArgs["taxes"], EmailTaxRow[]>
  >;
  const out: EmailTaxRow[] = [];
  if (legacy.serviceCharge)
    out.push({ label: "Service Charge", amount: Number(legacy.serviceCharge) });
  if (legacy.tdl) out.push({ label: "TDL", amount: Number(legacy.tdl) });
  if (legacy.sscl) out.push({ label: "SSCL", amount: Number(legacy.sscl) });
  if (legacy.vat) out.push({ label: "VAT", amount: Number(legacy.vat) });
  return out.filter((t) => Number(t.amount) !== 0);
}

export default function buildReceiptEmailHtml({
  hotelName = "HotelMate POS",
  docNo,
  dateISO = new Date().toISOString(),
  tableNo,
  roomNo,
  cashier = "POS",
  items,
  subtotal,
  taxes,
  grand,
  payments = [],
  footerNote = "Thank you for your business.",
}: BuildReceiptEmailArgs) {
  const taxList = normalizeTaxes(taxes);

  const itemRows = items
    .map(
      (it) => `
      <tr>
        <td style="padding:6px 0;">${esc(it.itemDescription)}</td>
        <td style="padding:6px 0; text-align:right;">${it.quantity}</td>
        <td style="padding:6px 0; text-align:right;">${fmt(it.price)}</td>
        <td style="padding:6px 0; text-align:right;">${fmt(it.lineTotal)}</td>
      </tr>`
    )
    .join("");

  const taxRows = taxList
    .map(
      (t) => `
      <tr>
        <td style="padding:4px 0; color:#555">${esc(t.label)}</td>
        <td style="padding:4px 0; text-align:right;">${fmt(t.amount)}</td>
      </tr>`
    )
    .join("");

  const paymentRows = (payments ?? [])
    .map(
      (p) => `
      <tr>
        <td style="padding:4px 0; color:#555">${esc(p.label)}</td>
        <td style="padding:4px 0; text-align:right;">${fmt(p.localAmount)}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${esc(docNo)}</title>
</head>
<body style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;padding:16px;background:#f6f7fb;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <div style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
      <div style="font-size:18px;font-weight:700;">${esc(hotelName)}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:4px;">
        Receipt • <b>${esc(docNo)}</b> • ${new Date(dateISO).toLocaleString()}
      </div>
      <div style="font-size:12px;color:#6b7280;margin-top:2px;">
        ${tableNo ? `Table: ${esc(tableNo)} • ` : ""}${
    roomNo ? `Room: ${esc(String(roomNo))} • ` : ""
  }Cashier: ${esc(cashier)}
      </div>
    </div>

    <div style="padding:16px 20px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left;font-size:12px;color:#6b7280;padding-bottom:6px;">Item</th>
            <th style="text-align:right;font-size:12px;color:#6b7280;padding-bottom:6px;">Qty</th>
            <th style="text-align:right;font-size:12px;color:#6b7280;padding-bottom:6px;">Price</th>
            <th style="text-align:right;font-size:12px;color:#6b7280;padding-bottom:6px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <div style="height:1px;background:#e5e7eb;margin:12px 0;"></div>

      <table style="width:100%;border-collapse:collapse;">
        <tbody>
          <tr>
            <td style="padding:4px 0;color:#555">Subtotal</td>
            <td style="text-align:right;padding:4px 0;">${fmt(subtotal)}</td>
          </tr>

          ${taxRows}

          <tr>
            <td style="padding:6px 0;font-weight:700;">Grand</td>
            <td style="text-align:right;padding:6px 0;font-weight:700;">${fmt(
              grand
            )}</td>
          </tr>
        </tbody>
      </table>

      ${
        paymentRows
          ? `<div style="height:1px;background:#e5e7eb;margin:12px 0;"></div>
      <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">Payments</div>
      <table style="width:100%;border-collapse:collapse;">
        <tbody>${paymentRows}</tbody>
      </table>`
          : ""
      }
    </div>

    <div style="padding:14px 20px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
      ${esc(footerNote)}
    </div>
  </div>
</body>
</html>`;
}
