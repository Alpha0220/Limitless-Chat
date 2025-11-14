import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  createCheckoutSession,
  handlePaymentSuccess,
  verifyWebhookSignature,
} from "../_core/stripe";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { users } from "../../drizzle/schema";

export const stripeRouter = router({
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        planName: z.enum(["starter", "popular", "pro"]),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Define pricing plans
      const plans = {
        starter: { credits: 200, amount: 10 },
        popular: { credits: 600, amount: 25 },
        pro: { credits: 1500, amount: 50 },
      };

      const plan = plans[input.planName];
      if (!plan) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid plan",
        });
      }

      try {
        const checkoutUrl = await createCheckoutSession({
          userId: ctx.user.id,
          priceId: `price_${input.planName}`,
          credits: plan.credits,
          amount: plan.amount,
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
          paymentMethod: "card",
        });

        return { checkoutUrl };
      } catch (error) {
        console.error("[Stripe] Checkout session creation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),

  handleWebhook: protectedProcedure
    .input(
      z.object({
        body: z.string(),
        signature: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const event = await verifyWebhookSignature(input.body, input.signature);

        if (event.type === "checkout.session.completed") {
          const session = event.data.object as any;
          const { userId, credits } = await handlePaymentSuccess(session.id);

          // Update user credits in database
          const db = await getDb();
          if (db) {
            // Get current credits
            const user = await db
              .select()
              .from(users)
              .where(eq(users.id, userId))
              .limit(1);

            if (user.length > 0) {
              const currentCredits = user[0].credits || 0;
              // Update credits
              await db
                .update(users)
                .set({ credits: currentCredits + credits })
                .where(eq(users.id, userId));

              console.log(
                `[Stripe] Credits added: ${credits} to user ${userId}`
              );
            }
          }

          return { success: true, message: "Credits added successfully" };
        }

        return { success: true, message: "Webhook processed" };
      } catch (error) {
        console.error("[Stripe] Webhook processing failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Webhook processing failed",
        });
      }
    }),

  getPublishableKey: protectedProcedure.query(() => {
    const { ENV } = require("../_core/env");
    return {
      publishableKey: ENV.stripePublishableKey,
    };
  }),
});
