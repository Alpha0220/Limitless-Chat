import Stripe from "stripe";
import { ENV } from "./env";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    if (!ENV.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    stripeClient = new Stripe(ENV.stripeSecretKey);
  }
  return stripeClient;
}

export interface CreateCheckoutSessionParams {
  userId: number;
  priceId: string;
  credits: number;
  amount: number;
  successUrl: string;
  cancelUrl: string;
  paymentMethod?: "card" | "promptpay"; // Thailand specific
}

export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<string> {
  const stripe = getStripe();

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: "thb", // Thailand Baht
        product_data: {
          name: `${params.credits} Credits`,
          description: `Purchase ${params.credits} credits for Limitless Chat`,
          metadata: {
            userId: params.userId.toString(),
            credits: params.credits.toString(),
          },
        },
        unit_amount: params.amount * 100, // Stripe uses cents
      },
      quantity: 1,
    },
  ];

  const paymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] =
    ["card"];

  // Add PromptPay (QR payment) for Thailand
  if (params.paymentMethod === "promptpay" || !params.paymentMethod) {
    paymentMethodTypes.push("promptpay");
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: paymentMethodTypes,
    line_items: lineItems,
    mode: "payment",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: undefined, // Will be set from user data
    metadata: {
      userId: params.userId.toString(),
      credits: params.credits.toString(),
    },
    billing_address_collection: "auto",
    locale: "th", // Thai language
  });

  if (!session.url) {
    throw new Error("Failed to create Stripe checkout session");
  }

  return session.url;
}

export async function verifyWebhookSignature(
  body: string,
  signature: string
): Promise<Stripe.Event> {
  const stripe = getStripe();
  const webhookSecret = ENV.stripeWebhookSecret;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  try {
    return stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error}`);
  }
}

export async function handlePaymentSuccess(
  sessionId: string
): Promise<{ userId: number; credits: number }> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session.metadata?.userId || !session.metadata?.credits) {
    throw new Error("Invalid session metadata");
  }

  return {
    userId: parseInt(session.metadata.userId),
    credits: parseInt(session.metadata.credits),
  };
}
