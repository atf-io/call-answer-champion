import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Check, Zap, RefreshCw, Loader2, Settings, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSubscription, SUBSCRIPTION_PLANS, TOPOFF_PACKAGES } from "@/hooks/useSubscription";
import { format } from "date-fns";

const Billing = () => {
  const [searchParams] = useSearchParams();
  const {
    subscription,
    isLoading,
    isCheckoutLoading,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    getCurrentPlan,
  } = useSubscription();

  const currentPlan = getCurrentPlan();

  // Handle success/cancel from Stripe redirect
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Payment successful! Your subscription is now active.");
      checkSubscription();
    } else if (searchParams.get("canceled") === "true") {
      toast.info("Payment was canceled.");
    }
  }, [searchParams, checkSubscription]);

  const plans = [
    {
      ...SUBSCRIPTION_PLANS.starter,
      description: "Perfect for small businesses",
      features: [
        `${SUBSCRIPTION_PLANS.starter.agents} AI Agent`,
        `${SUBSCRIPTION_PLANS.starter.minutes} minutes/month`,
        "Basic analytics",
        "Email support",
      ],
      popular: false,
    },
    {
      ...SUBSCRIPTION_PLANS.professional,
      description: "For growing teams",
      features: [
        `${SUBSCRIPTION_PLANS.professional.agents} AI Agents`,
        `${SUBSCRIPTION_PLANS.professional.minutes.toLocaleString()} minutes/month`,
        "Advanced analytics",
        "Priority support",
        "Custom knowledge base",
      ],
      popular: true,
    },
    {
      ...SUBSCRIPTION_PLANS.enterprise,
      description: "For large organizations",
      features: [
        `${SUBSCRIPTION_PLANS.enterprise.agents} AI Agents`,
        `${SUBSCRIPTION_PLANS.enterprise.minutes.toLocaleString()} minutes/month`,
        "Custom integrations",
        "Dedicated support",
        "SLA guarantee",
      ],
      popular: false,
    },
  ];

  const topoffs = Object.values(TOPOFF_PACKAGES);

  return (
    <AgentLayout
      title="Billing"
      description="Manage your subscription and payment details"
    >
      <div className="space-y-6">
        {/* Current Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Current Usage</CardTitle>
              <CardDescription>Your usage for this billing period</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkSubscription}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Minutes Used</p>
                <p className="text-2xl font-bold">
                  0 / {subscription?.minutes_included || 0}
                </p>
                <div className="w-full h-2 bg-muted rounded-full mt-2">
                  <div className="h-2 bg-primary rounded-full" style={{ width: "0%" }} />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Agents</p>
                <p className="text-2xl font-bold">0 / {currentPlan?.agents || 1}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-2xl font-bold">
                  {subscription?.plan_name || "No Plan"}
                </p>
                {subscription?.subscription_end && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Renews {format(new Date(subscription.subscription_end), "MMM d, yyyy")}
                  </p>
                )}
              </div>
              <div className="flex items-end">
                {subscription?.subscribed && (
                  <Button variant="outline" onClick={openCustomerPortal}>
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Subscription
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Subscription Plans</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrent = currentPlan?.product_id === plan.product_id;
              
              return (
                <Card 
                  key={plan.name} 
                  className={`relative ${plan.popular ? "border-primary shadow-lg" : ""} ${isCurrent ? "ring-2 ring-primary" : ""}`}
                >
                  {isCurrent && (
                    <Badge className="absolute -top-2 left-4" variant="default">
                      Your Plan
                    </Badge>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{plan.name}</CardTitle>
                      {plan.popular && !isCurrent && <Badge variant="secondary">Popular</Badge>}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
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
                      variant={isCurrent ? "outline" : plan.popular ? "default" : "outline"}
                      disabled={isCurrent || isCheckoutLoading}
                      onClick={() => createCheckout(plan.price_id, 'subscription')}
                    >
                      {isCheckoutLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isCurrent ? (
                        "Current Plan"
                      ) : subscription?.subscribed ? (
                        "Switch Plan"
                      ) : (
                        "Subscribe"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Minute Top-Offs */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Add Extra Minutes</h2>
          <p className="text-muted-foreground mb-4">
            Need more minutes? Purchase a one-time top-off package.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {topoffs.map((topoff) => (
              <Card key={topoff.name}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{topoff.name}</CardTitle>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">${topoff.price}</span>
                    <span className="text-muted-foreground text-sm">one-time</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add {topoff.minutes.toLocaleString()} minutes to your account instantly.
                  </p>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    disabled={isCheckoutLoading}
                    onClick={() => createCheckout(topoff.price_id, 'payment')}
                  >
                    {isCheckoutLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Buy Now
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Manage your payment information</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            {subscription?.subscribed ? (
              <>
                <CreditCard className="w-12 h-12 text-primary mb-4" />
                <p className="text-muted-foreground mb-4">
                  Payment method on file
                </p>
                <Button variant="outline" onClick={openCustomerPortal}>
                  Update Payment Method
                </Button>
              </>
            ) : (
              <>
                <CreditCard className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">No payment method on file</p>
                <p className="text-sm text-muted-foreground">
                  Subscribe to a plan to add a payment method
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AgentLayout>
  );
};

export default Billing;