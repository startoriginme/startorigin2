import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Photo } from '../types';
import { 
  Heart, Globe, Users, X, Flame, Trophy, Sparkles, Camera, Star, Search, 
  Loader2, User, Grid, MessageSquare, BadgeCheck, Snowflake, Monitor, 
  Crown, Diamond, Award, Rocket, Leaf, Moon, Sun, Music, Book, Coffee, 
  Gamepad, Gift, Smile, Layout, Pin, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn, optimizeImage } from '../lib/utils';
import PhotoViewer from '../components/PhotoViewer';
import LinkifiedText from '../components/LinkifiedText';
import { GRADIENT_CONFIG, FONT_CONFIG } from '../constants/shop';

// Swipe Achievement thresholds
const SWIPE_ACHIEVEMENTS = [
  { count: 10, title: "Photo Explorer", icon: Camera, color: "text-green-500", description: "Swiped 10 photos" },
  { count: 30, title: "Photo Hunter", icon: Search, color: "text-blue-500", description: "Swiped 30 photos" },
  { count: 60, title: "Photo Master", icon: Star, color: "text-purple-500", description: "Swiped 60 photos" },
  { count: 120, title: "Photo Legend", icon: Flame, color: "text-orange-500", description: "Swiped 120 photos" },
  { count: 250, title: "Photo Guru", icon: Sparkles, color: "text-yellow-500", description: "Swiped 250 photos" },
  { count: 500, title: "Photo God", icon: Trophy, color: "text-cyan-500", description: "Swiped 500 photos" },
];

