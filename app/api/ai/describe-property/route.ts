// app/api/ai/describe-property/route.ts
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      propertyName,
      propertyType,
      city,
      country,
      address,
      currency,
      language,
      website,
      descriptionSeed, // whatever's in the textarea already (optional)
      contactEmail,
      contactPhone,
      rooms,
      // feel free to add more fields later (amenities, brand tone, etc.)
    } = body ?? {};

    const client = new OpenAI({
      apiKey: apiKey,
    });

    const prompt = [
      `You are a hospitality copywriter. Write a concise, warm, SEO-friendly property description (120–160 words).`,
      `Focus on benefits to the guest, neighborhood/location flavor, and a few stand-out features.`,
      `Avoid making up facts. If a field is blank, skip it.`,
      ``,
      `Property data:`,
      `• Name: ${propertyName || "—"}`,
      `• Type: ${propertyType || "—"}`,
      `• City/Country: ${[city, country].filter(Boolean).join(", ") || "—"}`,
      `• Address: ${address || "—"}`,
      `• Rooms: ${rooms ?? "—"}`,
      `• Currency: ${currency || "—"}`,
      `• Primary Language: ${language || "—"}`,
      `• Website: ${website || "—"}`,
      `• Existing Notes: ${descriptionSeed || "—"}`,
      `• Contact: ${
        [contactEmail, contactPhone].filter(Boolean).join(" / ") || "—"
      }`,
    ].join("\n");

    // Using the official SDK + Responses API (preferred)
    // Docs: platform.openai.com/docs/api-reference/responses
    const resp = await client.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
      // You could add "temperature": 0.7 to make it chattier
    });

    // Unified access to text:
    const text = (resp as any).output_text ?? "";

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("AI describe-property error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to generate description" },
      { status: 500 }
    );
  }
}
