import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Stripe product and price IDs
export const SUBSCRIPTION_PLANS = {
  starter: {
    name: 'Started',
    product_id: 'prod_TwX2BkzBiDXJA1',
    price_id: 'price_1SydyfRtSnQCeIF27E3vYW5P',
    price: 299,
    minutes: 500,
    agents: 1,
  },
  professional: {
    name: 'Growth',
    product_id: 'prod_TwX3jrpPdYVOHn',
    price_id: 'price_1SydyvRtSnQCeIF2gc4WGoeR',
    price: 499,
    minutes: 1500,
    agents: 3,
  },
  enterprise: {
    name: 'Enterprise',
    product_id: 'prod_TwX3QEXXTnpTXK',
    price_id: 'price_1SydzFRtSnQCeIF2tBZsSFtT',
    price: 899,
    minutes: 5000,
    agents: 10,
  },
} as const;

export const TOPOFF_PACKAGES = {
  small: {
    name: '100 Minutes',
    product_id: 'prod_TwX3keb643ckVq',
    price_id: 'price_1SydzXRtSnQCeIF2E69ZgupO',
    price: 15,
    minutes: 100,
  },
  medium: {
    name: '500 Minutes',
    product_id: 'prod_TwX31FV02724cW',
    price_id: 'price_1SydzfRtSnQCeIF2xAtVo6q7',
    price: 60,
    minutes: 500,
  },
  large: {
    name: '1,000 Minutes',
    product_id: 'prod_TwX4LuzrEYUkho',
    price_id: 'price_1SydztRtSnQCeIF2TYLWHqbM',
    price: 100,
    minutes: 1000,
  },
} as const;

export interface SubscriptionStatus {
  subscribed: boolean;
  product_id: string | null;
  plan_name: string | null;
  subscription_end: string | null;
  minutes_included: number;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription({
        subscribed: false,
        product_id: null,
        plan_name: null,
        subscription_end: null,
        minutes_included: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const createCheckout = async (priceId: string, mode: 'subscription' | 'payment' = 'subscription') => {
    if (!user) {
      toast.error('Please log in to subscribe');
      return;
    }

    setIsCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, mode },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      toast.error('Please log in to manage subscription');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open subscription management');
    }
  };

  const getCurrentPlan = () => {
    if (!subscription?.subscribed || !subscription.product_id) return null;
    
    return Object.values(SUBSCRIPTION_PLANS).find(
      plan => plan.product_id === subscription.product_id
    ) || null;
  };

  return {
    subscription,
    isLoading,
    isCheckoutLoading,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    getCurrentPlan,
  };
}
