import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";
import { HotelPayload } from "@/types/hotel";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Create a new hotel
 */
// controllers/hotelController.ts
export async function createHotel({
  token,
  payload,
}: {
  token: string;
  payload: any;
}) {
  const res = await fetch(`${BASE_URL}/api/Hotel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "*/*", // be liberal
    },
    body: JSON.stringify(payload),
  });

  // Helpful logs while you debug
  const ct = res.headers.get("content-type") || "";
  console.log("[createHotel] status:", res.status, res.statusText, "CT:", ct);

  if (!res.ok) {
    // Try to read something meaningful for the error
    let errBody: any = null;
    try {
      errBody = ct.includes("application/json")
        ? await res.json()
        : await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(
      `CreateHotel failed: ${res.status} ${res.statusText} ${
        errBody ? `- ${JSON.stringify(errBody)}` : ""
      }`
    );
  }

  // Some backends return no body on 201. Handle all cases:
  if (ct.includes("application/json")) {
    return await res.json(); // expected happy path
  }

  // text/plain (your Swagger shows this), try to coerce
  const text = await res.text();
  // Sometimes backends send a JSON string with text/plain
  try {
    return JSON.parse(text);
  } catch {
    // If it's truly plain text, return a minimal object so caller isn’t undefined
    return { raw: text };
  }
}
