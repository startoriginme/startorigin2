export type PrivacyMode = 'private' | 'public';

export type BadgeType = 'verified' | 'snowflake' | 'computer' | 'star' | 'crown' | 'diamond' | 'heart' | 'award';

export interface Profile {
  id: string;
  name: string;
  username: string;
  email?: string;
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
  unlocked_patterns: string[] | null;
  shop_unlocked: boolean | null;
  spent_origins: number | null;
  hidden_badges: string[] | null;
  badges_order: string[] | null;
  photo_count: number | null;
  followers_count: number | null;
  sent_origins: number | null;
  received_origins: number | null;
  purchased_gradients: string[] | null;
  active_gradient: string | null;
  purchased_fonts: string[] | null;
  active_font: string | null;
  last_free_spin: string | null;
  used_secret_quest: boolean | null;
  // UI helpers
  following_count?: number;
  is_following?: boolean;
}

export interface Pet {
  id: string;
  name: string;
  image_url: string;
  price: number;
  rarity: string;
}

export interface UserPet {
  id: string;
  user_id: string;
  pet_id: string | null;
  pet_id_name: string | null;
  pet_name: string | null;
  gifted_by: string | null;
  is_active: boolean;
  is_hidden: boolean;
  is_pinned: boolean;
  acquired_at: string;
  pets?: Pet;
  gifter?: { username: string; name: string };
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
  pinned_at: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  is_wall_post?: boolean;
  owner?: Profile;
  likes?: { count: number }[];
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  media_url?: string;
  reactions?: Record<string, string[]>; // emoji -> userIds[]
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

export interface Post {
  id: string;
  user_id: string;
  content: string;
  likes_count: number;
  pinned_at: string | null;
  repost_id: string | null;
  attachments: string[] | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  owner?: Profile;
}
