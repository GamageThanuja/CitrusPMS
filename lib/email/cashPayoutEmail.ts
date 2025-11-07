import type { HotelEmailContext } from "@/hooks/useSendHotelEmail";

export type CashPayoutEmailData = {
  invoiceNo: string;
  paidAmount: number;
  paidCurrency: string; // e.g., LKR
  paidMethod: string; // e.g., "Cash"
  paidDateISO: string; // system date or ISO
  forLine: string; // e.g., "cash payout for John (Room 101)"
  paidStampUrl?: string; // optional; if omitted you can set a default
};

export function buildCashPayoutEmail(
  ctx: HotelEmailContext,
  data: CashPayoutEmailData
): string {
  const { logoUrl, companyName, addressLines, phone, website } = ctx;

  const {
    invoiceNo,
    paidAmount,
    paidCurrency,
    paidMethod,
    paidDateISO,
    forLine,
    paidStampUrl,
  } = data;

  const paidOn = new Date(
    paidDateISO || new Date().toISOString()
  ).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  const fmtMoney = (code: string, n: number) =>
    `${code || "LKR"} ${Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const addrHtml = (addressLines || []).map((l) => `${l}<br>`).join("");
  const paidDisplay = fmtMoney(paidCurrency, paidAmount);

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f6f7fb;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f7fb;">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background:#ffffff;border-radius:8px;border:1px solid #e9ecf3;">
      <tr>
        <td align="center" style="padding:28px 24px 8px 24px;">
          <img src="${
            logoUrl || "https://via.placeholder.com/140x42?text=LOGO"
          }" width="140" alt="Logo" style="display:block;border:0;">
        </td>
      </tr>
      <tr><td align="center" style="padding:8px 24px 0 24px;font-family:Arial,Helvetica,sans-serif;">
        <div style="font-size:28px;line-height:34px;font-weight:700;color:#0f172a;">Payment Receipt</div>
      </td></tr>
      <tr><td align="center" style="padding:6px 24px 0 24px;font-family:Arial,Helvetica,sans-serif;">
        <div style="font-size:14px;line-height:22px;color:#111827;"><strong>INVOICE #${invoiceNo}</strong></div>
      </td></tr>
      <tr><td align="center" style="padding:4px 24px 0 24px;font-family:Arial,Helvetica,sans-serif;">
        <div style="font-size:14px;line-height:22px;color:#4b5563;">
          ${forLine}<br>paid on <strong>${paidOn}</strong>
        </div>
      </td></tr>
      <tr><td align="center" style="padding:18px 24px 16px 24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr><td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#111827;">
            <strong>${companyName}</strong><br>
            ${addrHtml}
            ${phone ? `Mobile: ${phone}<br>` : ""}
            ${
              website
                ? `<a href="${website}" style="color:#2563eb;text-decoration:none;">${website.replace(
                    /^https?:\/\//,
                    ""
                  )}</a>`
                : ""
            }
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:0 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="border-top:1px solid #e5e7eb;height:0;line-height:0;font-size:0;">&nbsp;</td></tr>
          <tr><td align="center" style="padding:10px 0 0 0;">
            <span style="display:inline-block;width:18px;height:18px;border:1px solid #e5e7eb;border-radius:999px;line-height:18px;text-align:center;color:#9ca3af;font-family:Arial,Helvetica,sans-serif;font-size:12px;">♡</span>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:16px 32px 0 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:#111827;">
              <strong>Payment Amount:</strong>
              <span style="font-weight:700;"> ${paidDisplay}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:#6b7280;text-transform:uppercase;letter-spacing:.4px;">
              <strong style="color:#374151;">Payment Method:</strong> ${paidMethod.toUpperCase()}
            </td>
          </tr>
        </table>
      </td></tr>
      <tr><td align="center" style="padding:18px 24px 6px 24px;">
        <img src="${paidStampUrl}" width="160" alt="PAID" style="display:block;border:0;">
      </td></tr>
      <tr><td align="center" style="padding:0 24px 20px 24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#9ca3af;">
        Powered by <strong style="color:#111827;">wave</strong>
      </td></tr>
      <tr><td style="background:#f9fafb;border-top:1px solid #e9ecf3;border-bottom-left-radius:8px;border-bottom-right-radius:8px;padding:16px 24px 22px 24px;font-family:Arial,Helvetica,sans-serif;">
        <div style="text-align:center;font-size:12px;line-height:20px;color:#6b7280;">
          Thanks for your business. If this invoice was sent in error,
          please contact <a href="mailto:info@citruspms.com" style="color:#2563eb;text-decoration:none;">info@citruspms.com</a>.
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}
