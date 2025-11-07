// /app/api/stripe/create-checkout-session/route.ts (Next.js App Router)
// or /pages/api/stripe/create-checkout-session.ts for Pages Router

import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const { rooms, currency, email, propertyName, city, country, returnUrl } =
      await req.json();

    // Your price math
    const base = 39;
    const extras = Math.max(0, (rooms ?? 5) - 5);
    const total = base + extras * 2;

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      mode: "subscription",
      // If you use Seats/quantities on a price, put the real priceId here and quantity=rooms.
      // Here I'll fake it using price_data for a single recurring price = total
      line_items: [
        {
          price_data: {
            currency: "USD".toLowerCase(),
            product_data: {
              name: `HotelMate — ${rooms} rooms plan`,
              description: [propertyName, city, country]
                .filter(Boolean)
                .join(", "),
            },
            recurring: { interval: "month" },
            unit_amount: Math.round(total * 100), // cents
          },
          quantity: 1,
        },
      ],
      customer_email: email || undefined,

      // IMPORTANT for Embedded Checkout
      return_url:
        returnUrl ||
        `${process.env.NEXT_PUBLIC_BASE_URL}/create-property?session_id={CHECKOUT_SESSION_ID}`,
      // Optional: pass anything you'll need after success
      metadata: { rooms: String(rooms || 5) },
    });

    // client_secret is what the embed needs
    return NextResponse.json({ client_secret: session.client_secret });
  } catch (err: any) {
    console.error("Stripe create session failed:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
