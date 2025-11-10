import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Sparkles, Zap, Rocket } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

const pricingPlans = [
  {
    name: "Starter",
    credits: 200,
    price: 10,
    pricePerCredit: 0.05,
    icon: Sparkles,
    description: "Perfect for trying out the platform",
    features: [
      "200 credits",
      "~20-40 messages",
      "Access to all AI models",
      "5¢ per credit",
    ],
  },
  {
    name: "Popular",
    credits: 600,
    price: 25,
    pricePerCredit: 0.042,
    icon: Zap,
    description: "Best value for regular users",
    isPopular: true,
    features: [
      "600 credits",
      "~60-120 messages",
      "Access to all AI models",
      "4.2¢ per credit",
      "16% savings",
    ],
  },
  {
    name: "Pro",
    credits: 1500,
    price: 50,
    pricePerCredit: 0.033,
    icon: Rocket,
    description: "For power users",
    features: [
      "1,500 credits",
      "~150-300 messages",
      "Access to all AI models",
      "3.3¢ per credit",
      "34% savings",
    ],
  },
];

export default function Pricing() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { data: balance } = trpc.credits.getBalance.useQuery();

  const handlePurchase = (planName: string) => {
    setSelectedPlan(planName);
    toast.info("Stripe integration coming soon!");
    // TODO: Implement Stripe checkout
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Buy Credits</h1>
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              Back to Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Current Balance */}
      {balance && (
        <div className="container mx-auto px-4 py-6">
          <Card className="bg-card border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Current Balance
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {balance.billingType === "prepaid"
                    ? "Pre-paid credits"
                    : "Pay-as-you-go"}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-foreground">
                  {balance.credits}
                </div>
                <div className="text-sm text-muted-foreground">credits</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Pricing Plans */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
          <p className="text-muted-foreground text-lg">
            One platform, all AI models. Save 70%+ vs separate subscriptions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {pricingPlans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.name}
                className={`bg-card border-2 p-6 relative shadow-sm ${
                  plan.isPopular
                    ? "border-primary"
                    : "border-border hover:border-primary/50"
                } transition-all`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                      BEST VALUE
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                </div>

                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-foreground mb-1">
                    ${plan.price}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {plan.credits} credits
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePurchase(plan.name)}
                  className={`w-full ${
                    plan.isPopular
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "bg-accent hover:bg-accent/80 text-accent-foreground"
                  }`}
                  disabled={selectedPlan === plan.name}
                >
                  {selectedPlan === plan.name ? "Processing..." : "Purchase"}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Pay-as-you-go Option */}
        <div className="max-w-3xl mx-auto mt-12">
          <Card className="bg-card border-border p-8 shadow-sm">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Or Try Pay-As-You-Go
              </h3>
              <p className="text-muted-foreground">
                Only pay for what you use, no commitment required
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-accent/50 rounded-lg p-6">
                <h4 className="font-semibold text-foreground mb-2">How it works</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 6¢ per credit (slightly higher than pre-paid)</li>
                  <li>• Automatic billing at end of month</li>
                  <li>• $100 monthly spending cap (adjustable)</li>
                  <li>• Cancel anytime, no questions asked</li>
                </ul>
              </div>

              <div className="bg-accent/50 rounded-lg p-6">
                <h4 className="font-semibold text-foreground mb-2">
                  Perfect for light users
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Use 20 messages = ~$3-6/month</li>
                  <li>• vs $80+ for all subscriptions</li>
                  <li>• Save 92%+ compared to separate plans</li>
                  <li>• No unused subscription fees</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button
                variant="outline"
                className="border-border hover:bg-accent"
                onClick={() => toast.info("Feature coming soon!")}
              >
                Switch to Pay-As-You-Go
              </Button>
            </div>
          </Card>
        </div>

        {/* Model Costs Reference */}
        <div className="max-w-3xl mx-auto mt-12">
          <Card className="bg-card border-border p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Credit Costs Per Model
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { name: "GPT-5 Pro", credits: 25, cost: "$1.25" },
                { name: "GPT-5", credits: 15, cost: "$0.75" },
                { name: "Claude Opus 4.1", credits: 20, cost: "$1.00" },
                { name: "Claude Sonnet 4.5", credits: 12, cost: "$0.60" },
                { name: "GPT-4", credits: 10, cost: "$0.50" },
                { name: "Claude Sonnet 4", credits: 10, cost: "$0.50" },
                { name: "Claude 3.7 Sonnet", credits: 8, cost: "$0.40" },
                { name: "Sonar Pro", credits: 8, cost: "$0.40" },
                { name: "Claude Haiku 4.5", credits: 6, cost: "$0.30" },
                { name: "Sonar", credits: 3, cost: "$0.15" },
                { name: "Gemini 2.0 Flash", credits: 2, cost: "$0.10" },
              ].map((model) => (
                <div
                  key={model.name}
                  className="flex items-center justify-between bg-accent/50 rounded-lg p-3"
                >
                  <span className="text-foreground">{model.name}</span>
                  <div className="text-right">
                    <div className="text-foreground font-semibold">
                      {model.credits} credits
                    </div>
                    <div className="text-xs text-muted-foreground">{model.cost}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
