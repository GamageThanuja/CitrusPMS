import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { getHotelIPGByHotelId } from "@/controllers/hotelIPGController";

interface PaymentLinkRequest {
  processingInformation: {
    linkType: string;
  };
  purchaseInformation: {
    purchaseNumber: string;
  };
  orderInformation: {
    amountDetails: {
      currency: string;
      totalAmount: string;
    };
    lineItems: Array<{
      productName: string;
      unitPrice: string;
      quantity?: number;
    }>;
  };
}

interface PaymentLinkResponse {
  id: string;
  status: string;
  purchaseInformation: {
    paymentLink: string;
    purchaseNumber: string;
  };
  orderInformation: {
    amountDetails: {
      totalAmount: number;
      currency: string;
    };
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      hotelId,
      amount,
      currency = "USD",
      reservationNo,
      productName = "Hotel Invoice Payment",
      token,
    } = req.body;

    if (!hotelId || !amount) {
      return res
        .status(400)
        .json({ error: "Hotel ID and amount are required" });
    }

    if (!token) {
      return res.status(400).json({ error: "Access token is required" });
    }

    // Basic token validation (check if it looks like a JWT)
    if (!token.startsWith("eyJ")) {
      return res.status(400).json({ error: "Invalid token format" });
    }

    // Fetch IPG credentials for the specific hotel
    const ipgCredentials = await getHotelIPGByHotelId({
      token,
      hotelId: parseInt(hotelId),
    });

    if (!ipgCredentials || ipgCredentials.length === 0) {
      return res
        .status(404)
        .json({ error: "IPG credentials not found for this hotel" });
    }

    const credentials = ipgCredentials[0];

    if (
      !credentials.accessKeyUSD ||
      !credentials.profileIdUSD ||
      !credentials.secretKey
    ) {
      return res.status(400).json({
        error:
          "Missing Secure Acceptance credentials. Required: accessKeyUSD, profileIdUSD, secretKey.",
      });
    }

    console.log("🔄 Creating payment form for hotel:", hotelId);
    console.log("💰 Payment details:", { amount, currency, reservationNo });
    console.log(
      "🔑 Using Secure Acceptance credentials for merchant:",
      credentials.merchandIdUSD
    );

    // Generate unique transaction ID
    const transactionUuid = `INV-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const referenceNumber = reservationNo || transactionUuid;

    // Prepare fields for CyberSource Secure Acceptance
    const fields: Record<string, string> = {
      access_key: credentials.accessKeyUSD,
      profile_id: credentials.profileIdUSD,
      transaction_uuid: transactionUuid,
      signed_field_names:
        "access_key,profile_id,transaction_uuid,signed_field_names,unsigned_field_names,signed_date_time,locale,transaction_type,reference_number,amount,currency,bill_address1,bill_city,bill_country",
      unsigned_field_names: "",
      signed_date_time: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
      locale: "en",
      transaction_type: "sale",
      reference_number: referenceNumber,
      amount: parseFloat(amount).toFixed(2),
      currency: currency.toUpperCase(),
      bill_address1: "Address",
      bill_city: "City",
      bill_country: "US",
    };

    // Generate signature using existing method
    const signedFieldNames = fields.signed_field_names.split(",");
    const dataToSign = signedFieldNames
      .map((field) => `${field}=${fields[field]}`)
      .join(",");

    const signature = crypto
      .createHmac("sha256", credentials.secretKey)
      .update(dataToSign, "utf8")
      .digest("base64");

    // Determine the correct endpoint based on sandbox mode
    const endpoint = credentials.isSandBoxMode
      ? "https://testsecureacceptance.cybersource.com/pay"
      : "https://secureacceptance.cybersource.com/pay";

    console.log("✅ Payment form prepared successfully");
    console.log(
      "� Endpoint:",
      endpoint,
      "(Sandbox:",
      credentials.isSandBoxMode + ")"
    );

    // Return the form data and endpoint for client-side form submission
    return res.status(200).json({
      success: true,
      paymentUrl: endpoint,
      formFields: {
        ...fields,
        signature: signature,
      },
      transactionUuid: transactionUuid,
      referenceNumber: referenceNumber,
      amount: parseFloat(amount).toFixed(2),
      currency: currency.toUpperCase(),
      isSandbox: credentials.isSandBoxMode,
    });
  } catch (error) {
    console.error("❌ Payment form creation error:", error);
    return res.status(500).json({
      error: "Failed to create payment form",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
