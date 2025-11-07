export function buildChannelManagerEmailHTML(opts: {
  hotelName: string;
  hotelId: number | string;
  hotelGuid?: string;
  propertyIdCM?: string | null;
  requesterName: string;
  requesterEmail: string;
}) {
  const {
    hotelName,
    hotelId,
    hotelGuid,
    propertyIdCM,
    requesterName,
    requesterEmail,
  } = opts;

  const prettyRow = (label: string, value?: string | number | null) => {
    if (!value && value !== 0) return "";
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #EEF1F5;color:#6B7280;font:500 14px/20px ui-sans-serif,system-ui,-apple-system"> ${label} </td>
        <td style="padding:10px 12px;border-bottom:1px solid #EEF1F5;color:#111827;font:600 14px/20px ui-sans-serif,system-ui,-apple-system"> ${String(
          value
        )} </td>
      </tr>
    `;
  };

  return `
  <!doctype html>
  <html>
  <head>
    <meta charSet="utf-8" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light" />
    <title>Channel Manager Request</title>
  </head>
  <body style="margin:0;padding:0;background:#F9FAFB;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F3F4F6;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="background:#FFFFFF;border-radius:14px;box-shadow:0 1px 3px rgba(16,24,40,.06);overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 0 28px;">
                <img alt="HotelMate" src="https://hotelmate.net/favicon-192.png" width="44" height="44" style="display:block;border:0;border-radius:10px;opacity:.95" />
                <h1 style="margin:16px 0 4px;font:700 22px/28px ui-sans-serif,system-ui,-apple-system;color:#111827;">
                  Channel Manager Request
                </h1>
                <p style="margin:0 0 14px;color:#4B5563;font:400 14px/22px ui-sans-serif,system-ui,-apple-system">
                  A property has requested Channel Manager activation via HotelMate.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 28px 10px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
                  <tr>
                    <td colspan="2" style="background:#F9FAFB;padding:12px 14px;border-bottom:1px solid #E5E7EB;color:#111827;font:700 13px/18px ui-sans-serif,system-ui,-apple-system">
                      Property Details
                    </td>
                  </tr>
                  ${prettyRow("Hotel Name", hotelName)}
                  ${prettyRow("Hotel ID", hotelGuid)}
                  ${prettyRow(
                    "Channel Manager Property ID (CMID)",
                    propertyIdCM || "Not yet set"
                  )}
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:4px 28px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
                  <tr>
                    <td colspan="2" style="background:#F9FAFB;padding:12px 14px;border-bottom:1px solid #E5E7EB;color:#111827;font:700 13px/18px ui-sans-serif,system-ui,-apple-system">
                      Requester
                    </td>
                  </tr>
                  ${prettyRow("Name", requesterName)}
                  ${prettyRow("Email", requesterEmail)}
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:0 28px 24px;">
                <a href="https://hotelmate.net" target="_blank"
                  style="display:inline-block;background:#111827;color:#FFFFFF;text-decoration:none;border-radius:10px;padding:10px 16px;font:600 14px/20px ui-sans-serif,system-ui,-apple-system">
                  Open HotelMate
                </a>
                <span style="color:#6B7280;font:400 12px/18px ui-sans-serif,system-ui,-apple-system;margin-left:8px;">
                  &nbsp; • &nbsp; Generated automatically by HotelMate
                </span>
              </td>
            </tr>

          </table>

          <p style="color:#9CA3AF;font:400 12px/18px ui-sans-serif,system-ui,-apple-system;margin:14px 0 0;">
            © ${new Date().getFullYear()} HotelMate
          </p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}
