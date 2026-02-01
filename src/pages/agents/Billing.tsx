import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Check, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "Perfect for small businesses",
    features: [
      "1 AI Agent",
      "500 minutes/month",
      "Basic analytics",
      "Email support",
    ],
    current: false,
  },
  {
    name: "Professional",
    price: "$149",
    period: "/month",
    description: "For growing teams",
    features: [
      "3 AI Agents",
      "2,000 minutes/month",
      "Advanced analytics",
      "Priority support",
      "Custom knowledge base",
    ],
    current: false,
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations",
    features: [
      "Unlimited agents",
      "Unlimited minutes",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
      "Custom training",
    ],
    current: false,
  },
];

const Billing = () => {
  return (
    <AgentLayout
      title="Billing"
      description="Manage your subscription and payment details"
    >
      <div className="space-y-6">
        {/* Current Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Current Usage</CardTitle>
            <CardDescription>Your usage for this billing period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Minutes Used</p>
                <p className="text-2xl font-bold">0 / 500</p>
                <div className="w-full h-2 bg-muted rounded-full mt-2">
                  <div className="h-2 bg-primary rounded-full" style={{ width: "0%" }} />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Agents</p>
                <p className="text-2xl font-bold">0 / 1</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-2xl font-bold">Free Trial</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.popular ? "border-primary shadow-lg" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.popular && <Badge>Popular</Badge>}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.name === "Enterprise" ? "Contact Sales" : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Manage your payment information</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <CreditCard className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-4">No payment method on file</p>
            <Button variant="outline">Add Payment Method</Button>
          </CardContent>
        </Card>
      </div>
    </AgentLayout>
  );
};

export default Billing;
