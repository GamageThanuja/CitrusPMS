// src/lib/print/buildPOSReceipt80mmHtml.ts

export type ReceiptLine = {
  itemDescription: string;
  quantity: number;
  price: number; // unit
  lineTotal: number;
};

// Unified row type for dynamic taxes
export type TaxRow = { label: string; amount: number };

export interface BuildReceipt80Args {
  hotelName?: string;
  docNo: string;
  dateISO?: string;
  tableNo?: string;
  roomNo?: string | number;
  cashier?: string;
  items: ReceiptLine[];
  subtotal: number;

  // Backward compatible: accept either array OR legacy object
  taxes?:
    | TaxRow[]
    | {
        serviceCharge?: number;
        tdl?: number;
        sscl?: number;
        vat?: number;
      };

  grand: number;
  payments?: {
    label: string; // e.g. "CASH (LKR)"
    foreignAmount?: number;
    localAmount: number;
  }[];
  footerNote?: string;

  /**
   * If true, injects a tiny script to call window.print() after load.
   * Default false so previews NEVER auto-open print.
   */
  autoPrint?: boolean;
}

const fmt = (n: number) => Number(n || 0).toFixed(2);

// Escape basic HTML characters
const esc = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Normalize taxes (array or legacy object) -> array of {label, amount}
function normalizeTaxes(
  taxes: BuildReceipt80Args["taxes"] | undefined
): TaxRow[] {
  if (!taxes) return [];

  if (Array.isArray(taxes)) {
    return taxes
      .filter((t) => t && typeof t.amount === "number" && t.amount !== 0)
      .map((t) => ({ label: String(t.label || ""), amount: Number(t.amount) }));
  }

  const legacy = taxes as NonNullable<
    Exclude<BuildReceipt80Args["taxes"], TaxRow[]>
  >;
  const out: TaxRow[] = [];
  if (legacy.serviceCharge)
    out.push({ label: "Service Charge", amount: Number(legacy.serviceCharge) });
  if (legacy.tdl) out.push({ label: "TDL", amount: Number(legacy.tdl) });
  if (legacy.sscl) out.push({ label: "SSCL", amount: Number(legacy.sscl) });
  if (legacy.vat) out.push({ label: "VAT", amount: Number(legacy.vat) });
  return out.filter((t) => Number(t.amount) !== 0);
}

export default function buildPOSReceipt80mmHtml({
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
  autoPrint = false, // ← default: passive (no auto print)
}: BuildReceipt80mmHtmlArgs) {
  type BuildReceipt80mmHtmlArgs = BuildReceipt80Args; // local alias for readability

  const taxList = normalizeTaxes(taxes);

  const taxRows = taxList
    .filter((t) => Number(t.amount) > 0)
    .map(
      (t) => `
      <tr>
        <td class="l">${esc(t.label)}</td>
        <td class="r">${fmt(Number(t.amount))}</td>
      </tr>`
    )
    .join("");

  const paymentRows = (payments ?? [])
    .map(
      (p) => `
      <tr>
        <td class="l">${esc(p.label)}</td>
        <td class="r">${fmt(p.localAmount)}</td>
      </tr>`
    )
    .join("");

  const itemRows = items
    .map(
      (it) => `
      <tr class="item">
        <td class="l">${esc(it.itemDescription)}</td>
        <td class="c">${it.quantity}</td>
        <td class="r">${fmt(it.price)}</td>
        <td class="r">${fmt(it.lineTotal)}</td>
      </tr>`
    )
    .join("");

  // 🔒 Only inject print script if explicitly requested
  const printScript = autoPrint
    ? `
  <script>
    try {
      window.addEventListener('load', function () {
        setTimeout(function () { window.print(); }, 150);
      });
    } catch (e) {}
  </script>`
    : "";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${esc(docNo)}</title>
  <style>
    /* === PAGE / WIDTH === */
    @page { size: 80mm auto; margin: 0; }
    html, body {
      width: 80mm;
      margin: 0;
      padding: 0;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* === TYPOGRAPHY === */
    body {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      color: #000;
      font-size: 11.5px;
      line-height: 1.35;
    }

    /* === LAYOUT === */
    .wrap { padding: 6mm 4mm 8mm 4mm; }
    .center { text-align: center; }
    .muted { color: #444; }
    .mono  { font-family: inherit; }
    .bold  { font-weight: 700; }

    hr {
      border: none;
      border-top: 1px dashed #000;
      margin: 6px 0;
    }

    /* === HEADER === */
    .hdr-ttl { font-size: 14px; font-weight: 700; }
    .hdr-meta { font-size: 10.5px; }

    /* === TABLES === */
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 3px 0; vertical-align: top; }
    thead th {
      font-size: 10px;
      font-weight: 600;
      color: #000;
      border-bottom: 1px solid #000;
    }
    tbody tr.item td { border-bottom: 1px dotted #000; }

    /* columns */
    td.l { text-align: left; }
    td.c { text-align: center; width: 12%; white-space: nowrap; }
    td.r { text-align: right; white-space: nowrap; }

    /* totals area */
    .totals td { padding: 2px 0; }
    .grand td {
      padding: 3px 0;
      font-weight: 700;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
    }

    /* footer */
    .foot { margin-top: 8px; font-size: 10.5px; text-align: center; }

    /* Avoid page breaks within items/totals on some engines */
    .no-break { page-break-inside: avoid; }

    @media screen {
      body { background: #f4f4f4; }
      .preview {
        background: #fff; margin: 12px auto; border: 1px solid #ddd; width: 80mm;
        box-shadow: 0 2px 6px rgba(0,0,0,.08);
      }
      .wrap { padding: 8mm 5mm 10mm 5mm; }
    }
  </style>
</head>
<body>
  <div class="preview">
    <div class="wrap">
      <div class="center">
        <div class="hdr-ttl">${esc(hotelName)}</div>
        <div class="hdr-meta muted">
          Receipt <span class="bold mono">${esc(docNo)}</span><br/>
          ${new Date(dateISO).toLocaleString()}
        </div>
        <div class="hdr-meta muted">
          ${tableNo ? `Table: ${esc(tableNo)} • ` : ""}${
    roomNo ? `Room: ${esc(String(roomNo))} • ` : ""
  }Cashier: ${esc(cashier)}
        </div>
      </div>

      <hr/>

      <table class="no-break">
        <thead>
          <tr>
            <th class="l">Item</th>
            <th class="c">Qty</th>
            <th class="r">Price</th>
            <th class="r">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <hr/>

      <table class="totals no-break">
        <tbody>
          <tr>
            <td class="l">Subtotal</td>
            <td class="r">${fmt(subtotal)}</td>
          </tr>
          ${taxRows}
          <tr class="grand">
            <td class="l">Grand</td>
            <td class="r">${fmt(grand)}</td>
          </tr>
        </tbody>
      </table>

      ${
        paymentRows
          ? `
      <hr/>
      <div class="muted">Payments</div>
      <table class="no-break">
        <tbody>
          ${paymentRows}
        </tbody>
      </table>`
          : ""
      }

      <div class="foot muted no-break">${esc(footerNote)}</div>
    </div>
  </div>

  ${printScript}
</body>
</html>`;
}
