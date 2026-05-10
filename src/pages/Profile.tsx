import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Profile as ProfileType, Photo, BadgeType } from '../types';
import { 
  UserPlus, UserCheck, Images, BadgeCheck, Snowflake, Monitor, Star, 
  Settings, Trophy, Flame, Camera, Sparkles, X, Search, Upload, Eye, 
  EyeOff, Edit2, Minus, Plus, Coins, Glasses, Crown, Diamond, Heart, 
  Award, ShoppingCart, ShoppingBag, Zap, Rocket, Leaf, Moon, Sun, 
  Music, Book, Coffee, Gamepad, Gift, Smile, Loader2, User, Grid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PhotoViewer from '../components/PhotoViewer';
import { cn, formatCount } from '../lib/utils';

interface Pet {
  id: string;
  name: string;
  image_url: string;
  price: number;
  rarity: string;
}

interface UserPet {
  id: string;
  user_id: string;
  pet_id: string | null;
  pet_id_name: string | null;
  pet_name: string | null;
  gifted_by: string | null;
  is_active: boolean;
  is_hidden: boolean;
  acquired_at: string;
  pets?: Pet;
  gifter?: { username: string; name: string };
}

// РАСШИРЕННАЯ КОНФИГУРАЦИЯ ЗНАЧКОВ
const BADGE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  verified: { icon: BadgeCheck, color: 'text-blue-500', label: 'Verified' },
  snowflake: { icon: Snowflake, color: 'text-cyan-400', label: 'Snowflake' },
  computer: { icon: Monitor, color: 'text-violet-500', label: 'Computer' },
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

// Ачивки за свайпы
const SWIPE_ACHIEVEMENTS = [
  { count: 10, title: "Photo Explorer", icon: Camera, color: "text-green-500", description: "Swiped 10 photos" },
  { count: 30, title: "Photo Hunter", icon: Search, color: "text-blue-500", description: "Swiped 30 photos" },
  { count: 60, title: "Photo Master", icon: Star, color: "text-purple-500", description: "Swiped 60 photos" },
  { count: 120, title: "Photo Legend", icon: Flame, color: "text-orange-500", description: "Swiped 120 photos" },
  { count: 250, title: "Photo Guru", icon: Sparkles, color: "text-yellow-500", description: "Swiped 250 photos" },
  { count: 500, title: "Photo God", icon: Trophy, color: "text-cyan-500", description: "Swiped 500 photos" },
];

// Ачивки за загруженные фотки
const UPLOAD_ACHIEVEMENTS = [
  { count: 1, title: "First Step", icon: Upload, color: "text-gray-500", description: "Uploaded first photo" },
  { count: 5, title: "Getting Started", icon: Camera, color: "text-green-500", description: "Uploaded 5 photos" },
  { count: 10, title: "Photo Enthusiast", icon: Camera, color: "text-green-500", description: "Uploaded 10 photos" },
  { count: 15, title: "Shutterbug", icon: Camera, color: "text-emerald-500", description: "Uploaded 15 photos" },
  { count: 20, title: "Getting Serious", icon: Flame, color: "text-orange-500", description: "Uploaded 20 photos" },
  { count: 25, title: "Dedicated", icon: Flame, color: "text-orange-500", description: "Uploaded 25 photos" },
  { count: 30, title: "Photography Addict", icon: Star, color: "text-purple-500", description: "Uploaded 30 photos" },
  { count: 35, title: "Photo Lover", icon: Star, color: "text-purple-500", description: "Uploaded 35 photos" },
  { count: 40, title: "Creative Eye", icon: Star, color: "text-purple-500", description: "Uploaded 40 photos" },
  { count: 45, title: "Visual Artist", icon: Star, color: "text-indigo-500", description: "Uploaded 45 photos" },
  { count: 50, title: "Photography Pro", icon: Trophy, color: "text-yellow-500", description: "Uploaded 50 photos" },
  { count: 55, title: "Expert", icon: Trophy, color: "text-yellow-500", description: "Uploaded 55 photos" },
  { count: 60, title: "Master Photographer", icon: Trophy, color: "text-yellow-500", description: "Uploaded 60 photos" },
  { count: 65, title: "Visionary", icon: Trophy, color: "text-amber-500", description: "Uploaded 65 photos" },
  { count: 70, title: "Photo Virtuoso", icon: Trophy, color: "text-amber-500", description: "Uploaded 70 photos" },
  { count: 75, title: "Artistic Soul", icon: Sparkles, color: "text-pink-500", description: "Uploaded 75 photos" },
  { count: 80, title: "Photo Legend", icon: Sparkles, color: "text-pink-500", description: "Uploaded 80 photos" },
  { count: 85, title: "Iconic", icon: Sparkles, color: "text-rose-500", description: "Uploaded 85 photos" },
  { count: 90, title: "Masterpiece Creator", icon: Sparkles, color: "text-rose-500", description: "Uploaded 90 photos" },
  { count: 95, title: "Photography Guru", icon: Trophy, color: "text-purple-500", description: "Uploaded 95 photos" },
  { count: 100, title: "Photo God", icon: Trophy, color: "text-cyan-500", description: "Uploaded 100 photos" },
];

// Ачивки из магазина (РАСШИРЕННЫЕ)
const SHOP_ACHIEVEMENTS = [
  { title: "Shopkeepers' Favorite", icon: ShoppingCart, color: "text-purple-500", description: "Spent 500 Origins in shop" },
  { title: "Buyer", icon: ShoppingBag, color: "text-green-500", description: "Made first purchase" },
  { title: "Shopping", icon: Zap, color: "text-yellow-500", description: "Bought 3 items" },
  { title: "Collector", icon: Star, color: "text-amber-500", description: "Collected 5 badges" },
  { title: "Big Spender", icon: Trophy, color: "text-red-500", description: "Spent 2000 Origins in shop" },
  { title: "Legendary", icon: Crown, color: "text-yellow-500", description: "Bought a legendary item" },
  { title: "Completionist", icon: Award, color: "text-emerald-500", description: "Collected all badges" },
  { title: "Daily Shopper", icon: ShoppingBag, color: "text-blue-500", description: "Bought something 3 days in a row" },
];

// Секретные ачивки
const SECRET_ACHIEVEMENTS = [
  { title: "Secret Agent: 1st Quest", icon: Glasses, color: "text-purple-500", description: "Completed the first secret quest" },
];

type Achievement = {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_name: string;
  achieved_at: string;
};

// Theme configurations
const THEMES: Record<string, { bg: string; text: string }> = {
  default: { bg: 'bg-white dark:bg-gray-900', text: 'text-black dark:text-white' },
  black: { bg: 'bg-black', text: 'text-white' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-900' },
  gray: { bg: 'bg-gray-300', text: 'text-gray-800' },
  green: { bg: 'bg-green-100', text: 'text-green-900' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-900 dark:text-blue-100' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-900 dark:text-purple-100' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-900 dark:text-orange-100' },
  red: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-900 dark:text-red-100' },
};

// Pattern configurations
const PATTERNS: Record<string, string> = {
  none: '',
  circles: 'bg-[radial-gradient(circle_at_center,_#999_1px,_transparent_1px)] bg-[length:20px_20px]',
  triangles: 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20fill%3D%22%23999%22%20fill-opacity%3D%220.15%22%20d%3D%22M10%200L20%2017.32H0L10%200z%22%2F%3E%3C%2Fsvg%3E")] bg-[length:20px_20px]',
  squares: 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%3E%3Crect%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23999%22%20fill-opacity%3D%220.15%22%2F%3E%3C%2Fsvg%3E")] bg-[length:20px_20px]',
  flowers: 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%2210%22%20r%3D%223%22%20fill%3D%22%23999%22%20fill-opacity%3D%220.15%22%2F%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%223%22%20r%3D%222%22%20fill%3D%22%23999%22%20fill-opacity%3D%220.15%22%2F%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%2217%22%20r%3D%222%22%20fill%3D%22%23999%22%20fill-opacity%3D%220.15%22%2F%3E%3Ccircle%20cx%3D%223%22%20cy%3D%2210%22%20r%3D%222%22%20fill%3D%22%23999%22%20fill-opacity%3D%220.15%22%2F%3E%3Ccircle%20cx%3D%2217%22%20cy%3D%2210%22%20r%3D%222%22%20fill%3D%22%23999%22%20fill-opacity%3D%220.15%22%2F%3E%3C%2Fsvg%3E")] bg-[length:20px_20px]',
  hearts: 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20fill%3D%22%23999%22%20fill-opacity%3D%220.15%22%20d%3D%22M10%2018l-1.5-1.4C4.5%2012.8%202%2010.5%202%207.5%202%205%204%203%206.5%203c1.5%200%202.9.8%203.5%202.1.6-1.3%202-2.1%203.5-2.1C16%203%2018%205%2018%207.5c0%203-2.5%205.3-6.5%209.1L10%2018z%22%2F%3E%3C%2Fsvg%3E")] bg-[length:20px_20px]',
  stars: 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpolygon%20fill%3D%22%23999%22%20fill-opacity%3D%220.15%22%20points%3D%2210%200%2013%207%2020%207%2015%2011%2017%2018%2010%2014%203%2018%205%2011%200%207%207%207%22%2F%3E%3C%2Fsvg%3E")] bg-[length:20px_20px]',
};

export default function Profile({ user, onUpdate }: { user: any, onUpdate?: (id: string) => void }) {
  const { username } = useParams();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollows, setShowFollows] = useState(false);
  const [followsTab, setFollowsTab] = useState<'followers' | 'following'>('followers');
  const [followsList, setFollowsList] = useState<any[]>([]);
  const [loadingFollows, setLoadingFollows] = useState(false);
  const [viewer, setViewer] = useState<Photo | null>(null);
  const [swipeCount, setSwipeCount] = useState(0);
  const [originalSwipeCount, setOriginalSwipeCount] = useState(0);
  const [uploadCount, setUploadCount] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showSwipeEditor, setShowSwipeEditor] = useState(false);
  const [tempSwipeValue, setTempSwipeValue] = useState(0);
  const [hideSwipeCount, setHideSwipeCount] = useState(false);
  const [hiddenAchievements, setHiddenAchievements] = useState<Set<string>>(new Set());
  const [showHiddenAchievements, setShowHiddenAchievements] = useState(false);
  const [originsBalance, setOriginsBalance] = useState(0);
  const [maxOriginsBalance, setMaxOriginsBalance] = useState(0);
  const [spentOrigins, setSpentOrigins] = useState(0);
  const [receivedOrigins, setReceivedOrigins] = useState(0);
  
  // Badge settings
  const [hiddenBadges, setHiddenBadges] = useState<string[]>([]);
  const [badgesOrder, setBadgesOrder] = useState<string[]>(['verified', 'star', 'computer', 'snowflake', 'crown', 'diamond', 'heart', 'award', 'rocket', 'leaf', 'moon', 'sun', 'music', 'book', 'coffee', 'gamepad', 'gift', 'smile', 'sparkles']);
  
  // Decoration state
  const [themePreference, setThemePreference] = useState<string>('default');
  const [patternPreference, setPatternPreference] = useState<string>('none');

  // Pets state
  const [userPets, setUserPets] = useState<UserPet[]>([]);
  const [allPets, setAllPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<UserPet | null>(null);
  const [activeTab, setActiveTab] = useState<'photos' | 'pets' | 'achievements'>('photos');
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [gifting, setGifting] = useState(false);
  const [giftSearchQuery, setGiftSearchQuery] = useState('');
  const [giftSearchResults, setGiftSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [selling, setSelling] = useState(false);
  const [showSellConfirm, setShowSellConfirm] = useState(false);

  const isOwn = !username || (user && profile?.id === user.id);

  useEffect(() => {
    fetchProfile();
  }, [username, user]);

  useEffect(() => {
    if (profile) {
      loadUserStats();
      loadAchievements();
      loadUserSettings();
      loadDecorations();
      loadBadgeSettings();
      loadPets();
      fetchPhotos();
      checkFollowStatus();
    }
  }, [profile]);

  useEffect(() => {
    if (uploadCount > 0 && isOwn) {
      checkAndAddUploadAchievements();
    }
  }, [uploadCount]);

  useEffect(() => {
    if (profile) calculateOriginsBalance();
  }, [swipeCount, uploadCount, receivedOrigins, profile]);

  async function fetchProfile() {
    setLoading(true);
    let query = supabase.from('profiles').select('*');
    if (username) {
      query = query.eq('username', username);
    } else if (user) {
      query = query.eq('id', user.id);
    }
    const { data } = await query.single();
    if (data) setProfile(data);
    setLoading(false);
  }

  async function fetchPhotos() {
    if (!profile) return;
    const { data } = await supabase
      .from('photos')
      .select('*')
      .eq('user_id', profile.id)
      .eq('privacy', 'public')
      .order('created_at', { ascending: false });
    if (data) setPhotos(data);
  }

  async function checkFollowStatus() {
    if (!user || !profile) return;
    const { data } = await supabase.from('follows').select('*').eq('follower_id', user.id).eq('following_id', profile.id).single();
    setFollowing(!!data);
    setFollowersCount(profile.followers_count || 0);
    setFollowingCount(profile.following_count || 0);
  }

  async function fetchFollows(type: 'followers' | 'following') {
    if (!profile) return;
    setLoadingFollows(true);
    setFollowsTab(type);
    setShowFollows(true);

    const matchField = type === 'followers' ? 'following_id' : 'follower_id';
    const selectField = type === 'followers' ? 'profiles:follower_id (*)' : 'profiles:following_id (*)';

    const { data, error } = await supabase
      .from('follows')
      .select(selectField)
      .eq(matchField, profile.id);

    if (data) {
      const list = data.map((f: any) => f.profiles);
      setFollowsList(list);
    }
    setLoadingFollows(false);
  }

  async function loadBadgeSettings() {
    if (!profile) return;
    const { data } = await supabase.from('profiles').select('hidden_badges, badges_order').eq('id', profile.id).single();
    if (data) {
      setHiddenBadges(data.hidden_badges || []);
      setBadgesOrder(data.badges_order || ['verified', 'star', 'computer', 'snowflake', 'crown', 'diamond', 'heart', 'award', 'rocket', 'leaf', 'moon', 'sun', 'music', 'book', 'coffee', 'gamepad', 'gift', 'smile', 'sparkles']);
    }
  }

  async function loadDecorations() {
    if (!profile) return;
    const { data } = await supabase.from('profiles').select('theme_preference, pattern_preference').eq('id', profile.id).single();
    if (data) {
      setThemePreference(data.theme_preference || 'default');
      setPatternPreference(data.pattern_preference || 'none');
    }
  }

  async function loadPets() {
    if (!profile) return;
    const { data: userPetsData } = await supabase
      .from('user_pets')
      .select('*, gifter:gifted_by(username, name)')
      .eq('user_id', profile.id);
    if (userPetsData) setUserPets(userPetsData);
  }

  async function toggleHidePet(userPetId: string) {
    const pet = userPets.find(p => p.id === userPetId);
    if (!pet) return;
    const newHidden = !pet.is_hidden;
    await supabase.from('user_pets').update({ is_hidden: newHidden }).eq('id', userPetId);
    setUserPets(prev => prev.map(p => p.id === userPetId ? { ...p, is_hidden: newHidden } : p));
    setSelectedPet(null);
  }

  useEffect(() => {
    if (showGiftPanel) {
      searchUsersForGift('');
    }
  }, [showGiftPanel]);

  async function searchUsersForGift(query: string) {
    if (!profile) return;
    setSearchingUsers(true);
    try {
      let q = supabase.from('profiles').select('*').limit(10);
      if (query) {
        q = q.or(`username.ilike.%${query}%,name.ilike.%${query}%`);
      } else {
        // Show people in circle first if no query
        const matchField = 'follower_id';
        const { data: followingList } = await supabase
          .from('follows')
          .select('profiles:following_id (*)')
          .eq(matchField, profile!.id)
          .limit(10);
        
        if (followingList && followingList.length > 0) {
          setGiftSearchResults(followingList.map((f: any) => f.profiles).filter(Boolean));
          setSearchingUsers(false);
          return;
        }
      }
      
      const { data } = await q;
      if (data) {
        setGiftSearchResults(data.filter(p => p.id !== user.id));
      }
    } finally {
      setSearchingUsers(false);
    }
  }

  async function handleGiftPet(targetUserId: string) {
    if (!selectedPet || gifting) return;
    setGifting(true);
    try {
      const { error } = await supabase
        .from('user_pets')
        .update({ 
          user_id: targetUserId, 
          is_hidden: false,
          is_pinned: false,
          gifted_by: user.id
        })
        .eq('id', selectedPet.id);
      
      if (!error) {
        setUserPets(prev => prev.filter(p => p.id !== selectedPet.id));
        setSelectedPet(null);
        setShowGiftPanel(false);
        alert('Companion sent to their new home!');
      }
    } finally {
      setGifting(false);
    }
  }

  async function togglePinPet(userPetId: string) {
    const pet = userPets.find(p => p.id === userPetId);
    if (!pet) return;
    
    const pinnedCount = userPets.filter(p => p.is_pinned).length;
    if (!pet.is_pinned && pinnedCount >= 3) {
      alert('You can only pin up to 3 companions.');
      return;
    }

    const newPinned = !pet.is_pinned;
    const { error } = await supabase.from('user_pets').update({ is_pinned: newPinned }).eq('id', userPetId);
    if (!error) {
      setUserPets(prev => prev.map(p => p.id === userPetId ? { ...p, is_pinned: newPinned } : p));
      if (selectedPet?.id === userPetId) setSelectedPet(null);
    }
  }

  async function handleSellPet(userPetId: string) {
    const up = userPets.find(p => p.id === userPetId);
    if (!up || selling) return;
    
    const config = PET_ICONS[up.pet_id_name || 'cat'];
    const sellPrice = Math.floor(config.price * 0.8);

    setSelling(true);
    try {
      const { error: sellError } = await supabase.from('user_pets').delete().eq('id', userPetId);
      if (sellError) {
        console.error('Error selling pet:', sellError);
        alert('Failed to sell: ' + sellError.message);
        return;
      }
      
      const newSpent = Math.max(0, (profile?.spent_origins || 0) - sellPrice);
      const { error: profileError } = await supabase.from('profiles').update({ spent_origins: newSpent }).eq('id', user.id);
      
      if (!profileError) {
        setProfile(prev => prev ? { ...prev, spent_origins: newSpent } : null);
        setUserPets(prev => prev.filter(p => p.id !== userPetId));
        setSelectedPet(null);
        setShowSellConfirm(false);
        onUpdate?.(user.id);
      } else {
        console.error('Error updating profile:', profileError);
      }
    } catch (err) {
      console.error('Unexpected error during sell:', err);
    } finally {
      setSelling(false);
    }
  }

  async function updatePetName() {
    if (!selectedPet || !newName.trim()) return;
    const { error } = await supabase.from('user_pets').update({ pet_name: newName.trim() }).eq('id', selectedPet.id);
    if (!error) {
      setUserPets(prev => prev.map(p => p.id === selectedPet.id ? { ...p, pet_name: newName.trim() } : p));
      setSelectedPet(prev => prev ? { ...prev, pet_name: newName.trim() } : null);
      setEditingName(false);
    }
  }

  const PET_ICONS: Record<string, any> = {
    cat: { image: 'https://mavebo-puce.vercel.app/cat.png', color: 'bg-amber-100', price: 100 },
    dog: { image: 'https://mavebo-puce.vercel.app/dog.png', color: 'bg-orange-100', price: 150 },
    bat: { image: 'https://mavebo-puce.vercel.app/bat.png', color: 'bg-purple-100', price: 300 },
    owl: { image: 'https://mavebo-puce.vercel.app/owl.png', color: 'bg-indigo-100', price: 500 },
  };

  async function calculateOriginsBalance() {
    if (!profile) return;
    const spent = profile.spent_origins || 0;
    const received = profile.received_origins || 0;
    
    setSpentOrigins(spent);
    setReceivedOrigins(received);
    
    // Формула: фото + свайпы×0.5 + полученные - потраченные
    const maxBalance = uploadCount + (swipeCount * 0.5) + received;
    setMaxOriginsBalance(maxBalance);
    
    const currentBalance = maxBalance - spent;
    setOriginsBalance(currentBalance);
    
    if (isOwn) {
      await supabase.from('profiles').update({ 
        origins_balance: currentBalance,
        max_origins_balance: maxBalance
      }).eq('id', profile.id);
    }
  }

  async function loadUserStats() {
    if (!profile) return;
    setSwipeCount(profile.swipe_count || 0);
    setOriginalSwipeCount(profile.swipe_count || 0);
    setTempSwipeValue(profile.swipe_count || 0);
    setSpentOrigins(profile.spent_origins || 0);
    setReceivedOrigins(profile.received_origins || 0);
    setUploadCount(profile.photo_count || 0);
  }

  async function loadUserSettings() {
    if (!profile) return;
    const { data: swipeData } = await supabase.from('user_settings').select('hide_swipe_count').eq('user_id', profile.id).maybeSingle();
    if (swipeData) setHideSwipeCount(swipeData.hide_swipe_count || false);
    const { data: hiddenData } = await supabase.from('user_settings').select('hidden_achievements').eq('user_id', profile.id).maybeSingle();
    if (hiddenData?.hidden_achievements) setHiddenAchievements(new Set(hiddenData.hidden_achievements));
  }

  async function loadAchievements() {
    if (!profile) return;
    const { data } = await supabase.from('achievements').select('*').eq('user_id', profile.id).order('achieved_at', { ascending: false });
    if (data) setAchievements(data);
  }

  async function toggleHideSwipeCount() {
    const newValue = !hideSwipeCount;
    setHideSwipeCount(newValue);
    await supabase.from('user_settings').upsert({ user_id: profile!.id, hide_swipe_count: newValue }, { onConflict: 'user_id' });
  }

  async function toggleHideAchievement(achievementId: string) {
    const newHiddenSet = new Set(hiddenAchievements);
    if (newHiddenSet.has(achievementId)) newHiddenSet.delete(achievementId);
    else newHiddenSet.add(achievementId);
    setHiddenAchievements(newHiddenSet);
    await supabase.from('user_settings').upsert({ user_id: profile!.id, hidden_achievements: Array.from(newHiddenSet) }, { onConflict: 'user_id' });
  }

  async function updateSwipeCount(newCount: number) {
    if (newCount > originalSwipeCount) {
      alert(`You cannot exceed your actual swipe count (${originalSwipeCount})`);
      return;
    }
    const { error } = await supabase.from('profiles').update({ swipe_count: newCount }).eq('id', profile!.id);
    if (!error) {
      setSwipeCount(newCount);
      setShowSwipeEditor(false);
      await checkAndAddSwipeAchievements(newCount);
    }
  }

  async function checkAndAddSwipeAchievements(currentCount: number) {
    for (const ach of SWIPE_ACHIEVEMENTS) {
      if (currentCount >= ach.count) {
        if (!achievements.some(a => a.achievement_name === ach.title)) {
          await supabase.from('achievements').insert({ user_id: profile!.id, achievement_type: 'swipe', achievement_name: ach.title });
          loadAchievements();
        }
      }
    }
  }

  async function checkAndAddUploadAchievements() {
    for (const ach of UPLOAD_ACHIEVEMENTS) {
      if (uploadCount >= ach.count) {
        if (!achievements.some(a => a.achievement_name === ach.title)) {
          await supabase.from('achievements').insert({ user_id: profile!.id, achievement_type: 'upload', achievement_name: ach.title });
          loadAchievements();
        }
      }
    }
  }

  async function toggleFollow() {
    if (!user || !profile) return;
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profile.id);
      setFollowersCount(prev => Math.max(0, prev - 1));
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: profile.id });
      setFollowersCount(prev => prev + 1);
    }
    setFollowing(!following);
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-200" size={32} /></div>;
  if (!profile) return <div className="h-screen flex items-center justify-center text-slate-400">Profile not found.</div>;

  let allAvailableBadges: BadgeType[] = [];
  const purchasedBadges = profile.purchased_badges || [];
  purchasedBadges.forEach(b => { if (!allAvailableBadges.includes(b as any)) allAvailableBadges.push(b as any); });
  
  if (profile.username === 'winterwastaken' && !allAvailableBadges.includes('snowflake' as any)) allAvailableBadges.push('snowflake' as any);
  if (['viscaelbarca', 'camilakiriek'].includes(profile.username) && !allAvailableBadges.includes('star' as any)) allAvailableBadges.push('star' as any);
  if (['mavebo', 'startorigin'].includes(profile.username) && !allAvailableBadges.includes('verified' as any)) allAvailableBadges.push('verified' as any);
  if (profile.username === 'zaharques') {
    if (!allAvailableBadges.includes('computer' as any)) allAvailableBadges.push('computer' as any);
    if (!allAvailableBadges.includes('star' as any)) allAvailableBadges.push('star' as any);
  }

  const visibleBadges = badgesOrder.filter(bid => allAvailableBadges.includes(bid as any) && !hiddenBadges.includes(bid));
  const purchasedAch = profile.purchased_achievements || [];
  const allAchievements = [...achievements];
  purchasedAch.forEach(aid => {
    let name = '';
    if (aid === 'shopkeeper') name = "Shopkeepers' Favorite";
    else if (aid === 'buyer') name = 'Buyer';
    else if (aid === 'shopping') name = 'Shopping';
    else if (aid === 'collector') name = 'Collector';
    else if (aid === 'big_spender') name = 'Big Spender';
    else if (aid === 'legendary') name = 'Legendary';
    else if (aid === 'completionist') name = 'Completionist';
    else if (aid === 'daily_shopper') name = 'Daily Shopper';

    if (name && !allAchievements.some(a => a.achievement_name === name)) {
      allAchievements.push({ 
        id: `shop_${aid}`, 
        user_id: profile.id, 
        achievement_type: 'shop', 
        achievement_name: name, 
        achieved_at: new Date().toISOString() 
      });
    }
  });

  const visibleAchievements = allAchievements.filter(ach => !hiddenAchievements.has(ach.id));
  const hiddenAchievementsList = allAchievements.filter(ach => hiddenAchievements.has(ach.id));

  const getAchievementConfig = (name: string) => {
    return SECRET_ACHIEVEMENTS.find(a => a.title === name) || 
           SHOP_ACHIEVEMENTS.find(a => a.title === name) || 
           SWIPE_ACHIEVEMENTS.find(a => a.title === name) || 
           UPLOAD_ACHIEVEMENTS.find(a => a.title === name);
  };

  const currentTheme = THEMES[themePreference] || THEMES.default;
  const currentPattern = PATTERNS[patternPreference] || '';
  const visiblePets = isOwn ? userPets : userPets.filter(pet => !pet.is_hidden);
  const hasPetsTab = (isOwn && userPets.length > 0) || visiblePets.length > 0;

  return (
    <main className="max-w-xl mx-auto p-4 md:p-8 space-y-8 min-h-screen">
      <div className={cn("rounded-[3rem] p-8 flex flex-col items-center text-center gap-6 relative shadow-2xl transition-all duration-500 overflow-hidden", currentTheme.bg, currentTheme.text)}>
        {currentPattern && <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: currentPattern }} />}
        
        <div className="relative z-10 w-full space-y-6">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 mx-auto shadow-xl bg-white">
             {profile.avatar_url ? (
               <img src={profile.avatar_url} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full bg-black/5 flex items-center justify-center text-3xl font-bold uppercase text-black">
                 {profile.name?.[0] || profile.username[0]}
               </div>
             )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{profile.name || profile.username}</h1>
              <div className="flex gap-1">
                {visibleBadges.map(bid => {
                   const cfg = BADGE_CONFIG[bid];
                   return cfg ? <cfg.icon key={bid} className={cn("w-5 h-5", cfg.color)} title={cfg.label} /> : null;
                })}
              </div>
            </div>
            <p className="text-sm font-bold opacity-40 uppercase tracking-widest">@{profile.username}</p>
            {profile.bio && <p className="text-sm font-medium opacity-60 leading-relaxed max-w-xs mx-auto italic">"{profile.bio}"</p>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-4 px-4 bg-black/5 rounded-[2rem] backdrop-blur-sm border border-white/5 w-full">
             <button 
                onClick={() => { if (isOwn) fetchFollows('followers'); }} 
                disabled={!isOwn}
                className={cn("text-center transition-opacity p-2", isOwn ? "hover:opacity-60 cursor-pointer" : "cursor-default")}
              >
                <div className="text-base font-bold tracking-tight">{formatCount(followersCount)}</div>
                <div className="text-[8px] uppercase font-bold opacity-40 tracking-wider">Followers</div>
             </button>
             <button 
                onClick={() => { if (isOwn) fetchFollows('following'); }} 
                disabled={!isOwn}
                className={cn("text-center transition-opacity p-2", isOwn ? "hover:opacity-60 cursor-pointer" : "cursor-default")}
              >
                <div className="text-base font-bold tracking-tight">{formatCount(followingCount)}</div>
                <div className="text-[8px] uppercase font-bold opacity-40 tracking-wider">Following</div>
             </button>
             <div className="text-center p-2">
                <div className="text-base font-bold tracking-tight">{formatCount(uploadCount)}</div>
                <div className="text-[8px] uppercase font-bold opacity-40 tracking-wider">Photos</div>
             </div>
             <div className="text-center p-2">
                <div className="flex items-center justify-center gap-1">
                   <Flame className="text-orange-500" size={12} />
                   <div className="text-base font-bold tracking-tight">{hideSwipeCount && !isOwn ? '???' : formatCount(swipeCount)}</div>
                   {isOwn && (
                     <button onClick={() => { setTempSwipeValue(swipeCount); setShowSwipeEditor(true); }} className="p-1 opacity-40 hover:opacity-100 transition-opacity"><Edit2 size={8} /></button>
                   )}
                </div>
                <div className="text-[8px] uppercase font-bold opacity-40 tracking-wider">Swipes</div>
             </div>
          </div>

          {isOwn && (
            <div className="mt-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 inline-block mx-auto">
              <div className="flex items-center justify-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-bold">
                  {originsBalance.toFixed(1)} <span className="opacity-60">Origins</span>
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center w-full">
            {isOwn ? (
              <Link to="/settings" className="h-10 px-6 flex items-center gap-2 bg-white text-black rounded-2xl font-bold text-xs shadow-lg hover:opacity-90 transition-all border border-slate-100">
                <Settings size={14} />
                <span>Settings</span>
              </Link>
            ) : (
              <button 
                onClick={toggleFollow} 
                className={cn(
                  "h-10 px-8 rounded-2xl font-bold text-xs transition-all shadow-lg !bg-white !text-black border border-slate-100 hover:opacity-90", 
                  following && "opacity-60"
                )}
              >
                 {following ? 'In Circle' : 'Join Circle'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-2xl overflow-x-auto whitespace-nowrap scrollbar-hide">
           <button onClick={() => setActiveTab('photos')} className={cn("flex-1 px-6 h-11 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", activeTab === 'photos' ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-black")}>Moments</button>
           <button onClick={() => setActiveTab('achievements')} className={cn("flex-1 px-6 h-11 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", activeTab === 'achievements' ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-black")}>Achievements</button>
           {hasPetsTab && <button onClick={() => setActiveTab('pets')} className={cn("flex-1 px-6 h-11 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", activeTab === 'pets' ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-black")}>Companions</button>}
        </div>

        {activeTab === 'photos' && (
          <div className="grid grid-cols-2 gap-4">
             {photos.map(p => (
               <div key={p.id} onClick={() => setViewer(p)} className="aspect-square rounded-[2rem] overflow-hidden bg-slate-50 border border-slate-100 cursor-zoom-in group shadow-sm">
                  <img src={p.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
               </div>
             ))}
             {photos.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">The sanctuary is quiet.</div>}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3">
              {visibleAchievements.map(ach => {
                const cfg = getAchievementConfig(ach.achievement_name);
                return cfg ? (
                  <div key={ach.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] group hover:bg-white transition-all shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-inner">
                        <cfg.icon className={cn("w-6 h-6", cfg.color)} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-black">{ach.achievement_name}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{cfg.description}</div>
                      </div>
                    </div>
                    {isOwn && (
                      <button onClick={() => toggleHideAchievement(ach.id)} className="p-2 text-slate-200 hover:text-slate-400 transition-all">
                        <EyeOff size={16} />
                      </button>
                    )}
                  </div>
                ) : null;
              })}
              {visibleAchievements.length === 0 && <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">No achievements discovered yet.</div>}
            </div>

            {isOwn && hiddenAchievementsList.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <button onClick={() => setShowHiddenAchievements(!showHiddenAchievements)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-slate-500 transition-all px-2 mb-4">
                  {showHiddenAchievements ? 'Hide' : 'Show'} Hidden Milestones ({hiddenAchievementsList.length})
                </button>
                {showHiddenAchievements && (
                  <div className="grid grid-cols-1 gap-3 opacity-50">
                    {hiddenAchievementsList.map(ach => {
                      const cfg = getAchievementConfig(ach.achievement_name);
                      return cfg ? (
                        <div key={ach.id} className="flex items-center justify-between p-4 border border-dashed border-slate-200 rounded-[1.5rem]">
                          <div className="flex items-center gap-4">
                            <cfg.icon className={cn("w-5 h-5", cfg.color)} />
                            <div className="font-bold text-xs">{ach.achievement_name}</div>
                          </div>
                          <button onClick={() => toggleHideAchievement(ach.id)} className="p-2 text-slate-400 hover:text-black transition-all">
                            <Eye size={16} />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pets' && (
          <div className="grid grid-cols-2 gap-4">
            {userPets
              .filter(p => isOwn || !p.is_hidden)
              .sort((a, b) => {
                if (a.is_pinned && !b.is_pinned) return -1;
                if (!a.is_pinned && b.is_pinned) return 1;
                return new Date(b.acquired_at).getTime() - new Date(a.acquired_at).getTime();
              })
              .map(up => {
                const config = PET_ICONS[up.pet_id_name || 'cat'] || PET_ICONS.cat;
                const typeName = up.pet_id_name ? up.pet_id_name.charAt(0).toUpperCase() + up.pet_id_name.slice(1) : 'Pet';
                const displayName = up.pet_name === typeName ? up.pet_name : `${typeName} (${up.pet_name})`;
                
                return (
                  <div key={up.id} onClick={() => { setSelectedPet(up); setNewName(up.pet_name || ''); setEditingName(false); }} className={cn("bg-slate-50 border border-slate-100 rounded-[2rem] p-8 flex flex-col items-center gap-6 cursor-pointer hover:bg-white transition-all shadow-sm group relative", up.is_hidden && "opacity-40", up.is_pinned && "border-amber-200 bg-amber-50/30")}>
                    <div className="absolute top-4 right-4 flex gap-1">
                      {up.is_pinned && <div className="text-amber-500"><Zap size={14} fill="currentColor"/></div>}
                      {up.is_hidden && <div className="text-slate-400"><EyeOff size={14}/></div>}
                    </div>
                    <div className={cn("w-20 h-20 rounded-[2.5rem] bg-white flex items-center justify-center transition-all duration-700 group-hover:scale-110 shadow-inner overflow-hidden", config.color)}>
                        <img src={config.image} alt={up.pet_name || ''} className="w-14 h-14 object-contain" />
                    </div>
                    <div className="text-center">
                       <div className="font-bold text-black text-lg truncate w-full max-w-[120px]">{displayName}</div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Companion</div>
                       {up.gifter && <div className="text-[9px] font-bold text-purple-400 uppercase tracking-widest mt-1">Gift from {up.gifter.name || up.gifter.username}</div>}
                    </div>
                  </div>
                );
            })}
            {userPets.filter(p => isOwn || !p.is_hidden).length === 0 && <div className="col-span-full py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">No companions found.</div>}
          </div>
        )}
      </div>

      {showSwipeEditor && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full space-y-6 shadow-2xl">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-bold text-black">Manage Swipes</h3>
                 <button onClick={() => setShowSwipeEditor(false)} className="text-slate-300 hover:text-black"><X/></button>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                 <button onClick={() => setTempSwipeValue(Math.max(0, tempSwipeValue - 1))} className="p-2 hover:bg-white rounded-lg transition-all"><Minus/></button>
                 <span className="text-2xl font-bold">{tempSwipeValue}</span>
                 <button onClick={() => setTempSwipeValue(Math.min(originalSwipeCount, tempSwipeValue + 1))} className="p-2 hover:bg-white rounded-lg transition-all"><Plus/></button>
              </div>
              <button onClick={() => updateSwipeCount(tempSwipeValue)} className="btn-primary h-14 w-full">Apply Essence</button>
           </div>
        </div>
      )}

      {selectedPet && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedPet(null)}>
          <div className="bg-white rounded-[2.5rem] p-8 max-w-xs w-full text-center space-y-6 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className={cn("w-32 h-32 rounded-[3.5rem] bg-slate-50 mx-auto flex items-center justify-center shadow-inner overflow-hidden", PET_ICONS[selectedPet.pet_id_name || 'cat']?.color)}>
               <img src={PET_ICONS[selectedPet.pet_id_name || 'cat']?.image} className="w-24 h-24 object-contain" />
            </div>
            <div>
              {editingName && isOwn ? (
                <div className="flex flex-col gap-2">
                  <input 
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="text-center text-xl font-bold border-b border-purple-200 focus:outline-none focus:border-purple-500 w-full"
                    placeholder="New nickname..."
                    onKeyDown={e => e.key === 'Enter' && updatePetName()}
                  />
                  <div className="flex gap-2 justify-center">
                    <button onClick={updatePetName} className="text-[10px] font-bold uppercase text-purple-600">Save</button>
                    <button onClick={() => setEditingName(false)} className="text-[10px] font-bold uppercase text-slate-400">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-2xl font-bold text-black">{selectedPet.pet_name}</h3>
                  {isOwn && <button onClick={() => setEditingName(true)} className="text-slate-300 hover:text-purple-500"><Edit2 size={12}/></button>}
                </div>
              )}
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Loyal Companion</p>
              {selectedPet.gifter && (
                <div className="mt-4 p-3 bg-purple-50 rounded-2xl border border-purple-100">
                  <div className="text-[9px] font-bold text-purple-400 uppercase tracking-widest mb-1">Sent by</div>
                  <div className="text-sm font-bold text-purple-700">@{selectedPet.gifter.username}</div>
                </div>
              )}
            </div>
            
            {isOwn && (
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => toggleHidePet(selectedPet.id)}
                  className="h-12 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  {selectedPet.is_hidden ? <Eye size={12}/> : <EyeOff size={12}/>}
                  {selectedPet.is_hidden ? 'Show' : 'Hide'}
                </button>
                <button 
                  onClick={() => togglePinPet(selectedPet.id)}
                  className={cn("h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2", selectedPet.is_pinned ? "bg-amber-100 text-amber-600" : "bg-slate-50 hover:bg-slate-100")}
                >
                  <Zap size={12} fill={selectedPet.is_pinned ? 'currentColor' : 'none'} />
                  {selectedPet.is_pinned ? 'Unpin' : 'Pin'}
                </button>
                <button 
                  onClick={() => {
                    fetchFollows('following');
                    setShowGiftPanel(true);
                  }}
                  className="h-12 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 col-span-1"
                >
                  <Gift size={12} />
                  Gift
                </button>
                <button 
                  onClick={() => {
                    const up = selectedPet;
                    const config = PET_ICONS[up.pet_id_name || 'cat'];
                    const sellPrice = Math.floor(config.price * 0.8);
                    setShowSellConfirm(true);
                  }}
                  disabled={selling}
                  className="h-12 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 col-span-1 disabled:opacity-50"
                >
                  <ShoppingCart size={12} />
                  Sell
                </button>
              </div>
            )}
            <button onClick={() => setSelectedPet(null)} className="text-xs font-bold uppercase tracking-widest text-slate-300">Close</button>
          </div>
        </div>
      )}

      {showSellConfirm && selectedPet && (
        <div className="fixed inset-0 z-[500] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowSellConfirm(false)}>
          <div className="bg-white rounded-[2.5rem] p-8 max-w-xs w-full text-center space-y-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
              <ShoppingCart size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-black">Confirm Sale</h3>
              <p className="text-xs text-slate-400 font-medium mt-2">
                Sell <span className="text-black font-bold">{selectedPet.pet_name}</span> for <span className="text-emerald-500 font-bold">{Math.floor(PET_ICONS[selectedPet.pet_id_name || 'cat'].price * 0.8)} Origins</span>?
              </p>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => handleSellPet(selectedPet.id)}
                disabled={selling}
                className="w-full h-12 bg-red-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-red-600 disabled:opacity-50"
              >
                {selling ? 'Selling...' : 'Yes, Sell Companion'}
              </button>
              <button 
                onClick={() => setShowSellConfirm(false)}
                className="w-full h-12 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showGiftPanel && (
        <div className="fixed inset-0 z-[400] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowGiftPanel(false)}>
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full space-y-6 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
               <h3 className="text-xl font-bold text-black">Gift Companion</h3>
               <button onClick={() => setShowGiftPanel(false)} className="text-slate-300 hover:text-black"><X/></button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Search all hunters..."
                value={giftSearchQuery}
                onChange={(e) => {
                  setGiftSearchQuery(e.target.value);
                  searchUsersForGift(e.target.value);
                }}
                className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:border-purple-500 transition-all"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
               {searchingUsers ? (
                 <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-200" /></div>
               ) : giftSearchResults.length > 0 ? (
                 giftSearchResults.map((p) => (
                   <button 
                     key={p.id} 
                     disabled={gifting}
                     onClick={() => handleGiftPet(p.id)}
                     className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-purple-50 hover:border-purple-200 transition-all group disabled:opacity-50"
                   >
                     <div className="w-10 h-10 rounded-full overflow-hidden bg-white shadow-inner">
                       {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-200 bg-slate-50">{p.username[0]}</div>}
                     </div>
                     <div className="text-left flex-1">
                       <div className="text-sm font-bold text-black">{p.name || p.username}</div>
                       <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">@{p.username}</div>
                     </div>
                     <Gift size={16} className="text-slate-200 group-hover:text-purple-500 transition-colors" />
                   </button>
                 ))
               ) : (
                 <div className="py-20 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">No matching hunters found.</div>
               )}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showFollows && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl p-4 overflow-y-auto flex items-center justify-center">
             <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 space-y-6 shadow-2xl max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center text-black">
                   <div>
                      <h2 className="text-2xl font-bold tracking-tight capitalize">{followsTab}</h2>
                      <p className="text-slate-400 text-xs font-medium">People in this circle</p>
                   </div>
                   <button onClick={() => setShowFollows(false)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-all"><X size={24}/></button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-[300px]">
                   {loadingFollows ? (
                     <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-slate-200" /></div>
                   ) : followsList.length > 0 ? (
                     followsList.map((p) => (
                       <Link key={p.id} to={`/profile/${p.username}`} onClick={() => setShowFollows(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white transition-all group">
                         <div className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-inner">
                           {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-200">{p.username[0]}</div>}
                         </div>
                         <div className="text-left flex-1">
                           <div className="text-sm font-bold text-black">{p.name || p.username}</div>
                           <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">@{p.username}</div>
                         </div>
                       </Link>
                     ))
                   ) : (
                     <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
                       <User size={40} className="opacity-20" />
                       <div className="text-[10px] font-bold uppercase tracking-[0.2em]">Silence...</div>
                     </div>
                   )}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewer && <PhotoViewer photo={viewer} onClose={() => setViewer(null)} />}
      </AnimatePresence>
    </main>
  );
}
