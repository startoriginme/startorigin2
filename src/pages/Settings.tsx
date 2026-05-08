import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Profile, BadgeType } from '../types';
import { 
  User, Lock, Mail, Info, LogOut, ChevronRight, Camera, Check, 
  AlertCircle, Loader2, ShoppingCart, Trophy, Sparkles, Eye, 
  EyeOff, Search, Flame, Star, Coins, Crown, Diamond, Heart, 
  Award, ShoppingBag, Zap, Rocket, Leaf, Moon, Sun, Music, 
  Book, Coffee, Gamepad, Gift, Smile, X, Medal, Target, 
  Compass, Shield, Hash, MapPin, GripVertical
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

// BASE CONSTANTS
const BADGE_PRICES: Record<string, number> = {
  verified: 500,
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

const THEME_PRICES: Record<string, number> = {
  black: 200,
  pink: 150,
  gray: 100,
  green: 150,
  blue: 200,
  purple: 250,
  orange: 200,
  red: 250
};

const PATTERN_PRICES: Record<string, number> = {
  circles: 100,
  triangles: 150,
  squares: 150,
  flowers: 200,
  hearts: 250,
  stars: 300
};

const ACHIEVEMENT_PRICES: Record<string, number> = {
  shopkeeper: 500,
  buyer: 100,
  shopping: 300,
  collector: 1000,
  big_spender: 2000,
  legendary: 1500,
  completionist: 5000,
  daily_shopper: 800
};

const SHOP_ACHIEVEMENTS = [
  { id: 'shopkeeper', title: "Shopkeepers' Favorite", icon: ShoppingCart, color: "text-purple-500", description: "Spent 500 Origins" },
  { id: 'buyer', title: "Buyer", icon: ShoppingBag, color: "text-green-500", description: "Made first purchase" },
  { id: 'shopping', title: "Shopping", icon: Zap, color: "text-yellow-500", description: "Bought 3 items" },
  { id: 'collector', title: "Collector", icon: Star, color: "text-amber-500", description: "Collected 5 badges" },
  { id: 'big_spender', title: "Big Spender", icon: Trophy, color: "text-red-500", description: "Spent 2000 Origins" },
  { id: 'legendary', title: "Legendary", icon: Crown, color: "text-yellow-500", description: "Bought a legendary item" },
  { id: 'completionist', title: "Completionist", icon: Award, color: "text-emerald-500", description: "Collected all badges" },
  { id: 'daily_shopper', title: "Daily Shopper", icon: ShoppingBag, color: "text-blue-500", description: "Bought 3 days in a row" },
];

const BADGE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
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

export default function Settings({ user, profile, onUpdate }: { user: any, profile: Profile | null, onUpdate: (id: string) => void }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showShop, setShowShop] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showIncompleteBalance, setShowIncompleteBalance] = useState(false);
  const [activeShopTab, setActiveShopTab] = useState<'badges' | 'decorations' | 'achievements'>('badges');
  const [leaderboardData, setLeaderboardData] = useState<Profile[]>([]);
  
  // Secret quest state
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [secretCode, setSecretCode] = useState('');

  // Badge reordering
  const [badgesOrder, setBadgesOrder] = useState<string[]>(profile?.badges_order || []);
  const [hiddenBadges, setHiddenBadges] = useState<string[]>(profile?.hidden_badges || []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Profile data
  const [editProfile, setEditProfile] = useState({
    username: profile?.username || '',
    name: profile?.name || '',
    bio: profile?.bio || '',
    avatar_url: profile?.avatar_url || '',
    theme_preference: profile?.theme_preference || 'default',
    pattern_preference: profile?.pattern_preference || 'none'
  });

  useEffect(() => {
    if (profile) {
      setBadgesOrder(profile.badges_order || ['star', 'computer', 'snowflake', 'verified', 'crown', 'diamond', 'heart', 'award', 'rocket', 'leaf', 'moon', 'sun', 'music', 'book', 'coffee', 'gamepad', 'gift', 'smile', 'sparkles']);
      setHiddenBadges(profile.hidden_badges || []);
    }
  }, [profile]);

  useEffect(() => {
    if (showLeaderboard) fetchLeaderboard();
  }, [showLeaderboard]);

  async function fetchLeaderboard() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('origins_balance', { ascending: false })
      .limit(10);
    if (data) setLeaderboardData(data);
  }

  async function handleUpdateProfile() {
    setLoading(true);
    setStatus(null);
    const { error } = await supabase
      .from('profiles')
      .update(editProfile)
      .eq('id', user.id);
    
    if (error) setStatus({ type: 'error', message: error.message });
    else {
      setStatus({ type: 'success', message: 'Profile updated.' });
      onUpdate(user.id);
    }
    setLoading(false);
  }

  async function handleBadgeUpdate(newOrder: string[], newHidden: string[]) {
    await supabase.from('profiles').update({
      badges_order: newOrder,
      hidden_badges: newHidden
    }).eq('id', user.id);
    onUpdate(user.id);
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = badgesOrder.indexOf(active.id);
      const newIndex = badgesOrder.indexOf(over.id);
      const newOrder = arrayMove(badgesOrder, oldIndex, newIndex) as string[];
      setBadgesOrder(newOrder);
      handleBadgeUpdate(newOrder, hiddenBadges);
    }
  }

  function toggleBadgeVisibility(id: string) {
    const newHidden = hiddenBadges.includes(id) 
      ? hiddenBadges.filter(b => b !== id)
      : [...hiddenBadges, id];
    setHiddenBadges(newHidden);
    handleBadgeUpdate(badgesOrder, newHidden);
  }

  async function handleSecretQuest() {
    if (secretCode.toLowerCase() === 'origin2026') {
      const purchased = profile?.purchased_achievements || [];
      if (!purchased.includes('secret_agent_1')) {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            purchased_achievements: [...purchased, 'secret_agent_1'],
            received_origins: (profile?.received_origins || 0) + 500
          })
          .eq('id', user.id);
        
        if (!error) {
          setStatus({ type: 'success', message: 'Secret discovered! + 500 Origins' });
          onUpdate(user.id);
          setShowSecretInput(false);
        }
      } else {
        setStatus({ type: 'error', message: 'Secret already claimed.' });
      }
    } else {
      setStatus({ type: 'error', message: 'Incorrect code.' });
    }
  }

  async function handlePurchase(type: 'badge' | 'theme' | 'pattern' | 'achievement', item: string, price: number) {
    if (currentBalance < price) {
      setShowIncompleteBalance(true);
      return;
    }

    setLoading(true);
    const newSpent = (profile?.spent_origins || 0) + price;
    
    // Formula: photos + swipes * 0.5 + received - spent
    const newBalance = (profile?.photo_count || 0) + 
                      ((profile?.swipe_count || 0) * 0.5) + 
                      (profile?.received_origins || 0) - 
                      newSpent;

    const updates: any = {
      spent_origins: newSpent,
      origins_balance: newBalance
    };

    if (type === 'badge') {
      updates.purchased_badges = [...(profile?.purchased_badges || []), item];
    } else if (type === 'theme') {
      updates.unlocked_themes = [...(profile?.unlocked_themes || []), item];
    } else if (type === 'pattern') {
      updates.unlocked_patterns = [...(profile?.unlocked_patterns || []), item];
    } else if (type === 'achievement') {
      updates.purchased_achievements = [...(profile?.purchased_achievements || []), item];
    }

    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (!error) {
      onUpdate(user.id);
    }
    setLoading(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${user.id}.${fileExt}`;

    setLoading(true);
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setStatus({ type: 'error', message: uploadError.message });
      setLoading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filePath);
    setEditProfile({ ...editProfile, avatar_url: publicUrl });
    setLoading(false);
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const currentBalance = (profile?.photo_count || 0) + 
                         ((profile?.swipe_count || 0) * 0.5) + 
                         (profile?.received_origins || 0) - 
                         (profile?.spent_origins || 0);

  const purchasedBadges = profile?.purchased_badges || [];
  const allAvailableBadges = [...purchasedBadges];
  if (profile?.username === 'winterwastaken' && !allAvailableBadges.includes('snowflake')) allAvailableBadges.push('snowflake');
  if (['viscaelbarca', 'camilakiriek'].includes(profile?.username || '') && !allAvailableBadges.includes('star')) allAvailableBadges.push('star');
  if (profile?.username === 'mavebo' && !allAvailableBadges.includes('verified')) allAvailableBadges.push('verified');
  if (profile?.username === 'zaharques') {
    if (!allAvailableBadges.includes('computer')) allAvailableBadges.push('computer');
    if (!allAvailableBadges.includes('star')) allAvailableBadges.push('star');
  }

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8 space-y-12 min-h-screen">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">Settings</h1>
          <p className="text-slate-400 font-medium text-sm">Make it yours</p>
        </div>
        <div className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center gap-2 shadow-sm">
           <Coins size={18} className="text-amber-500" />
           <span className="font-bold text-black">{currentBalance.toFixed(0)}</span>
        </div>
      </header>


      {status && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm",
            status.type === 'success' ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600" : "bg-rose-500/10 border border-rose-500/20 text-rose-600"
          )}
        >
          {status.type === 'success' ? <Check size={18}/> : <AlertCircle size={18}/>}
          {status.message}
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
         <button onClick={() => setShowShop(true)} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex flex-col items-center gap-3 group hover:bg-white transition-all shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 group-hover:text-purple-500 group-hover:scale-110 transition-all shadow-inner"><ShoppingBag size={24}/></div>
            <div className="text-xs font-bold uppercase tracking-widest">Origin Shop</div>
         </button>
         <button onClick={() => setShowLeaderboard(true)} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex flex-col items-center gap-3 group hover:bg-white transition-all shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 group-hover:text-amber-500 group-hover:scale-110 transition-all shadow-inner"><Trophy size={24}/></div>
            <div className="text-xs font-bold uppercase tracking-widest">Leaderboard</div>
         </button>
      </div>

      {/* Edit Profile Section */}
      <section className="space-y-6">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 px-2">Account Details</h2>
        <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2.5rem] space-y-8 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white overflow-hidden flex items-center justify-center relative group shadow-inner border border-slate-100">
              {editProfile.avatar_url ? <img src={editProfile.avatar_url} className="w-full h-full object-cover" /> : <User size={32} className="text-slate-200" />}
              <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                 <Camera size={24} className="text-white" />
                 <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </label>
            </div>
            <div>
              <div className="font-bold text-black mb-1">Avatar</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Your photo</div>
            </div>
          </div>
          
          <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest px-2">Name</label>
                <input 
                  value={editProfile.name}
                  onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                  className="w-full h-14 px-6 bg-white border border-slate-100 rounded-2xl focus:ring-0 text-sm font-bold text-black shadow-inner"
                  placeholder="Your display name"
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest px-2">Nickname</label>
                <input 
                  value={editProfile.username}
                  onChange={(e) => setEditProfile({ ...editProfile, username: e.target.value })}
                  className="w-full h-14 px-6 bg-white border border-slate-100 rounded-2xl focus:ring-0 text-sm font-bold text-black shadow-inner"
                  placeholder="Your username"
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest px-2">Bio</label>
                <textarea 
                  value={editProfile.bio}
                  onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
                  className="w-full h-32 px-6 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-0 text-sm font-medium text-black resize-none shadow-inner"
                  placeholder="About you..."
                />
             </div>
          </div>

          <button 
            onClick={handleUpdateProfile}
            disabled={loading}
            className="btn-primary w-full h-14"
          >
            {loading ? <Loader2 className="animate-spin mx-auto text-white" /> : 'Save Changes'}
          </button>
        </div>
      </section>

      {/* Badge Management */}
      <section className="space-y-6">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 px-2">My Badges</h2>
        <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2.5rem] space-y-6 shadow-sm">
           <DndContext 
             sensors={sensors}
             collisionDetection={closestCenter}
             onDragEnd={handleDragEnd}
           >
             <SortableContext 
               items={badgesOrder.filter(id => allAvailableBadges.includes(id))}
               strategy={verticalListSortingStrategy}
             >
               <div className="space-y-2">
                 {badgesOrder.filter(id => allAvailableBadges.includes(id)).map((id) => (
                   <SortableBadgeItem 
                     key={id} 
                     id={id} 
                     badge={BADGE_CONFIG[id]} 
                     isHidden={hiddenBadges.includes(id)}
                     onToggleVisibility={() => toggleBadgeVisibility(id)}
                   />
                 ))}
                 {allAvailableBadges.length === 0 && (
                   <div className="py-10 text-center text-[10px] font-bold uppercase text-slate-300 tracking-widest">
                     No badges earned yet.
                   </div>
                 )}
               </div>
             </SortableContext>
           </DndContext>
        </div>
      </section>

      {/* Decoration Settings */}
      <section className="space-y-6">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 px-2">Decorations</h2>
        <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2.5rem] space-y-8 shadow-sm">
           <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest px-2">Theme</label>
                <select 
                  value={editProfile.theme_preference}
                  onChange={(e) => setEditProfile({ ...editProfile, theme_preference: e.target.value })}
                  className="w-full h-14 px-6 bg-white border border-slate-100 rounded-2xl focus:ring-0 text-sm font-bold text-black shadow-inner appearance-none"
                >
                  <option value="default">Default</option>
                  {(profile?.unlocked_themes || []).map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest px-2">Pattern</label>
                <select 
                  value={editProfile.pattern_preference}
                  onChange={(e) => setEditProfile({ ...editProfile, pattern_preference: e.target.value })}
                  className="w-full h-14 px-6 bg-white border border-slate-100 rounded-2xl focus:ring-0 text-sm font-bold text-black shadow-inner appearance-none"
                >
                  <option value="none">None</option>
                  {(profile?.unlocked_patterns || []).map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
           </div>
           <button onClick={handleUpdateProfile} className="w-full h-12 bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all">Apply Style</button>
        </div>
      </section>

      {/* Secret Section */}
      <section className="space-y-6">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 px-2">Hidden Resonance</h2>
        <div className="p-1 px-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Compass className="text-slate-300" size={16} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secret Quest</span>
           </div>
           <button onClick={() => setShowSecretInput(!showSecretInput)} className="text-[10px] font-bold text-purple-500 uppercase tracking-widest px-4 py-3">Initiate</button>
        </div>
        
        {showSecretInput && (
          <div className="bg-purple-500/[0.03] border border-purple-500/10 p-6 rounded-[2rem] space-y-4 shadow-sm">
             <input 
               value={secretCode}
               onChange={(e) => setSecretCode(e.target.value)}
               className="w-full h-12 px-6 bg-white border border-purple-500/10 rounded-xl focus:ring-0 text-sm font-bold text-black"
               placeholder="Enter secret code..."
               onKeyDown={(e) => e.key === 'Enter' && handleSecretQuest()}
             />
             <button onClick={handleSecretQuest} className="w-full h-10 bg-purple-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em]">Verify Essence</button>
          </div>
        )}
      </section>

      {/* Info Section */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 px-2">Nexus Information</h2>
        <div className="bg-slate-50 border border-slate-100 rounded-[2rem] overflow-hidden divide-y divide-slate-100 shadow-sm">
           <ExternalLink icon={Mail} label="Echo (Support)" href="mailto:gerxog04@gmail.com" value="Contact" />
           <ExternalLink icon={Info} label="Architecture" href="#" value="v1.4.2" />
        </div>
      </section>

      {/* Footer */}
      <button 
        onClick={signOut}
        className="w-full h-16 flex items-center justify-center gap-3 text-rose-500 font-bold bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 rounded-[2rem] transition-all mb-24 shadow-sm"
      >
        <LogOut size={20} />
        Depart to Void
      </button>

      {/* SHOP MODAL */}
      <AnimatePresence>
        {showShop && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl p-4 overflow-y-auto pt-20">
             <div className="max-w-xl mx-auto space-y-8">
                <div className="flex justify-between items-center text-white">
                   <div>
                      <h2 className="text-3xl font-bold tracking-tight">Origin Shop</h2>
                      <div className="flex items-center gap-2 mt-1">
                         <Coins size={16} className="text-amber-500" />
                         <span className="font-bold text-amber-500">{currentBalance.toFixed(0)} available</span>
                      </div>
                   </div>
                   <button onClick={() => setShowShop(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all"><X size={24}/></button>
                </div>

                 <div className="flex gap-2 p-1 bg-white/5 rounded-2xl">
                    <button onClick={() => setActiveShopTab('badges')} className={cn("flex-1 h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", activeShopTab === 'badges' ? "bg-white text-black shadow-lg" : "text-white/50 hover:text-white")}>Badges</button>
                    <button onClick={() => setActiveShopTab('decorations')} className={cn("flex-1 h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", activeShopTab === 'decorations' ? "bg-white text-black shadow-lg" : "text-white/50 hover:text-white")}>Styles</button>
                    <button onClick={() => setActiveShopTab('achievements')} className={cn("flex-1 h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", activeShopTab === 'achievements' ? "bg-white text-black shadow-lg" : "text-white/50 hover:text-white")}>Milestones</button>
                 </div>

                 {activeShopTab === 'badges' && (
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(BADGE_CONFIG).map(([id, cfg]) => {
                         const isPurchased = profile?.purchased_badges?.includes(id);
                         const price = BADGE_PRICES[id] || 0;
                         return (
                           <div key={id} className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col items-center gap-4 text-center group">
                              <div className={cn("w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center transition-all duration-500 group-hover:scale-125", cfg.color)}>
                                 <cfg.icon size={28} />
                              </div>
                              <div>
                                 <div className="text-white font-bold text-sm tracking-tight">{cfg.label}</div>
                                 <div className="text-[10px] text-white/40 font-bold mt-1 uppercase tracking-[0.2em]">{isPurchased ? 'Owned' : `${price} ORG`}</div>
                              </div>
                              {!isPurchased && (
                                <button onClick={() => handlePurchase('badge', id, price)} className="w-full h-10 bg-white text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl">Purchase</button>
                              )}
                           </div>
                         );
                      })}
                   </div>
                 )}

                 {activeShopTab === 'achievements' && (
                   <div className="grid grid-cols-1 gap-4">
                      {SHOP_ACHIEVEMENTS.map((ach) => {
                         const isPurchased = profile?.purchased_achievements?.includes(ach.id);
                         const price = ACHIEVEMENT_PRICES[ach.id] || 0;
                         return (
                           <div key={ach.id} className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-between group">
                              <div className="flex items-center gap-4">
                                 <div className={cn("w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center", ach.color)}>
                                    <ach.icon size={24} />
                                 </div>
                                 <div className="text-left">
                                    <div className="text-white font-bold text-sm tracking-tight">{ach.title}</div>
                                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{ach.description}</div>
                                 </div>
                              </div>
                              {!isPurchased ? (
                                <button onClick={() => handlePurchase('achievement', ach.id, price)} className="h-10 px-6 bg-white text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl">{price} ORG</button>
                              ) : <Check className="text-emerald-500" size={20} />}
                           </div>
                         );
                      })}
                   </div>
                 )}

                 {activeShopTab === 'decorations' && (
                   <div className="space-y-12 pb-20">
                      <div className="space-y-6">
                         <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.4em] px-4">Chromatic Themes</h3>
                         <div className="grid grid-cols-2 gap-4">
                            {Object.entries(THEME_PRICES).map(([id, price]) => {
                               const isOwned = profile?.unlocked_themes?.includes(id);
                               return (
                                 <div key={id} className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                       <div className={cn("w-6 h-6 rounded-full border border-white/20", `bg-${id}-400`)} />
                                       <span className="text-white font-bold text-sm uppercase tracking-widest">{id}</span>
                                    </div>
                                    {!isOwned ? (
                                      <button onClick={() => handlePurchase('theme', id, price)} className="px-4 py-2 bg-white/10 text-white hover:bg-white text-black rounded-lg text-[10px] font-bold uppercase transition-all">{price}</button>
                                    ) : <Check className="text-emerald-500" size={16}/>}
                                 </div>
                               );
                            })}
                         </div>
                      </div>

                      <div className="space-y-6">
                         <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.4em] px-4">Ethereal Patterns</h3>
                         <div className="grid grid-cols-2 gap-4">
                            {Object.entries(PATTERN_PRICES).map(([id, price]) => {
                               const isOwned = profile?.unlocked_patterns?.includes(id);
                               return (
                                 <div key={id} className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-between group">
                                    <div className="text-white font-bold text-sm uppercase tracking-widest">{id}</div>
                                    {!isOwned ? (
                                      <button onClick={() => handlePurchase('pattern', id, price)} className="px-4 py-2 bg-white/10 text-white hover:bg-white text-black rounded-lg text-[10px] font-bold uppercase transition-all">{price}</button>
                                    ) : <Check className="text-emerald-500" size={16}/>}
                                 </div>
                               );
                            })}
                         </div>
                      </div>
                   </div>
                 )}
              </div>
           </motion.div>
         )}
      </AnimatePresence>

      {/* LEADERBOARD MODAL */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl p-4 overflow-y-auto pt-20">
             <div className="max-w-xl mx-auto space-y-8">
                <div className="flex justify-between items-center text-white">
                   <div>
                      <h2 className="text-3xl font-bold tracking-tight">Ancient Beings</h2>
                      <p className="text-white/40 text-sm">Most origins accumulated</p>
                   </div>
                   <button onClick={() => setShowLeaderboard(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all"><X size={24}/></button>
                </div>

                <div className="space-y-3 pb-20">
                   {leaderboardData.map((lb, idx) => (
                     <div key={lb.id} className="p-5 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-between group hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-5">
                           <div className="w-8 flex justify-center font-bold text-white/40 group-hover:text-amber-500 transition-colors">#{idx + 1}</div>
                           <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-white">
                              {lb.avatar_url ? <img src={lb.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-black font-bold uppercase">{lb.username[0]}</div>}
                           </div>
                           <div>
                              <div className="text-white font-bold text-sm">{lb.name || lb.username}</div>
                              <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest">@{lb.username}</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5 group-hover:border-amber-500/20 transition-all">
                           <Coins size={14} className="text-amber-500" />
                           <span className="text-amber-500 font-bold text-sm">{lb.origins_balance?.toFixed(0)}</span>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIncompleteBalance && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
                <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mx-auto">
                   <AlertCircle size={40} className="text-rose-500" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-bold text-black tracking-tight">Insufficient Origins</h3>
                   <p className="text-sm text-slate-400 font-medium leading-relaxed">You don't have so much Origins. Go earn it first..</p>
                </div>
                <button onClick={() => setShowIncompleteBalance(false)} className="w-full h-14 bg-black text-white rounded-2xl font-bold text-sm shadow-xl hover:opacity-90 transition-all">Understood</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SortableBadgeItem({ id, badge, isHidden, onToggleVisibility }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group shadow-sm"
    >
      <div className="flex items-center gap-4">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-slate-200">
          <GripVertical size={16} />
        </button>
        <div className={cn("w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center", badge.color)}>
          <badge.icon size={20} />
        </div>
        <div className="text-sm font-bold text-black">{badge.label}</div>
      </div>
      <button 
        onClick={onToggleVisibility} 
        className={cn("p-2 transition-all", isHidden ? "text-slate-300 hover:text-black" : "text-black hover:opacity-60")}
      >
        {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function SettingsInput({ label, value, onChange, placeholder, type = 'text' }: any) {
  return (
    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-2 group">
      <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold whitespace-nowrap">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold md:text-right placeholder-slate-200 focus:placeholder-slate-200 text-black w-full md:w-auto"
        placeholder={placeholder}
      />
    </div>
  );
}

function ExternalLink({ icon: Icon, label, href, value }: any) {
  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="p-6 flex items-center justify-between group hover:bg-black/[0.02] transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white/10 rounded-xl text-slate-300 group-hover:text-black group-hover:bg-white group-hover:scale-110 transition-all border border-white/5"><Icon size={18} /></div>
        <div className="text-sm font-bold text-black">{label}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-300 font-bold">{value}</span>
        <ChevronRight size={16} className="text-slate-200 group-hover:text-black transition-colors" />
      </div>
    </a>
  );
}
