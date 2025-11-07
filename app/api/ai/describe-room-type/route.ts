// app/api/ai/describe-room-type/route.ts
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      // property context (optional, helps SEO + grounding)
      propertyName,
      propertyType,
      city,
      country,

      // room type specifics
      roomType, // e.g., "Deluxe Ocean View"
      title, // optional alias/marketing title
      adultSpace, // number | string
      childSpace, // number | string
      amenities = [], // string[]
      bedding = [], // string[]
      view, // string
      washroom = [], // string[]
      existingNotes, // seed user text (optional)
      language, // optional, e.g. "English"
      tone, // optional, e.g. "warm, premium"
    } = body ?? {};

    // ⚠️ use ENV, never hardcode keys
    const client = new OpenAI({
      apiKey: apiKey,
        
    // Build compact, grounded prompt
    const prompt = [
      `You are a hospitality copywriter. Write a concise, guest-friendly **room type** description (90–140 words).`,
      `Focus on comfort benefits, the feel of the space, and 4–8 concrete features.`,
      `Avoid inventing facts. If a field is blank, skip it. Keep it truthful and welcoming.`,
      language ? `Write in ${language}.` : ``,
      tone ? `Adopt a ${tone} tone.` : ``,
      ``,
      `Context (optional):`,
      `• Property: ${
        [propertyName, propertyType].filter(Boolean).join(" / ") || "—"
      }`,
      `• Location: ${[city, country].filter(Boolean).join(", ") || "—"}`,
      ``,
      `Room Type Data:`,
      `• Name/Title: ${title || roomType || "—"}`,
      `• Sleeps: up to ${Number(adultSpace ?? 0) || "—"} adult(s)` +
        (Number(childSpace ?? 0) ? ` + ${childSpace} child(ren)` : ``),
      `• View: ${view || "—"}`,
      `• Bedding: ${
        Array.isArray(bedding) && bedding.length ? bedding.join(", ") : "—"
      }`,
      `• Amenities: ${
        Array.isArray(amenities) && amenities.length
          ? amenities.join(", ")
          : "—"
      }`,
      `• Washroom: ${
        Array.isArray(washroom) && washroom.length ? washroom.join(", ") : "—"
      }`,
      `• Existing Notes: ${existingNotes || "—"}`,
    ]
      .filter(Boolean)
      .join("\n");

    const resp = await client.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
      // temperature: 0.7,
    });

    const text = (resp as any).output_text ?? "";
    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("AI describe-room-type error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to generate room type description" },
      { status: 500 }
    );
  }
}