export default function Feed({ user }: { user: any }) {
  const { t } = useTranslation();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [source, setSource] = useState<'circle' | 'global' | 'clan'>('global');
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  
  const [viewer, setViewer] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastPhotoRef = useRef<HTMLDivElement | null>(null);
  
  // Tinder Mode states
  const [tinderMode, setTinderMode] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [swipeCount, setSwipeCount] = useState(0);
  const [showAchievement, setShowAchievement] = useState<any>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isFollowingEmpty = !loading && items.length === 0;
  
  useEffect(() => {
    fetchUserProfile();
    fetchInitialFeed();
    loadUserSwipeCount();
    fetchUnreadCount();

    const channel = supabase
      .channel('feed-unread')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user.id, source]);

  async function fetchUnreadCount() {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false);
    setUnreadCount(count || 0);
  }

  async function loadUserSwipeCount() {
    const { data, error } = await supabase
      .from('profiles')
      .select('swipe_count')
      .eq('id', user.id)
      .single();
    
    if (!error && data?.swipe_count !== null) {
      setSwipeCount(data.swipe_count);
    }
  }

  async function fetchInitialFeed() {
    setLoading(true);
    setPage(0);
    setHasMore(true);
    const initialItems = await fetchFeedItems(0);
    setItems(initialItems);
    setLoading(false);
  }

  async function fetchUserProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setUserProfile(data);
  }

  async function fetchFeedItems(offset: number) {
    // 1. Prepare queries
    let photosQuery = supabase.from('photos').select('*, owner:profiles(*), likes:likes(count)').range(offset, offset + 11);
    let postsQuery = supabase.from('posts').select('*, owner:profiles(*)').range(offset, offset + 11);

    // Sorting must be done carefully in case pinned_at is missing
    photosQuery = photosQuery.order('created_at', { ascending: false });
    postsQuery = postsQuery.order('created_at', { ascending: false });

    // 2. Apply Source Filters
    if (source === 'circle') {
      const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
      const followingIds = [user.id, ...(follows?.map(f => f.following_id) || [])];
      photosQuery = photosQuery.in('user_id', followingIds);
      postsQuery = postsQuery.in('user_id', followingIds);
    } else if (source === 'clan' && userProfile?.clan) {
      const { data: clanMembers } = await supabase.from('profiles').select('id').eq('clan', userProfile.clan);
      const memberIds = clanMembers?.map(m => m.id) || [];
      photosQuery = photosQuery.in('user_id', memberIds);
      postsQuery = postsQuery.in('user_id', memberIds);
    } else {
      photosQuery = photosQuery.eq('privacy', 'public');
    }

    try {
      const [photosRes, postsRes] = await Promise.all([photosQuery, postsQuery]);
      const items: any[] = [];
      
      if (photosRes.data) {
        photosRes.data.forEach(p => items.push({ ...p, type: 'photo' }));
      }
      
      if (postsRes.data) {
        postsRes.data.forEach(p => items.push({ ...p, type: 'post' }));
      }

      return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (err) {
      console.error('Feed fetch error:', err);
      return [];
    }
  }

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const newItems = await fetchFeedItems(nextPage * 12);
    
    if (newItems.length > 0) {
      setItems(prev => [...prev, ...newItems]);
      setPage(nextPage);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  }, [page, source, loadingMore, hasMore]);

  useEffect(() => {
    if (!lastPhotoRef.current || tinderMode) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore();
    });

    observerRef.current.observe(lastPhotoRef.current);
    return () => observerRef.current?.disconnect();
  }, [items, loadMore, tinderMode]);

  async function updateSwipeCount(newCount: number) {
    // Attempting update - if column doesn't exist it fails silently
    await supabase.from('profiles').update({ swipe_count: newCount }).eq('id', user.id);
    const achievement = SWIPE_ACHIEVEMENTS.find(a => a.count === newCount);
    if (achievement) {
      setShowAchievement(achievement);
      setTimeout(() => setShowAchievement(null), 3500);
    }
  }

  const handleSwipe = (direction: 'left' | 'right') => {
    const nextIndex = (currentPhotoIndex + 1) % (items.length || 1);
    setCurrentPhotoIndex(nextIndex);
    const newCount = swipeCount + 1;
    setSwipeCount(newCount);
    updateSwipeCount(newCount);
    setDragOffset({ x: 0, y: 0 });
  };

  if (tinderMode) {
    const photosOnly = items.filter(i => i.type === 'photo');
    const currentPhoto = photosOnly[currentPhotoIndex];
    
    return (
      <div className="fixed inset-0 z-[500] bg-white flex flex-col items-center justify-center p-4">
        <button 
          onClick={() => setTinderMode(false)} 
          className="absolute top-6 right-6 z-[600] p-4 bg-white shadow-xl hover:bg-slate-50 rounded-2xl transition-all text-slate-400 border border-slate-100"
        >
          <X size={24} />
        </button>

        <div className="absolute top-16 md:top-20 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white px-6 py-3 rounded-full border border-slate-100 shadow-2xl z-[550]">
          <Flame className="text-orange-500" size={24} />
          <span className="font-bold text-xl text-black">{swipeCount}</span>
        </div>

        <AnimatePresence>
          {showAchievement && (
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="absolute top-24 glass-card p-4 flex items-center gap-4 z-50 shadow-2xl border-emerald-100 bg-emerald-50/50"
            >
              <showAchievement.icon className={showAchievement.color} size={24} />
              <div>
                <div className="font-bold text-black">{showAchievement.title}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{showAchievement.description}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative w-full max-w-sm aspect-[3/4]">
          {currentPhoto ? (
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={(_, info) => {
                setIsDragging(false);
                if (info.offset.x > 100) handleSwipe('right');
                else if (info.offset.x < -100) handleSwipe('left');
                else setDragOffset({ x: 0, y: 0 });
              }}
              onDrag={(_, info) => setDragOffset({ x: info.offset.x, y: info.offset.y })}
              animate={{ x: dragOffset.x, rotate: dragOffset.x * 0.05 }}
              className="w-full h-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 cursor-grab active:cursor-grabbing bg-slate-50"
            >
              <img src={currentPhoto.url} alt="" className="w-full h-full object-cover pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white/90 to-transparent">
                <h3 className="text-xl font-bold text-black">
                  <LinkifiedText text={currentPhoto.name} />
                </h3>
                <p className="text-black/60 font-medium text-sm">@{currentPhoto.owner?.username}</p>
              </div>
            </motion.div>
          ) : (
            <div className="w-full h-full rounded-[2.5rem] bg-slate-50 flex flex-col items-center justify-center text-slate-300">
              <Loader2 className="animate-spin mb-4" />
              <p className="font-bold text-xs uppercase tracking-widest">Finding matches...</p>
            </div>
          )}
        </div>

        <div className="mt-12 flex gap-8">
          <button 
            onClick={() => handleSwipe('left')}
            className="w-16 h-16 rounded-full border border-slate-100 bg-white flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all text-slate-300 shadow-sm"
          >
            <X size={28} />
          </button>
          <button 
            onClick={() => handleSwipe('right')}
            className="w-16 h-16 rounded-full border border-slate-100 bg-white flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-500 transition-all text-slate-300 shadow-sm"
          >
            <Heart size={28} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8 space-y-12 min-h-screen">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">{t('navigation.feed')}</h1>
    
        </div>
        <div className="flex gap-2 relative">
          <Link 
            to="/chat"
            className="p-3 bg-slate-50 rounded-2xl text-slate-400 border border-slate-100 hover:bg-white hover:text-black transition-all font-bold text-xs flex items-center justify-center relative"
            title="Messages"
          >
            <MessageSquare size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg shadow-emerald-500/20 px-1 border-2 border-white">
                {unreadCount}
              </span>
            )}
          </Link>
          <button 
            onClick={() => setTinderMode(true)}
            className="p-3 bg-slate-50 rounded-2xl text-orange-500 border border-slate-100 hover:bg-orange-50 transition-all font-bold text-xs flex items-center justify-center"
            title="Tinder Mode"
          >
            <Flame size={20} />
          </button>
          
                  <div className="relative">
            <button 
              onClick={() => setShowSourceSelector(!showSourceSelector)}
              className="h-12 px-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 hover:bg-white transition-all shadow-sm group"
            >
              {source === 'global' ? <Globe size={18} className="text-black" /> : source === 'clan' ? <span className="text-lg">{userProfile?.clan || 'Clans'}</span> : <Users size={18} className="text-black" />}
              <span className="text-[10px] font-bold uppercase tracking-widest text-black hidden sm:inline">
                {source}
              </span>
            </button>

            <AnimatePresence>
              {showSourceSelector && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-48 bg-white border border-slate-100 rounded-3xl shadow-2xl z-[600] overflow-hidden py-1"
                >
                  {[
                    { id: 'global', icon: Globe, label: 'Global' },
                    { id: 'circle', icon: Users, label: 'Circle' },
                    { id: 'clan', icon: () => <span className="text-lg">{userProfile?.clan || '🛡️'}</span>, label: 'Clan' }
                  ].map(s => (
                    <button 
                      key={s.id}
                      disabled={s.id === 'clan' && !userProfile?.clan}
                      onClick={() => { setSource(s.id as any); setShowSourceSelector(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 transition-all font-bold text-[11px] uppercase tracking-wider",
                        source === s.id ? "bg-black text-white" : "hover:bg-slate-50 text-slate-400",
                        s.id === 'clan' && !userProfile?.clan && "opacity-30 cursor-not-allowed"
                      )}
                    >
                      {typeof s.icon === 'function' ? <s.icon /> : <s.icon size={16} />} {s.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="space-y-12">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4 animate-pulse">
              <div className="h-10 w-40 bg-slate-50 rounded-full" />
              <div className="aspect-[4/3] rounded-[2.5rem] bg-slate-50" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-16">
          {items.map((item: any, i) => (
            <div 
              key={item.id} 
              ref={i === items.length - 1 ? lastPhotoRef : null}
            >
              {item.type === 'photo' ? (
                 <PhotoCard 
                   photo={item} 
                   user={user} 
                   onOpen={() => setViewer(item)} 
                 />
              ) : (
                 <WallPostCard post={item} user={user} />
              )}
            </div>
          ))}
          
          {isFollowingEmpty && (
            <div className="py-20 text-center space-y-6">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-100">
                <Grid size={40} />
              </div>
              <div className="space-y-2">
                <p className="text-black font-bold">{t('feed.empty_following')}</p>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">{t('feed.empty_following_sub')}</p>
              </div>
              <button 
                onClick={() => setSource('global')}
                className="btn-primary h-12 px-8 uppercase tracking-widest text-[10px]"
              >
                {t('feed.explore_globally')}
              </button>
            </div>
          )}
        </div>
      )}

      {loadingMore && <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-200" size={24} /></div>}

      <AnimatePresence>
        {viewer && <PhotoViewer photo={viewer} onClose={() => setViewer(null)} />}
      </AnimatePresence>
    </div>
  );
}

function PhotoCard({ photo, user, onOpen }: { photo: any, user: any, onOpen: () => void }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (photo.likes?.[0]) {
      setLikesCount(prev => (photo.likes[0].count === prev ? prev : photo.likes[0].count));
    } else {
      setLikesCount(0);
    }
    checkIfLiked();
  }, [photo.id, user.id]);

  async function checkIfLiked() {
    const { data } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', user.id)
      .eq('photo_id', photo.id)
      .single();
    if (data) setLiked(true);
  }

  async function toggleLike(e: React.MouseEvent) {
    e.stopPropagation();
    if (liked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('photo_id', photo.id);
      setLikesCount(prev => Math.max(0, prev - 1));
    } else {
      await supabase.from('likes').insert({ user_id: user.id, photo_id: photo.id });
      setLiked(true);
      setLikesCount(prev => prev + 1);
    }
    setLiked(!liked);
  }

  return (
    <div className="space-y-6 group">
      <div className="flex items-center justify-between px-2">
        <Link to={`/profile/${photo.owner?.username}`} className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-white border border-slate-100 p-0.5">
            <div className="w-full h-full rounded-full overflow-hidden bg-white">
               {photo.owner?.avatar_url ? (
                 <img src={photo.owner.avatar_url} className="w-full h-full object-cover" />
               ) : <User className="w-full h-full p-2 text-slate-300" />}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <div className={cn(
                "text-sm font-bold group-hover:underline underline-offset-4",
                photo.owner?.active_gradient ? GRADIENT_CONFIG[photo.owner.active_gradient]?.className : "text-black",
                photo.owner?.active_font ? FONT_CONFIG[photo.owner.active_font]?.className : ""
              )}>
                {photo.owner?.name || photo.owner?.username}
              </div>
              {photo.owner?.clan && <span className="text-sm">{photo.owner.clan}</span>}
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
              {formatDistanceToNow(new Date(photo.created_at))} ago
            </div>
          </div>
        </Link>
      </div>

      <div 
        onClick={onOpen}
        className="aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-slate-50 border border-slate-100 cursor-zoom-in relative group/image shadow-sm"
      >
        <img 
          src={optimizeImage(photo.url, 800)} 
          alt="" 
          className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover/image:scale-110" 
          loading="lazy" 
        />
      </div>

      <div className="flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleLike}
            className={cn("flex items-center gap-2 transition-all active:scale-75", liked ? "text-rose-500 scale-110" : "text-slate-300 hover:text-slate-900")}
          >
            <Heart size={24} className={liked ? "fill-current" : ""} />
            <span className="text-xs font-bold">{likesCount}</span>
          </button>
        </div>
        <div 
          onClick={() => navigate(`/posts/${photo.id}`)}
          className="text-[10px] font-bold text-black uppercase tracking-[0.3em] hover:underline underline-offset-4 max-w-[150px] truncate block text-right cursor-pointer"
        >
          <LinkifiedText text={photo.name} />
        </div>
      </div>
    </div>
  );
}

function WallPostCard({ post, user }: { post: any, user: any }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);

  useEffect(() => {
    checkIfLiked();
  }, [post.id, user.id]);

  async function checkIfLiked() {
    const { data } = await supabase
      .from('post_likes')
      .select('*')
      .eq('user_id', user.id)
      .eq('post_id', post.id)
      .single();
    if (data) setLiked(true);
  }

  async function toggleLike(e: React.MouseEvent) {
    e.stopPropagation();
    if (liked) {
      await supabase.from('post_likes').delete().eq('user_id', user.id).eq('post_id', post.id);
      setLikesCount(prev => Math.max(0, prev - 1));
    } else {
      await supabase.from('post_likes').insert({ user_id: user.id, post_id: post.id });
      setLiked(true);
      setLikesCount(prev => prev + 1);
    }
    setLiked(!liked);
  }

  return (
    <div className="space-y-6 group">
      <div className="flex items-center justify-between px-2">
        <Link to={`/profile/${post.owner?.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-slate-100 p-0.5 shadow-sm">
            <div className="w-full h-full rounded-full overflow-hidden bg-white">
               {post.owner?.avatar_url ? (
                 <img src={post.owner.avatar_url} className="w-full h-full object-cover" />
               ) : <User className="w-full h-full p-2 text-slate-300" />}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "text-sm font-bold uppercase tracking-tight",
                post.owner?.active_gradient ? GRADIENT_CONFIG[post.owner.active_gradient]?.className : "text-black",
                post.owner?.active_font ? FONT_CONFIG[post.owner.active_font]?.className : ""
              )}>
                {post.owner?.name || post.owner?.username}
              </div>
              {post.owner?.clan && <span className="text-lg" title={`Member of ${post.owner.clan} clan`}>{post.owner.clan}</span>}
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
              {formatDistanceToNow(new Date(post.created_at))} ago
            </div>
          </div>
        </Link>
        {post.pinned_at && (
          <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
            <Pin size={10} fill="currentColor" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Pinned Post</span>
          </div>
        )}
      </div>

      <div className={cn(
        "glass-card p-10 rounded-[3rem] border border-black/5 relative space-y-6 bg-white/40 backdrop-blur-sm transition-all hover:bg-white/60",
        post.pinned_at && "ring-1 ring-amber-400/30 shadow-[0_0_40px_rgba(251,191,36,0.05)]"
      )}>
        <p className="text-lg font-medium text-black leading-relaxed whitespace-pre-wrap tracking-tight">
          <LinkifiedText text={post.content} />
        </p>

        {post.attachments && post.attachments.length > 0 && (
          <div className={cn(
            "grid gap-4 mt-8",
            post.attachments.length === 1 ? "grid-cols-1" : "grid-cols-2"
          )}>
            {post.attachments.map((url: string, i: number) => (
              <div key={i} className="aspect-square rounded-[2.5rem] overflow-hidden bg-white shadow-md border border-slate-100 group/att cursor-zoom-in">
                <img src={optimizeImage(url, 800)} className="w-full h-full object-cover transition-transform duration-700 group-hover/att:scale-105" loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <button 
            onClick={toggleLike}
            className={cn("flex items-center gap-3 transition-all active:scale-75 group", liked ? "text-rose-500 scale-110" : "text-slate-300 hover:text-black")}
          >
            <Heart size={28} className={liked ? "fill-current" : "group-hover:scale-110 transition-transform"} />
            <span className="text-sm font-bold">{likesCount}</span>
          </button>
        </div>
        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em] bg-slate-50 px-4 py-2 rounded-xl">Wall Post</div>
      </div>
    </div>
  );
}
