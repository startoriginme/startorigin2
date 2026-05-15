import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Profile, BadgeType } from '../types';
import { 
  User, Lock, Mail, Info, LogOut, ChevronRight, Camera, Check, 
  AlertCircle, Loader2, ShoppingCart, Trophy, Sparkles, Eye, 
  EyeOff, Search, Flame, Star, Coins, Crown, Diamond, Heart, 
  Award, ShoppingBag, Zap, Rocket, Leaf, Moon, Sun, Music, 
  Book, Coffee, Gamepad, Gift, Smile, X, Medal, Target, 
  Compass, Shield, Hash, MapPin, GripVertical, ChevronUp, ChevronDown,
  AtSign, Tags, DollarSign, Plus, Trash2, Edit2
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
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// BASE CONSTANTS
import { 
  BADGE_PRICES, THEME_PRICES, PATTERN_PRICES, ACHIEVEMENT_PRICES, 
  SHOP_ACHIEVEMENTS, BADGE_CONFIG, PET_CONFIG, GRADIENT_PRICES, 
  GRADIENT_CONFIG, FONT_PRICES, FONT_CONFIG, calculateAliasPrice 
} from '../constants/shop';

import { useNotification } from '../context/NotificationContext';

export default function Settings({ user, profile, onUpdate }: { user: any, profile: Profile | null, onUpdate: (id: string) => void }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { showAlert } = useNotification();
  const [loading, setLoading] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showMiniGames, setShowMiniGames] = useState(false);
  const [showBadgesExpanded, setShowBadgesExpanded] = useState(false);
  const [activeShopTab, setActiveShopTab] = useState<'badges' | 'decorations' | 'achievements' | 'pets' | 'gradients' | 'fonts'>('badges');
  const [leaderboardData, setLeaderboardData] = useState<Profile[]>([]);

  // Mini Games State
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastSpinResult, setLastSpinResult] = useState<number | null>(null);
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
    pattern_preference: profile?.pattern_preference || 'none',
    active_gradient: profile?.active_gradient || null,
    active_font: profile?.active_font || 'modern'
  });

  useEffect(() => {
    if (profile) {
      setBadgesOrder(profile.badges_order || ['verified', 'star', 'computer', 'snowflake', 'crown', 'diamond', 'heart', 'award', 'rocket', 'leaf', 'moon', 'sun', 'music', 'book', 'coffee', 'gamepad', 'gift', 'smile', 'sparkles']);
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
    const updatedUsername = editProfile.username.toLowerCase().trim();
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...editProfile, username: updatedUsername })
        .eq('id', user.id);
      
      if (error) {
        showAlert({ message: error.message, type: 'error' });
      } else {
        setEditProfile(prev => ({ ...prev, username: updatedUsername }));
        showAlert({ message: 'Profile updated!', type: 'success' });
        onUpdate(user.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  function handleMoveBadge(id: string, direction: 'up' | 'down') {
    const activeIndex = badgesOrder.indexOf(id);
    const overIndex = direction === 'up' ? activeIndex - 1 : activeIndex + 1;
    if (overIndex >= 0 && overIndex < badgesOrder.length) {
      const newOrder = arrayMove(badgesOrder, activeIndex, overIndex) as string[];
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
    if (secretCode === 'StartOrigin') {
      if (!profile?.used_secret_quest) {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            used_secret_quest: true,
            received_origins: (profile?.received_origins || 0) + 100
          })
          .eq('id', user.id);
        
        if (!error) {
          showAlert({ message: 'Secret discovered! + 100 ORG', type: 'success' });
          onUpdate(user.id);
          setShowSecretInput(false);
          setSecretCode('');
        }
      } else {
        showAlert({ message: 'Secret already claimed.', type: 'warning' });
      }
    } else {
      showAlert({ message: 'Incorrect code.', type: 'error' });
    }
  }

  async function handleWheelSpin() {
    if (isSpinning) return;

    const lastSpinDate = profile?.last_free_spin ? new Date(profile.last_free_spin).toDateString() : null;
    const today = new Date().toDateString();
    const isFree = lastSpinDate !== today;

    if (!isFree && currentBalance < 20) {
      showAlert({ message: 'Insufficient Origins for spin (20 ORG).', type: 'warning' });
      return;
    }

    setIsSpinning(true);
    setLastSpinResult(null);

    // Simulate spin
    setTimeout(async () => {
      const prizes = [5, 10, 25, 50, 100];
      const weights = [40, 30, 20, 8, 2]; // Probabilities
      let random = Math.random() * 100;
      let prize = 5;
      let sum = 0;
      for (let i = 0; i < prizes.length; i++) {
        sum += weights[i];
        if (random <= sum) {
          prize = prizes[i];
          break;
        }
      }

      setLastSpinResult(prize);
      
      const updates: any = {
        received_origins: (profile?.received_origins || 0) + prize
      };

      if (isFree) {
        updates.last_free_spin = new Date().toISOString();
      } else {
        updates.spent_origins = (profile?.spent_origins || 0) + 20;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (!error) {
        onUpdate(user.id);
        showAlert({ message: `Won ${prize} Origins!`, type: 'success' });
      }
      setIsSpinning(false);
    }, 2000);
  }

  async function handlePurchase(type: 'badge' | 'theme' | 'pattern' | 'achievement' | 'gradient' | 'font', item: string, price: number) {
    if (currentBalance < price) {
      showAlert({ message: 'Insufficient Origins.', type: 'warning' });
      return;
    }

    setLoading(true);
    const newSpent = (profile?.spent_origins || 0) + price;
    
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
    } else if (type === 'gradient') {
      updates.purchased_gradients = [...(profile?.purchased_gradients || []), item];
    } else if (type === 'font') {
      updates.purchased_fonts = [...(profile?.purchased_fonts || []), item];
    }

    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (!error) {
      showAlert({ message: 'Item acquired!', type: 'success' });
      onUpdate(user.id);
    } else {
      showAlert({ message: error.message, type: 'error' });
    }
    setLoading(false);
  }

  async function handlePurchasePet(pet: any) {
    if (currentBalance < pet.price) {
      showAlert({ message: 'Insufficient Origins.', type: 'warning' });
      return;
    }

    setLoading(true);

    const { error: petError } = await supabase.from('user_pets').insert({
      user_id: user.id,
      pet_id_name: pet.id,
      pet_name: pet.id.charAt(0).toUpperCase() + pet.id.slice(1),
      is_active: true,
      is_hidden: false
    });

    if (!petError) {
      const newSpent = (profile?.spent_origins || 0) + pet.price;
      const { error: profileError } = await supabase.from('profiles').update({
        spent_origins: newSpent
      }).eq('id', user.id);
      
      if (profileError) {
        console.error("Profile update error:", profileError);
      }

      showAlert({ message: `${pet.id.charAt(0).toUpperCase() + pet.id.slice(1)} joined your journey!`, type: 'success' });
      onUpdate(user.id);
    } else {
      console.error("Adoption error:", petError);
      showAlert({ message: 'Failed to adopt.', type: 'error' });
    }
    setLoading(false);
  }

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ ЗАГРУЗКИ АВАТАРКИ
 async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
  if (!e.target.files?.[0]) return;
  const file = e.target.files[0];
  const fileExt = file.name.split('.').pop();
  const filePath = `${user.id}.${fileExt}`;

  setLoading(true);
  
  try {
    // Загружаем в бакет 'avatars'
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      showAlert({ message: uploadError.message, type: 'error' });
      setLoading(false);
      return;
    }

    // Получаем публичный URL с добавлением timestamp для обхода кэша
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    // Добавляем timestamp к URL чтобы браузер не кэшировал старую аватарку
    const avatarUrlWithCache = `${publicUrl}?t=${Date.now()}`;
    
    // Обновляем профиль
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrlWithCache })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Update error:', updateError);
      showAlert({ message: updateError.message, type: 'error' });
      setLoading(false);
      return;
    }
    
    // Обновляем локальное состояние
    setEditProfile(prev => ({ ...prev, avatar_url: avatarUrlWithCache }));
    
    // Обновляем основной профиль через onUpdate
    onUpdate(user.id);
    
    showAlert({ message: 'Avatar uploaded!', type: 'success' });
  } catch (err: any) {
    console.error('Avatar error:', err);
    showAlert({ message: err.message || 'Failed to upload avatar', type: 'error' });
  } finally {
    setLoading(false);
  }
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
  if (['mavebo', 'startorigin'].includes(profile?.username || '') && !allAvailableBadges.includes('verified')) allAvailableBadges.push('verified');
  if (profile?.username === 'zaharques') {
    if (!allAvailableBadges.includes('computer')) allAvailableBadges.push('computer');
    if (!allAvailableBadges.includes('star')) allAvailableBadges.push('star');
  }

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8 space-y-12 min-h-screen">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">{t('settings.title')}</h1>
          <p className="text-slate-400 font-medium text-sm">{t('settings.subtitle')}</p>
        </div>
        <div className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center gap-2 shadow-sm">
           <Coins size={18} className="text-amber-500" />
           <span className="font-bold text-black">{currentBalance.toFixed(0)}</span>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
         <button onClick={() => setShowShop(true)} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-2 group hover:bg-white transition-all shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-purple-500 group-hover:scale-110 transition-all shadow-inner"><ShoppingBag size={20}/></div>
            <div className="text-[10px] font-bold uppercase tracking-widest">{t('settings.shop')}</div>
         </button>
         <button onClick={() => setShowLeaderboard(true)} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-2 group hover:bg-white transition-all shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-amber-500 group-hover:scale-110 transition-all shadow-inner"><Trophy size={20}/></div>
            <div className="text-[10px] font-bold uppercase tracking-widest">{t('settings.leaderboard')}</div>
         </button>
      </div>

      {/* Edit Profile Section */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 px-2">{t('settings.profile_section')}</h2>
        <div className="bg-slate-50 border border-slate-100 p-5 rounded-[2rem] space-y-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white overflow-hidden flex items-center justify-center relative group shadow-inner border border-slate-100">
              {editProfile.avatar_url ? <img src={editProfile.avatar_url} className="w-full h-full object-cover" /> : <User size={28} className="text-slate-200" />}
              <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                 <Camera size={20} className="text-white" />
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
                  className="w-full h-14 px-6 bg-white border border-slate-100 rounded-2xl focus:ring-0 text-base font-bold text-black shadow-inner"
                  placeholder={t('settings.name_placeholder')}
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest px-2">Nickname</label>
                <input 
                  value={editProfile.username}
                  onChange={(e) => setEditProfile({ ...editProfile, username: e.target.value })}
                  className="w-full h-14 px-6 bg-white border border-slate-100 rounded-2xl focus:ring-0 text-base font-bold text-black shadow-inner"
                  placeholder={t('settings.username_placeholder')}
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest px-2">Bio</label>
                <textarea 
                  value={editProfile.bio}
                  onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
                  className="w-full h-32 px-6 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-0 text-base font-medium text-black resize-none shadow-inner"
                  placeholder={t('settings.bio_placeholder')}
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
        <button 
          onClick={() => setShowBadgesExpanded(!showBadgesExpanded)}
          className="w-full h-16 flex items-center justify-between px-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-white transition-all shadow-sm group"
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-300 group-hover:text-purple-500 transition-colors shadow-inner">
               <Medal size={20} />
             </div>
             <span className="text-xs font-bold uppercase tracking-widest text-black">My Badges</span>
          </div>
          {showBadgesExpanded ? <ChevronUp size={20} className="text-slate-300" /> : <ChevronDown size={20} className="text-slate-300" />}
        </button>

        <AnimatePresence>
          {showBadgesExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2.5rem] space-y-6 shadow-sm mt-4">
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
                          onMoveUp={() => handleMoveBadge(id, 'up')}
                          onMoveDown={() => handleMoveBadge(id, 'down')}
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
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Decoration Settings */}
      <section className="space-y-6">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 px-2">{t('settings.appearance')}</h2>
        <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2.5rem] space-y-8 shadow-sm">
           <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest px-2">Theme</label>
                <select 
                  value={editProfile.theme_preference}
                  onChange={(e) => setEditProfile({ ...editProfile, theme_preference: e.target.value })}
                  className="w-full h-14 px-6 bg-white border border-slate-100 rounded-2xl focus:ring-0 text-sm font-bold text-black shadow-inner appearance-none"
                >
                  <option value="default">{t('landing.items.themes.default')}</option>
                  {(profile?.unlocked_themes || []).map(themeId => (
                    <option key={themeId} value={themeId}>{t(`landing.items.themes.${themeId}`)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest px-2">{t('settings.appearance')}</label>
                <select 
                  value={editProfile.pattern_preference}
                  onChange={(e) => setEditProfile({ ...editProfile, pattern_preference: e.target.value })}
                  className="w-full h-14 px-6 bg-white border border-slate-100 rounded-2xl focus:ring-0 text-sm font-bold text-black shadow-inner appearance-none"
                >
                  <option value="none">{t('landing.items.patterns.none')}</option>
                  {(profile?.unlocked_patterns || []).map(p => (
                    <option key={p} value={p}>{t(`landing.items.patterns.${p}`)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest px-2">{t('settings.gradient')}</label>
                <select 
                  value={editProfile.active_gradient || 'none'}
                  onChange={(e) => setEditProfile({ ...editProfile, active_gradient: e.target.value === 'none' ? null : e.target.value })}
                  className="w-full h-14 px-6 bg-white border border-slate-100 rounded-2xl focus:ring-0 text-sm font-bold text-black shadow-inner appearance-none"
                >
                  <option value="none">{t('landing.items.patterns.none')}</option>
                  {(profile?.purchased_gradients || []).map(g => (
                    <option key={g} value={g}>{t(`landing.items.gradients.${g}`)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest px-2">{t('settings.typography')}</label>
                <select 
                  value={editProfile.active_font || 'modern'}
                  onChange={(e) => setEditProfile({ ...editProfile, active_font: e.target.value })}
                  className="w-full h-14 px-6 bg-white border border-slate-100 rounded-2xl focus:ring-0 text-sm font-bold text-black shadow-inner appearance-none"
                >
                  {(profile?.purchased_fonts || ['modern']).map(f => (
                    <option key={f} value={f}>{t(`landing.items.fonts.${f}`)}</option>
                  ))}
                </select>
              </div>
           </div>
           <button onClick={handleUpdateProfile} className="w-full h-12 bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all">{t('settings.apply')}</button>
        </div>
      </section>

      {/* Mini Games Section */}
      <section className="space-y-6">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 px-2">Mini Games</h2>
        <button 
          onClick={() => setShowMiniGames(!showMiniGames)}
          className="w-full h-16 flex items-center justify-between px-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-white transition-all shadow-sm group"
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-300 group-hover:text-amber-500 transition-colors shadow-inner">
               <Gamepad size={20} />
             </div>
             <span className="text-xs font-bold uppercase tracking-widest text-black">Play & Earn</span>
          </div>
          {showMiniGames ? <ChevronUp size={20} className="text-slate-300" /> : <ChevronDown size={20} className="text-slate-300" />}
        </button>

        <AnimatePresence>
          {showMiniGames && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 overflow-hidden mt-4"
            >
              {/* Wheel of Origins */}
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2.5rem] space-y-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                   <Sparkles className="text-amber-500" size={20} />
                   <span className="text-sm font-bold text-black uppercase tracking-widest">Wheel of Origins</span>
                </div>
                <div className="relative aspect-square max-w-[200px] mx-auto bg-white rounded-full border-4 border-slate-100 shadow-xl flex items-center justify-center overflow-hidden">
                   <motion.div 
                     animate={{ rotate: isSpinning ? 3600 : 0 }}
                     transition={{ duration: 2, ease: "easeInOut" }}
                     className="absolute inset-0 flex items-center justify-center"
                   >
                     {[0, 72, 144, 216, 288].map((deg, i) => (
                       <div key={deg} style={{ transform: `rotate(${deg}deg) translateY(-60px)` }} className="absolute text-[10px] font-bold text-slate-300">
                         {[5, 10, 25, 50, 100][i]}
                       </div>
                     ))}
                   </motion.div>
                   <div className="z-10 text-center">
                     {lastSpinResult ? (
                       <div className="text-3xl font-black text-amber-500 animate-bounce">+{lastSpinResult}</div>
                     ) : (
                       <Coins size={40} className="text-slate-100" />
                     )}
                   </div>
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-6 bg-black rounded-b-full z-20 shadow-lg" />
                </div>
                <button 
                  onClick={handleWheelSpin}
                  disabled={isSpinning}
                  className="w-full h-12 bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isSpinning ? 'Spinning...' : (new Date(profile?.last_free_spin || 0).toDateString() === new Date().toDateString() ? 'Spin (20 ORG)' : 'Free Daily Spin')}
                </button>
              </div>

              {/* Secret Quest */}
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2.5rem] space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Compass className="text-slate-300" size={20} />
                      <span className="text-sm font-bold text-black uppercase tracking-widest">Secret Quest</span>
                   </div>
                   <button onClick={() => setShowSecretInput(!showSecretInput)} className="text-[10px] font-bold text-purple-500 uppercase tracking-widest px-4 py-2 bg-purple-50 rounded-xl">Initiate</button>
                </div>
                {showSecretInput && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                     <input 
                       value={secretCode}
                       onChange={(e) => setSecretCode(e.target.value)}
                       className="w-full h-12 px-6 bg-white border border-slate-100 rounded-xl focus:ring-0 text-base font-bold text-black"
                       placeholder="Enter secret code..."
                       onKeyDown={(e) => e.key === 'Enter' && handleSecretQuest()}
                     />
                     <button onClick={handleSecretQuest} className="w-full h-10 bg-purple-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all">Verify Essence</button>
                  </div>
                )}
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Info Section */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 px-2">Nexus Information</h2>
        <div className="bg-slate-50 border border-slate-100 rounded-[2rem] overflow-hidden divide-y divide-slate-100 shadow-sm">
           <ExternalLink icon={Mail} label="Echo (Support)" href="mailto:gerxog04@gmail.com" value="Contact" />
           <ExternalLink icon={Info} label="Architecture" href="#" value="v1.4.2" />
        </div>
      </section>

      {/* Resources Section */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 px-2">Resources</h2>
        <div className="bg-slate-50 border border-slate-100 rounded-[2rem] overflow-hidden divide-y divide-slate-100 shadow-sm">
           <ExternalLink icon={Book} label="Documentation" href="https://startorigin.gitbook.io/startorigin" value="View" />
           <ExternalLink icon={Shield} label="Rules" href="https://startorigin.gitbook.io/startorigin/rules" value="Read" />
           <div 
             onClick={() => navigate('/help')}
             className="w-full p-4 flex items-center justify-between hover:bg-white transition-all cursor-pointer group"
           >
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-black transition-colors shadow-sm">
                    <Info size={16} />
                 </div>
                 <span className="text-[11px] font-bold text-black uppercase tracking-widest">Help Center</span>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
           </div>
        </div>
      </section>

      {/* Footer */}
      <button 
        onClick={signOut}
        className="w-full h-16 flex items-center justify-center gap-3 text-rose-500 font-bold bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 rounded-[2rem] transition-all mb-24 shadow-sm"
      >
        <LogOut size={20} />
        {t('settings.logout')}
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
                         <span className="font-bold text-amber-500">{currentBalance.toFixed(0)} {t('shop.available')}</span>
                      </div>
                   </div>
                   <button onClick={() => setShowShop(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all"><X size={24}/></button>
                </div>

                 <div className="flex gap-2 p-1 bg-white/5 rounded-2xl overflow-x-auto custom-scrollbar no-scrollbar">
                     <button onClick={() => setActiveShopTab('badges')} className={cn("flex-1 min-w-[80px] h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", activeShopTab === 'badges' ? "bg-white text-black shadow-lg" : "text-white/50 hover:text-white")}>{t('shop.tabs.badges')}</button>
                    <button onClick={() => setActiveShopTab('pets')} className={cn("flex-1 min-w-[80px] h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", activeShopTab === 'pets' ? "bg-white text-black shadow-lg" : "text-white/50 hover:text-white")}>{t('shop.tabs.pets')}</button>
                    <button onClick={() => setActiveShopTab('gradients')} className={cn("flex-1 min-w-[80px] h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", activeShopTab === 'gradients' ? "bg-white text-black shadow-lg" : "text-white/50 hover:text-white")}>{t('shop.tabs.gradients')}</button>
                    <button onClick={() => setActiveShopTab('fonts')} className={cn("flex-1 min-w-[80px] h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", activeShopTab === 'fonts' ? "bg-white text-black shadow-lg" : "text-white/50 hover:text-white")}>{t('shop.tabs.fonts')}</button>
                    <button onClick={() => setActiveShopTab('decorations')} className={cn("flex-1 min-w-[80px] h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", activeShopTab === 'decorations' ? "bg-white text-black shadow-lg" : "text-white/50 hover:text-white")}>{t('shop.tabs.styles')}</button>
                    <button onClick={() => setActiveShopTab('achievements')} className={cn("flex-1 min-w-[80px] h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", activeShopTab === 'achievements' ? "bg-white text-black shadow-lg" : "text-white/50 hover:text-white")}>{t('shop.tabs.tasks')}</button>
                 </div>

                  {activeShopTab === 'pets' && (
                    <div className="grid grid-cols-2 gap-4">
                       {PET_CONFIG.map((pet) => (
                          <div key={pet.id} className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col items-center gap-6 group">
                             <div className={cn("w-20 h-20 rounded-[2rem] bg-white flex items-center justify-center transition-all duration-700 group-hover:scale-110 shadow-2xl overflow-hidden", pet.color)}>
                                <img src={pet.image} alt={t(`landing.items.pets.${pet.key}`)} className="w-14 h-14 object-contain" />
                             </div>
                             <div className="text-center">
                                <div className="text-white font-bold text-lg mb-1">{t(`landing.items.pets.${pet.key}`)}</div>
                                <div className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.3em]">
  {pet.price} ORG
</div>
                             </div>
                             <button 
                               onClick={() => handlePurchasePet(pet)}
                               className="w-full h-12 bg-white text-black rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-400 transition-all"
                             >
                               {t('shop.adopt')}
                             </button>
                          </div>
                       ))}
                    </div>
                 )}

                 {activeShopTab === 'badges' && (
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(BADGE_CONFIG).map(([id, cfg]) => {
                         const isPurchased = profile?.purchased_badges?.includes(id);
                         const price = BADGE_PRICES[id] || 0;
                         
                         if (id === 'verified' && !isPurchased) return null;
                         
                         return (
                           <div key={id} className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col items-center gap-4 text-center group">
                              <div className={cn("w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center transition-all duration-500 group-hover:scale-125", cfg.color)}>
                                 <cfg.icon size={28} />
                              </div>
                              <div>
                                 <div className="text-white font-bold text-sm tracking-tight">{t(`landing.items.badges.${cfg.key}`)}</div>
                                 <div className="text-[10px] text-white/40 font-bold mt-1 uppercase tracking-[0.2em]">
                                   {isPurchased ? 'Owned' : `${price} ORG`}
                                 </div>
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
                                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                                      {ach.description} • {price} ORG
                                    </div>
                                 </div>
                              </div>
                              {!isPurchased ? (
                                <button onClick={() => handlePurchase('achievement', ach.id, price)} className="h-10 px-6 bg-white text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl">Buy</button>
                              ) : <Check className="text-emerald-500" size={20} />}
                           </div>
                         );
                      })}
                   </div>
                 )}

                 {activeShopTab === 'fonts' && (
                    <div className="grid grid-cols-1 gap-4">
                       {Object.entries(FONT_CONFIG).map(([id, cfg]) => {
                          const isOwned = (profile?.purchased_fonts || []).includes(id) || id === 'modern';
                          const price = FONT_PRICES[id];
                          return (
                            <div key={id} className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-between group">
                               <div className="flex flex-col gap-1">
                                  <div className={cn("text-xl font-bold tracking-tight text-white", cfg.className)}>
                                    {profile?.name || profile?.username || 'Typography'}
                                  </div>
                                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{t(`landing.items.fonts.${id}`)}</div>
                               </div>
                               {!isOwned ? (
                                 <button onClick={() => handlePurchase('font', id, price)} className="h-10 px-6 bg-white text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl">{price} ORG</button>
                               ) : <Check className="text-emerald-500" size={24} />}
                            </div>
                          );
                       })}
                    </div>
                  )}

                 {activeShopTab === 'gradients' && (
                    <div className="grid grid-cols-1 gap-4">
                       {Object.entries(GRADIENT_CONFIG).map(([id, cfg]) => {
                          const isOwned = profile?.purchased_gradients?.includes(id);
                          const price = GRADIENT_PRICES[id];
                          return (
                            <div key={id} className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-between group">
                               <div className="flex flex-col gap-1">
                                  <div className={cn("text-xl font-black uppercase tracking-tighter italic", cfg.className)}>
                                    {profile?.username || 'Gradients'}
                                  </div>
                                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{t(`landing.items.gradients.${id}`)}</div>
                               </div>
                               {!isOwned ? (
                                 <button onClick={() => handlePurchase('gradient', id, price)} className="h-10 px-6 bg-white text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl">{price} ORG</button>
                               ) : <Check className="text-emerald-500" size={24} />}
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
                                    <div className="text-white font-bold text-sm uppercase tracking-widest">{t(`landing.items.patterns.${id}`)}</div>
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
    </div>
  );
}

function SortableBadgeItem({ id, badge, isHidden, onToggleVisibility, onMoveUp, onMoveDown }: any) {
  const { t } = useTranslation();
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
        <div className="text-sm font-bold text-black">{t(`landing.items.badges.${badge.key}`)}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <button onClick={onMoveUp} className="p-1 text-slate-300 hover:text-black transition-all">
            <ChevronUp size={14} />
          </button>
          <button onClick={onMoveDown} className="p-1 text-slate-300 hover:text-black transition-all">
            <ChevronDown size={14} />
          </button>
        </div>
        <button 
          onClick={onToggleVisibility} 
          className={cn("p-2 transition-all", isHidden ? "text-slate-300 hover:text-black" : "text-black hover:opacity-60")}
        >
          {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
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
        className="bg-transparent border-none p-0 focus:ring-0 text-base font-bold md:text-right placeholder-slate-200 focus:placeholder-slate-200 text-black w-full md:w-auto"
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