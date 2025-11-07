import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export const runtime = "nodejs"; // ensure edge is NOT used

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  let event: Stripe.Event;

  try {
    const buf = await req.arrayBuffer();
    const text = Buffer.from(buf).toString("utf8");

    event = stripe.webhooks.constructEvent(
      text,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verify failed:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // session.customer, session.subscription, session.metadata, etc.
        // TODO: persist subscription -> your DB (map customerId/subscriptionId to your user/property)
        break;
      }
      case "invoice.payment_succeeded": {
        // Optional: handle renewals
        break;
      }
      case "customer.subscription.deleted": {
        // Optional: pause/disable access
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}
