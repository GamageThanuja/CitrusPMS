"use client";

import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { sendCustomEmail } from "@/redux/slices/emailSendSlice";
import { fetchSystemDate } from "@/redux/slices/systemDateSlice";
import { RootState } from "@/redux/store";
import { useHotelLogo } from "@/hooks/useHotelLogo";

/** Auto-provided hotel context injected into your templates */
export interface HotelEmailContext {
  logoUrl?: string | null;
  companyName: string;
  addressLines: string[];
  phone?: string;
  website?: string;
  systemDateISO: string; // YYYY-MM-DD (hotel system date) or today
  hotelCurrency?: string;
  hotelId?: number | string;
  hotelCode?: string;
}

/** Optional email headers */
export interface SendHotelEmailHeaders {
  ccEmails?: string; // comma-separated
  bccEmails?: string; // comma-separated
  replyToEmail?: string;
  priority?: number; // align with your API
  senderName?: string;
}

/** Builder can receive (ctx, data?) */
export type HtmlBuilder<T = any> = (ctx: HotelEmailContext, data?: T) => string;

export interface SendHotelEmailArgs<T = any> extends SendHotelEmailHeaders {
  toEmail: string;
  subject?: string; // default auto-generated if omitted
  html?: string; // pass raw HTML (skips buildHtml)
  buildHtml?: HtmlBuilder<T>; // preferred: your builder
  templateData?: T; // data forwarded into builder
}

export function useSendHotelEmail() {
  const dispatch = useAppDispatch();
  const { logoUrl } = useHotelLogo();
  const systemDate = useAppSelector((s: RootState) => s.systemDate?.value);

  const hotelCtx = useMemo<HotelEmailContext>(() => {
    try {
      const raw = localStorage.getItem("selectedProperty");
      const p = raw ? JSON.parse(raw) : {};
      const companyName =
        p?.hotelName || "Citrus Property Management (Pvt) Ltd";
      const addressLines = [
        p?.addressLine1 || "241/1, Pipe Road,",
        p?.addressLine2 || "Koswatta",
        p?.city || "Battaramulla",
        p?.country || "Sri Lanka",
      ].filter(Boolean);

      return {
        logoUrl,
        companyName,
        addressLines,
        phone: p?.contactNumber || "077 205 6666",
        website: p?.website || "https://www.citruspms.com",
        systemDateISO:
          (typeof systemDate === "string" && systemDate) ||
          new Date().toISOString().slice(0, 10),
        hotelCurrency: p?.currencyCode || "LKR",
        hotelId: p?.id,
        hotelCode: p?.hotelCode,
      };
    } catch {
      return {
        logoUrl,
        companyName: "Citrus Property Management (Pvt) Ltd",
        addressLines: [
          "241/1, Pipe Road,",
          "Koswatta",
          "Battaramulla",
          "Sri Lanka",
        ],
        phone: "077 205 6666",
        website: "https://www.citruspms.com",
        systemDateISO: new Date().toISOString().slice(0, 10),
        hotelCurrency: "LKR",
      };
    }
  }, [logoUrl, systemDate]);

  const send = useCallback(
    async <T>({
      toEmail,
      subject,
      html,
      buildHtml,
      templateData,
      ccEmails,
      bccEmails,
      replyToEmail,
      priority,
      senderName,
    }: SendHotelEmailArgs<T>) => {
      if (!toEmail) {
        console.warn("useSendHotelEmail.send: missing toEmail");
        return;
      }

      try {
        if (!systemDate) {
          await dispatch(fetchSystemDate()).unwrap();
        }
      } catch (e) {
        console.warn("useSendHotelEmail: fetchSystemDate failed:", e);
      }

      const htmlBody =
        html ||
        (typeof buildHtml === "function"
          ? buildHtml(hotelCtx, templateData)
          : undefined);

      if (!htmlBody) {
        console.warn("useSendHotelEmail.send: no html or buildHtml provided.");
        return;
      }

      const finalSubject =
        subject ||
        `Receipt – ${hotelCtx.companyName} – ${hotelCtx.systemDateISO}`;

      await dispatch(
        sendCustomEmail({
          toEmail,
          subject: finalSubject,
          body: htmlBody,
          isHtml: true,
          ccEmails,
          bccEmails,
          replyToEmail,
          priority,
          senderName,
        })
      ).unwrap();
    },
    [dispatch, hotelCtx, systemDate]
  );

  return { send, context: hotelCtx };
}
