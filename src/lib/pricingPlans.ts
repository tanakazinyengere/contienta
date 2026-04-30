export interface PricingPlan {
  name: string;
  displayName: string;
  price: string;
  priceLabel: string;
  description: string;
  features: string[];
  cta: string;
  checkoutUrl?: string;
  trust: string;
  badge?: string;
  featured?: boolean;
  highlight?: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    name: "BASIC",
    displayName: "Free",
    price: "0",
    priceLabel: "forever",
    description: "Lay the foundation of your digital authority.",
    features: [
      "5 daily credits",
      "Basic Brand Authority Audit",
      "5 High-Impact Narratives per session",
      "Review your profile confidence signal",
    ],
    cta: "Current Plan",
    trust: "Start your authority journey with no commitment.",
    featured: false,
  },
  {
    name: "PREMIUM",
    displayName: "Platinum",
    price: "9,99 EUR",
    priceLabel: "per month",
    description: "The essential toolkit for rising professionals.",
    features: [
      "40 generations/week",
      "Full unblurred audit",
      "Authority prompts & workflow polish",
      "Priority onboarding support",
    ],
    cta: "Secure Checkout",
    checkoutUrl: "https://checkout.revolut.com/pay/cbba696a-b4cb-4e9e-8801-19de36ea961e",
    trust: "Join 500+ rising professionals.",
    featured: false,
  },
  {
    name: "GROWTH",
    displayName: "Diamond",
    price: "23,89 EUR",
    priceLabel: "per month",
    description: "Engineered for high-velocity reach.",
    features: [
      "100 generations/week",
      "PostLab Thinking Mode",
      "Peak-time Strategic Distribution",
      "AI Visual Engine",
    ],
    cta: "Secure Checkout",
    checkoutUrl: "https://checkout.revolut.com/pay/2afe50ec-772c-4b56-bd97-59cc1271db73",
    trust: "The #1 choice for LinkedIn Thought Leaders.",
    featured: true,
    highlight: true,
  },
  {
    name: "EXECUTIVE",
    displayName: "Gold",
    price: "56,84 EUR",
    priceLabel: "per month",
    description: "Maximum authority for high-stakes brands.",
    features: [
      "Unlimited generations",
      "Multi-Page management",
      "Predictive Analytics",
      "Admin Support",
    ],
    cta: "Secure Checkout",
    checkoutUrl: "https://checkout.revolut.com/pay/45f197fe-6737-4354-ad74-5bb26655959d",
    trust: "Maximum ROI for Executive Brands.",
    featured: false,
  },
];
