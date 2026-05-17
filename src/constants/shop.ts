import { BadgeCheck, Snowflake, Shield, Sparkles, Hash, Star, Crown, Diamond, Heart, Award, Rocket, Leaf, Moon, Sun, Music, Book, Coffee, Gamepad, Gift, Smile, Trophy, Zap, ShoppingBag, ShoppingCart, Headphones } from 'lucide-react';
import React from 'react';

export const BADGE_PRICES: Record<string, number> = {
  snowflake: 300,
  computer: 300,
  star: 200,
  crown: 1000,
  diamond: 1500,
  heart: 150,
  award: 400,
  rocket: 600,
  leaf: 100,
  moon: 250,
  sun: 250,
  music: 200,
  book: 150,
  coffee: 100,
  gamepad: 350,
  gift: 200,
  smile: 100,
  sparkles: 300,
  headphones: 3000
};

export const THEME_PRICES: Record<string, number> = {
  black: 200,
  pink: 150,
  gray: 100,
  green: 150,
  blue: 200,
  purple: 250,
  orange: 200,
  red: 250
};

export const PATTERN_PRICES: Record<string, number> = {
  circles: 100,
  triangles: 150,
  squares: 150,
  flowers: 200,
  hearts: 250,
  stars: 300
};

export const ACHIEVEMENT_PRICES: Record<string, number> = {
  shopkeeper: 500,
  buyer: 100,
  shopping: 300,
  collector: 1000,
  big_spender: 2000,
  legendary: 1500,
  completionist: 5000,
  daily_shopper: 800
};

export const SHOP_ACHIEVEMENTS = [
  { id: 'shopkeeper', title: "Shopkeepers' Favorite", icon: ShoppingCart, color: "text-blue-400", description: "Spent 500 Origins" },
  { id: 'buyer', title: "Buyer", icon: ShoppingBag, color: "text-green-500", description: "Made first purchase" },
  { id: 'shopping', title: "Shopping", icon: Zap, color: "text-yellow-500", description: "Bought 3 items" },
  { id: 'collector', title: "Collector", icon: Star, color: "text-amber-500", description: "Collected 5 badges" },
  { id: 'big_spender', title: "Big Spender", icon: Trophy, color: "text-red-500", description: "Spent 2000 Origins" },
  { id: 'legendary', title: "Legendary", icon: Crown, color: "text-yellow-500", description: "Bought a legendary item" },
  { id: 'completionist', title: "Completionist", icon: Award, color: "text-emerald-500", description: "Collected all badges" },
  { id: 'daily_shopper', title: "Daily Shopper", icon: ShoppingBag, color: "text-blue-400", description: "Bought 3 days in a row" },
];

export const BADGE_CONFIG: Record<string, { icon: React.ElementType; color: string; key: string }> = {
  verified: { icon: BadgeCheck, color: 'text-blue-400', key: 'verified' },
  snowflake: { icon: Snowflake, color: 'text-cyan-400', key: 'snowflake' },
  computer: { icon: Hash, color: 'text-slate-500', key: 'computer' },
  star: { icon: Star, color: 'text-amber-400', key: 'star' },
  crown: { icon: Crown, color: 'text-yellow-500', key: 'crown' },
  diamond: { icon: Diamond, color: 'text-sky-400', key: 'diamond' },
  heart: { icon: Heart, color: 'text-pink-500', key: 'heart' },
  award: { icon: Award, color: 'text-emerald-500', key: 'award' },
  rocket: { icon: Rocket, color: 'text-red-500', key: 'rocket' },
  leaf: { icon: Leaf, color: 'text-green-600', key: 'leaf' },
  moon: { icon: Moon, color: 'text-indigo-400', key: 'moon' },
  sun: { icon: Sun, color: 'text-orange-500', key: 'sun' },
  music: { icon: Music, color: 'text-pink-600', key: 'music' },
  book: { icon: Book, color: 'text-amber-700', key: 'book' },
  coffee: { icon: Coffee, color: 'text-amber-700', key: 'coffee' },
  gamepad: { icon: Gamepad, color: 'text-purple-600', key: 'gamepad' },
  gift: { icon: Gift, color: 'text-red-500', key: 'gift' },
  smile: { icon: Smile, color: 'text-yellow-500', key: 'smile' },
  sparkles: { icon: Sparkles, color: 'text-purple-400', key: 'sparkles' },
  headphones: { icon: Headphones, color: 'text-indigo-500', key: 'headphones' },
};

export const PET_CONFIG = [
  { id: 'cat', key: 'cat', price: 100, image: 'https://mavebo-puce.vercel.app/cat.png', color: 'bg-amber-100' },
  { id: 'dog', key: 'dog', price: 150, image: 'https://mavebo-puce.vercel.app/dog.png', color: 'bg-orange-100' },
  { id: 'bat', key: 'bat', price: 300, image: 'https://mavebo-puce.vercel.app/bat.png', color: 'bg-purple-100' },
  { id: 'owl', key: 'owl', price: 500, image: 'https://mavebo-puce.vercel.app/owl.png', color: 'bg-indigo-100' },
];

export const GRADIENT_PRICES: Record<string, number> = {
  soft_blue: 7000,
  sunset: 3500,
  emerald: 4000,
  royal: 5000,
  neon: 5000
};

export const GRADIENT_CONFIG: Record<string, { key: string; className: string }> = {
  soft_blue: { key: 'soft_blue', className: 'text-blue-400 inline-block' },
  sunset: { key: 'sunset', className: 'text-orange-500 inline-block' },
  emerald: { key: 'emerald', className: 'text-emerald-500 inline-block' },
  royal: { key: 'royal', className: 'text-purple-500 inline-block' },
  neon: { key: 'neon', className: 'text-fuchsia-500 inline-block' }
};

export const FONT_PRICES: Record<string, number> = {
  modern: 0,
  retro: 1500,
  futuristic: 2500,
  elegant: 3000,
  handwritten: 1000,
  comic: 4000,
  cute: 3500,
  marker: 3000,
  sf_italic: 5000
};

export const FONT_CONFIG: Record<string, { key: string; className: string }> = {
  modern: { key: 'modern', className: 'font-sans' },
  retro: { key: 'retro', className: 'font-retro-mono' },
  futuristic: { key: 'futuristic', className: 'font-futuristic' },
  elegant: { key: 'elegant', className: 'font-elegant' },
  handwritten: { key: 'handwritten', className: 'font-handwritten' },
  comic: { key: 'comic', className: 'font-comic tracking-wider' },
  cute: { key: 'cute', className: 'font-cute' },
  marker: { key: 'marker', className: 'font-marker' },
  sf_italic: { key: 'sf_italic', className: 'font-[var(--font-sf)] italic uppercase font-bold tracking-tight' }
};

export const ALIAS_PRICES: Record<number, number> = {
  1: 10000,
  2: 8000,
  3: 6000,
  4: 4000,
  5: 2000,
  6: 900,
  7: 700
};

export function calculateAliasPrice(length: number): number {
  if (length === 0) return 0;
  return ALIAS_PRICES[length] || 500;
}
