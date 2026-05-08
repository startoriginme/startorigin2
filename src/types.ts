export type PrivacyMode = 'private' | 'public';

export type BadgeType = 'snowflake' | 'computer' | 'star' | 'crown' | 'diamond' | 'heart' | 'award';

export interface Profile {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  badges: string[];
  is_admin: boolean;
  swipe_count: number | null;
  real_swipe_count: number | null;
  origins_balance: number | null;
  theme_preference: string | null;
  pattern_preference: string | null;
  purchased_badges: string[] | null;
  unlocked_themes: string[] | null;
  purchased_achievements: string[] | null;
  unlocked_patterns: string[] | null;
  shop_unlocked: boolean | null;
  spent_origins: number | null;
  hidden_badges: string[] | null;
  badges_order: string[] | null;
  photo_count: number | null;
  followers_count: number | null;
  sent_origins: number | null;
  received_origins: number | null;
  // UI helpers
  following_count?: number;
  is_following?: boolean;
}

export interface Photo {
  id: string;
  album_id: string | null;
  collection_id: string | null;
  user_id: string;
  name: string;
  url: string;
  privacy: PrivacyMode;
  sort_order: number;
  created_at: string;
  updated_at: string;
  owner?: Profile;
  likes?: { count: number }[];
}

export interface Like {
  id: string;
  user_id: string;
  photo_id: string;
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  privacy: PrivacyMode;
  cover_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  owner?: Profile;
}

export interface Album {
  id: string;
  collection_id: string;
  user_id: string | null;
  name: string;
  privacy: PrivacyMode;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string | null;
  achievement_type: string;
  achievement_name: string;
  achieved_at: string | null;
}
