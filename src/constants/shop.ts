import { Shield, Sparkles, Hash, Star, Crown, Diamond, Heart, Award, Rocket, Leaf, Moon, Sun, Music, Book, Coffee, Gamepad, Gift, Smile, Trophy, Zap, ShoppingBag, ShoppingCart } from 'lucide-react';
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
  sparkles: 300
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
  { id: 'shopkeeper', title: "Shopkeepers' Favorite", icon: ShoppingCart, color: "text-purple-500", description: "Spent 500 Origins" },
  { id: 'buyer', title: "Buyer", icon: ShoppingBag, color: "text-green-500", description: "Made first purchase" },
  { id: 'shopping', title: "Shopping", icon: Zap, color: "text-yellow-500", description: "Bought 3 items" },
  { id: 'collector', title: "Collector", icon: Star, color: "text-amber-500", description: "Collected 5 badges" },
  { id: 'big_spender', title: "Big Spender", icon: Trophy, color: "text-red-500", description: "Spent 2000 Origins" },
  { id: 'legendary', title: "Legendary", icon: Crown, color: "text-yellow-500", description: "Bought a legendary item" },
  { id: 'completionist', title: "Completionist", icon: Award, color: "text-emerald-500", description: "Collected all badges" },
  { id: 'daily_shopper', title: "Daily Shopper", icon: ShoppingBag, color: "text-blue-500", description: "Bought 3 days in a row" },
];

export const BADGE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  verified: { icon: Shield, color: 'text-blue-500', label: 'Verified' },
  snowflake: { icon: Sparkles, color: 'text-cyan-400', label: 'Snowflake' },
  computer: { icon: Hash, color: 'text-slate-500', label: 'Compute' },
  star: { icon: Star, color: 'text-amber-400', label: 'Star' },
  crown: { icon: Crown, color: 'text-yellow-500', label: 'Crown' },
  diamond: { icon: Diamond, color: 'text-sky-400', label: 'Diamond' },
  heart: { icon: Heart, color: 'text-pink-500', label: 'Heart' },
  award: { icon: Award, color: 'text-emerald-500', label: 'Award' },
  rocket: { icon: Rocket, color: 'text-red-500', label: 'Rocket' },
  leaf: { icon: Leaf, color: 'text-green-600', label: 'Leaf' },
  moon: { icon: Moon, color: 'text-indigo-400', label: 'Moon' },
  sun: { icon: Sun, color: 'text-orange-500', label: 'Sun' },
  music: { icon: Music, color: 'text-pink-600', label: 'Music' },
  book: { icon: Book, color: 'text-amber-700', label: 'Book' },
  coffee: { icon: Coffee, color: 'text-amber-700', label: 'Coffee' },
  gamepad: { icon: Gamepad, color: 'text-purple-600', label: 'Gamepad' },
  gift: { icon: Gift, color: 'text-red-500', label: 'Gift' },
  smile: { icon: Smile, color: 'text-yellow-500', label: 'Smile' },
  sparkles: { icon: Sparkles, color: 'text-purple-400', label: 'Sparkles' },
};

export const PET_CONFIG = [
  { id: 'cat', name: 'Cat', price: 100, image: 'https://mavebo-puce.vercel.app/cat.png', color: 'bg-amber-100' },
  { id: 'dog', name: 'Dog', price: 150, image: 'https://mavebo-puce.vercel.app/dog.png', color: 'bg-orange-100' },
  { id: 'bat', name: 'Bat', price: 300, image: 'https://mavebo-puce.vercel.app/bat.png', color: 'bg-purple-100' },
  { id: 'owl', name: 'Owl', price: 500, image: 'https://mavebo-puce.vercel.app/owl.png', color: 'bg-indigo-100' },
];

export const GRADIENT_PRICES: Record<string, number> = {
  soft_blue: 7000,
  sunset: 3500,
  emerald: 4000,
  royal: 5000,
  neon: 5000
};

export const GRADIENT_CONFIG: Record<string, { label: string; className: string }> = {
  soft_blue: { label: 'Soft Blue', className: 'bg-gradient-to-r from-blue-400 to-cyan-300 text-transparent bg-clip-text [-webkit-background-clip:text] drop-shadow-sm' },
  sunset: { label: 'Sunset Glow', className: 'bg-gradient-to-r from-orange-400 to-rose-400 text-transparent bg-clip-text [-webkit-background-clip:text]' },
  emerald: { label: 'Emerald Isle', className: 'bg-gradient-to-r from-emerald-400 to-teal-400 text-transparent bg-clip-text [-webkit-background-clip:text]' },
  royal: { label: 'Royal Majesty', className: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-transparent bg-clip-text [-webkit-background-clip:text]' },
  neon: { label: 'Neon Pulse', className: 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-transparent bg-clip-text [-webkit-background-clip:text]' }
};

export const FONT_PRICES: Record<string, number> = {
  modern: 0,
  serif: 2000,
  retro: 1500,
  futuristic: 2500,
  elegant: 3000,
  handwritten: 1000
};

export const FONT_CONFIG: Record<string, { label: string; className: string }> = {
  modern: { label: 'Modern Sans', className: 'font-sans' },
  serif: { label: 'Display Serif', className: 'font-serif-display' },
  retro: { label: 'Retro Mono', className: 'font-retro-mono' },
  futuristic: { label: 'Futuristic', className: 'font-futuristic' },
  elegant: { label: 'Elegant', className: 'font-elegant' },
  handwritten: { label: 'Handwritten', className: 'font-handwritten' }
};
