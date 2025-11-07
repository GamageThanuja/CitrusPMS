// pages/api/sign-cybersource.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { getHotelIPGByHotelId } from "@/controllers/hotelIPGController";

function signFields(fields: Record<string, string>, secretKey: string): string {
  const signedFieldNames = fields.signed_field_names.split(",");
  const dataToSign = signedFieldNames
    .map((field) => `${field}=${fields[field]}`)
    .join(",");

  return crypto
    .createHmac("sha256", secretKey)
    .update(dataToSign, "utf8")
    .digest("base64");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { hotelId, ...fields } = req.body;

    if (!hotelId) {
      return res.status(400).json({ error: "Hotel ID is required" });
    }

    if (!fields || !fields.signed_field_names) {
      return res.status(400).json({ error: "Missing signed fields" });
    }
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const accessToken = tokens.accessToken;
    if (!accessToken) {
      return res.status(500).json({ error: "Access token not configured" });
    }

    // Fetch IPG credentials for the specific hotel
    const ipgCredentials = await getHotelIPGByHotelId({
      token: accessToken,
      hotelId: parseInt(hotelId),
    });

    if (!ipgCredentials || ipgCredentials.length === 0) {
      return res
        .status(404)
        .json({ error: "IPG credentials not found for this hotel" });
    }

    const secretKey = ipgCredentials[0].secretKey;
    const isSandBoxMode = ipgCredentials[0].isSandBoxMode;

    console.log("🔑 Retrieved secret key for hotel:", secretKey);

    if (!secretKey) {
      return res.status(500).json({ error: "Secret key not found" });
    }

    const signature = signFields(fields, secretKey);

    // Determine the correct endpoint based on sandbox mode
    const endpoint = isSandBoxMode
      ? "https://testsecureacceptance.cybersource.com/pay"
      : "https://secureacceptance.cybersource.com/pay";

    console.log("✅ CyberSource signature generated for hotel:", hotelId);
    console.log(
      "🔗 Endpoint determined:",
      endpoint,
      "(Sandbox:",
      isSandBoxMode + ")"
    );

    return res.status(200).json({
      signature,
      endpoint,
      isSandBoxMode,
    });
  } catch (error) {
    console.error("Error generating CyberSource signature:", error);
    return res.status(500).json({ error: "Failed to generate signature" });
  }
}
