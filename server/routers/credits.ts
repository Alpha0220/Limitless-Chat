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

    console.log("[DEBUG] getBalance - ctx.user.id:", ctx.user.id);
    console.log("[DEBUG] getBalance - ctx.user:", ctx.user);
    const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1).execute();
    console.log("[DEBUG] getBalance - user query result:", JSON.stringify(user, null, 2));
    console.log("[DEBUG] getBalance - user[0]:", user[0]);
    console.log("[DEBUG] getBalance - user[0]?.credits:", user[0]?.credits);
    console.log("[DEBUG] getBalance - user[0]?.billingType:", user[0]?.billingType);
    
    if (!user || user.length === 0) {
      console.error("[DEBUG] getBalance - User not found for id:", ctx.user.id);
      throw new Error("User not found");
    }
    
    const result = {
      credits: user[0].credits ?? 0,
      billingType: user[0].billingType ?? "prepaid",
    };
    console.log("[DEBUG] getBalance - returning:", result);
    return result;
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
        .offset(input.offset)
        .execute();

      return transactions;
    }),

  // Get pricing tiers
  getPricingTiers: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const tiers = await db
      .select()
      .from(pricingTiers)
      .where(eq(pricingTiers.isActive, true))
      .execute();

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

      const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1).execute();
      console.log("[DEBUG] deductCredits user:", user[0]);

      if (!user || user.length === 0) {
        throw new Error("User not found");
      }

      const userData = user[0];

      // Check if user has enough credits
      if (userData.billingType === "prepaid" && userData.credits < input.amount) {
        throw new Error("Insufficient credits");
      }

      // Deduct credits
      const newBalance = userData.credits - input.amount;
      await db
        .update(users)
        .set({ credits: newBalance })
        .where(eq(users.id, ctx.user.id))
        .execute();

      // Record transaction
      await db.insert(creditTransactions).values({
        userId: ctx.user.id,
        type: "usage",
        amount: -input.amount,
        balanceAfter: newBalance,
        description: input.description,
        messageId: input.messageId,
      }).execute();

      // For pay-as-you-go users, track monthly usage
      if (userData.billingType === "payg") {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const existingBilling = await db
          .select()
          .from(monthlyBilling)
          .where(
            and(
              eq(monthlyBilling.userId, ctx.user.id),
              eq(monthlyBilling.month, currentMonth)
            )
          )
          .limit(1)
          .execute();

        if (existingBilling && existingBilling.length > 0) {
          await db
            .update(monthlyBilling)
            .set({
              creditsUsed: existingBilling[0].creditsUsed + input.amount,
            })
            .where(eq(monthlyBilling.id, existingBilling[0].id))
            .execute();
        } else {
          await db.insert(monthlyBilling).values({
            userId: ctx.user.id,
            month: currentMonth,
            creditsUsed: input.amount,
            amountCharged: "0.00",
            status: "pending",
          }).execute();
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
    const billing = await db
      .select()
      .from(monthlyBilling)
      .where(
        and(
          eq(monthlyBilling.userId, ctx.user.id),
          eq(monthlyBilling.month, currentMonth)
        )
      )
      .limit(1)
      .execute();

    return {
      month: currentMonth,
      creditsUsed: billing[0]?.creditsUsed || 0,
      amountCharged: billing[0]?.amountCharged || "0.00",
      status: billing[0]?.status || "pending",
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
        .where(eq(users.id, ctx.user.id))
        .execute();

      return {
        success: true,
        billingType: input.billingType,
      };
    }),
});
