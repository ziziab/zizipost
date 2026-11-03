export interface PricingInnerInterface {
  current: string;
  month_price: number;
  year_price: number;
  channel?: number;
  posts_per_month: number;
  team_members: boolean;
  community_features: boolean;
  featured_by_gitroom: boolean;
  ai: boolean;
  import_from_channels: boolean;
  image_generator?: boolean;
  image_generation_count: number;
  generate_videos: number;
  clipping_minutes: number;
  public_api: boolean;
  webhooks: number;
  autoPost: boolean;
  // ZIZIPOST: people who can use the workspace (owner included), 0 = no limit
  seats?: number;
  // ZIZIPOST: YouTube uploads per day (shared Google quota), 0 = no limit
  youtube_per_day?: number;
}
export interface PricingInterface {
  [key: string]: PricingInnerInterface;
}
export const pricing: PricingInterface = {
  FREE: {
    current: 'FREE',
    month_price: 0,
    year_price: 0,
    channel: 0,
    image_generation_count: 0,
    posts_per_month: 0,
    team_members: false,
    community_features: false,
    featured_by_gitroom: false,
    ai: false,
    import_from_channels: false,
    image_generator: false,
    public_api: false,
    webhooks: 0,
    autoPost: false,
    generate_videos: 0,
    clipping_minutes: 0,
  },
  // ZIZIPOST plans, sold on ziziab.com (Razorpay), not through Stripe.
  // STANDARD = Starter, TEAM = Creator (and Founder Lifetime), PRO = Agency.
  // Channels: one brand is up to 6 channels. image_generation_count is image credits a month.
  STANDARD: {
    current: 'STANDARD',
    month_price: 265,
    year_price: 2388,
    channel: 6,
    posts_per_month: 1000000,
    image_generation_count: 10,
    team_members: false,
    seats: 1,
    youtube_per_day: 2,
    ai: true,
    community_features: false,
    featured_by_gitroom: false,
    import_from_channels: true,
    image_generator: true,
    public_api: false,
    webhooks: 0,
    autoPost: false,
    generate_videos: 0,
    clipping_minutes: 0,
  },
  TEAM: {
    current: 'TEAM',
    month_price: 599,
    year_price: 5388,
    channel: 18,
    posts_per_month: 1000000,
    image_generation_count: 50,
    community_features: false,
    team_members: true,
    seats: 2,
    youtube_per_day: 4,
    featured_by_gitroom: false,
    ai: true,
    import_from_channels: true,
    image_generator: true,
    public_api: false,
    webhooks: 2,
    autoPost: true,
    generate_videos: 0,
    clipping_minutes: 0,
  },
  PRO: {
    current: 'PRO',
    month_price: 1332,
    year_price: 11988,
    channel: 60,
    posts_per_month: 1000000,
    image_generation_count: 200,
    community_features: false,
    team_members: true,
    seats: 5,
    youtube_per_day: 8,
    featured_by_gitroom: false,
    ai: true,
    import_from_channels: true,
    image_generator: true,
    public_api: true,
    webhooks: 10,
    autoPost: true,
    generate_videos: 0,
    clipping_minutes: 0,
  },
  // ZIZIAB's own workspace: no limits.
  ULTIMATE: {
    current: 'ULTIMATE',
    month_price: 99,
    year_price: 950,
    channel: 100,
    posts_per_month: 1000000,
    image_generation_count: 500,
    community_features: true,
    team_members: true,
    featured_by_gitroom: true,
    ai: true,
    import_from_channels: true,
    image_generator: true,
    public_api: true,
    webhooks: 10000,
    autoPost: true,
    generate_videos: 60,
    clipping_minutes: 600,
  },
};

// Limits apply when Stripe billing is on (Postiz cloud) or when ZIZIPOST plans are
// switched on with ZIZIPOST_PLANS=true (plans paid on ziziab.com).
export const limitsOn = () =>
  !!process.env.STRIPE_PUBLISHABLE_KEY || process.env.ZIZIPOST_PLANS === 'true';

// ZIZIPOST image choices. Credits = how many image credits one picture uses.
export const imageOptions = {
  standard: { model: 'gpt-image-1-mini', quality: 'medium', credits: 1 },
  hd: { model: 'gpt-image-1-mini', quality: 'high', credits: 4 },
  premium: { model: 'gpt-image-2', quality: 'medium', credits: 4 },
  premium_hd: { model: 'gpt-image-2', quality: 'high', credits: 15 },
} as const;
export type ImageOption = keyof typeof imageOptions;
export const imageOption = (key?: string) =>
  imageOptions[
    (key as ImageOption) in imageOptions ? (key as ImageOption) : 'standard'
  ];
