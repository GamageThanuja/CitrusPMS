// app/api/stripe/checkout-session/route.ts
import Stripe from "stripe";
import { NextRequest } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function GET(req: NextRequest) {
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) {
    return new Response(JSON.stringify({ error: "session_id required" }), {
      status: 400,
    });
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });

    const paid =
      session.payment_status === "paid" ||
      session.status === "complete" ||
      session.payment_intent; // embedded may mark via PI

    if (!paid) {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        status: 402,
      });
    }

    return new Response(
      JSON.stringify({
        id: session.id,
        customer:
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id,
        subscriptionId:
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id,
        mode: session.mode,
        metadata: session.metadata,
        payment_status: session.payment_status,
        status: session.status,
      }),
      { status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
