import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, creditTransactions, pricingTiers, monthlyBilling } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const creditsRouter = router({
  // Get user's credit balance
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    
    return {
      credits: user?.credits || 0,
      billingType: user?.billingType || "prepaid",
    };
  }),

  // Get credit transaction history
  getTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const transactions = await db
        .select()
        .from(creditTransactions)
        .where(eq(creditTransactions.userId, ctx.user.id))
        .orderBy(desc(creditTransactions.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return transactions;
    }),

  // Get pricing tiers
  getPricingTiers: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const tiers = await db
      .select()
      .from(pricingTiers)
      .where(eq(pricingTiers.isActive, true));

    return tiers;
  }),

  // Deduct credits for message usage
  deductCredits: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(1),
        messageId: z.number(),
        description: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);

      if (!user) {
        throw new Error("User not found");
      }

      // Check if user has enough credits
      if (user.billingType === "prepaid" && user.credits < input.amount) {
        throw new Error("Insufficient credits");
      }

      // Deduct credits
      const newBalance = user.credits - input.amount;
      await db
        .update(users)
        .set({ credits: newBalance })
        .where(eq(users.id, ctx.user.id));

      // Record transaction
      await db.insert(creditTransactions).values({
        userId: ctx.user.id,
        type: "usage",
        amount: -input.amount,
        balanceAfter: newBalance,
        description: input.description,
        messageId: input.messageId,
      });

      // For pay-as-you-go users, track monthly usage
      if (user.billingType === "payg") {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const [existingBilling] = await db
          .select()
          .from(monthlyBilling)
          .where(
            and(
              eq(monthlyBilling.userId, ctx.user.id),
              eq(monthlyBilling.month, currentMonth)
            )
          )
          .limit(1);

        if (existingBilling) {
          await db
            .update(monthlyBilling)
            .set({
              creditsUsed: existingBilling.creditsUsed + input.amount,
            })
            .where(eq(monthlyBilling.id, existingBilling.id));
        } else {
          await db.insert(monthlyBilling).values({
            userId: ctx.user.id,
            month: currentMonth,
            creditsUsed: input.amount,
            amountCharged: "0.00",
            status: "pending",
          });
        }
      }

      return {
        success: true,
        newBalance,
      };
    }),

  // Get monthly usage (for pay-as-you-go users)
  getMonthlyUsage: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const currentMonth = new Date().toISOString().slice(0, 7);
    const [billing] = await db
      .select()
      .from(monthlyBilling)
      .where(
        and(
          eq(monthlyBilling.userId, ctx.user.id),
          eq(monthlyBilling.month, currentMonth)
        )
      )
      .limit(1);

    return {
      month: currentMonth,
      creditsUsed: billing?.creditsUsed || 0,
      amountCharged: billing?.amountCharged || "0.00",
      status: billing?.status || "pending",
    };
  }),

  // Switch billing type
  switchBillingType: protectedProcedure
    .input(
      z.object({
        billingType: z.enum(["prepaid", "payg"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(users)
        .set({ billingType: input.billingType })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        billingType: input.billingType,
      };
    }),
});
