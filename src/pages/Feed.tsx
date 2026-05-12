import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Photo } from '../types';
import { Heart, Globe, Users, X, Flame, Trophy, Sparkles, Camera, Star, Search, Loader2, User, Grid, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import PhotoViewer from '../components/PhotoViewer';

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
  const [followingPhotos, setFollowingPhotos] = useState<Photo[]>([]);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [showAll, setShowAll] = useState(false);
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

  const photos = showAll ? allPhotos : followingPhotos;
  const isFollowingEmpty = !loading && followingPhotos.length === 0 && !showAll;

  useEffect(() => {
    fetchInitialPhotos();
    loadUserSwipeCount();
  }, [user.id]);

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

  async function fetchInitialPhotos() {
    setLoading(true);
    const [following, all] = await Promise.all([
      fetchPhotos(false, 0),
      fetchPhotos(true, 0)
    ]);
    setFollowingPhotos(following);
    setAllPhotos(all);
    setLoading(false);
  }

  async function fetchPhotos(isAll: boolean, offset: number) {
    let query = supabase
      .from('photos')
      .select('*, owner:profiles(*), likes:likes(count)')
      .eq('privacy', 'public')
      .order('created_at', { ascending: false })
      .range(offset, offset + 11);

    if (!isAll) {
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      
      const followingIds = [user.id, ...(follows?.map(f => f.following_id) || [])];
      query = query.in('user_id', followingIds);
    }

    const { data } = await query;
    return (data || []) as Photo[];
  }

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const newPhotos = await fetchPhotos(showAll, nextPage * 12);
    
    if (newPhotos.length > 0) {
      if (showAll) setAllPhotos(prev => [...prev, ...newPhotos]);
      else setFollowingPhotos(prev => [...prev, ...newPhotos]);
      setPage(nextPage);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  }, [page, showAll, loadingMore, hasMore]);

  useEffect(() => {
    if (!lastPhotoRef.current || tinderMode) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore();
    });

    observerRef.current.observe(lastPhotoRef.current);
    return () => observerRef.current?.disconnect();
  }, [photos, loadMore, tinderMode]);

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
    const nextIndex = (currentPhotoIndex + 1) % (allPhotos.length || 1);
    setCurrentPhotoIndex(nextIndex);
    const newCount = swipeCount + 1;
    setSwipeCount(newCount);
    updateSwipeCount(newCount);
    setDragOffset({ x: 0, y: 0 });
  };

  if (tinderMode) {
    const currentPhoto = allPhotos[currentPhotoIndex];
    
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
                <h3 className="text-xl font-bold text-black">{currentPhoto.name}</h3>
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
          <h1 className="text-3xl font-bold tracking-tight text-black">Feed</h1>
    
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setTinderMode(true)}
            className="p-3 bg-slate-50 rounded-2xl text-orange-500 border border-slate-100 hover:bg-orange-50 transition-all"
            title="Tinder Mode"
          >
            <Flame size={20} />
          </button>
          <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-100">
            <button 
              onClick={() => { setShowAll(false); setPage(0); setHasMore(true); }}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-xl transition-all",
                !showAll ? "bg-white text-black shadow-sm" : "text-slate-400"
              )}
            >
              Circle
            </button>
            <button 
              onClick={() => { setShowAll(true); setPage(0); setHasMore(true); }}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-xl transition-all",
                showAll ? "bg-white text-black shadow-sm" : "text-slate-400"
              )}
            >
              Global
            </button>
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
          {photos.map((photo, i) => (
            <div key={photo.id} ref={i === photos.length - 1 ? lastPhotoRef : null}>
              <PhotoCard 
                photo={photo} 
                user={user} 
                onOpen={() => setViewer(photo)} 
              />
            </div>
          ))}
          
          {isFollowingEmpty && (
            <div className="py-20 text-center space-y-6">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-100">
                <Grid size={40} />
              </div>
              <div className="space-y-2">
                <p className="text-black font-bold">Your circle is quiet</p>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">Follow creative souls to populate your personal sanctuary with their essence.</p>
              </div>
              <button 
                onClick={() => setShowAll(true)}
                className="btn-primary h-12 px-8"
              >
                Explore Globally
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
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (photo.likes?.[0]) {
      setLikesCount(photo.likes[0].count);
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
            <div className="text-sm font-bold text-black group-hover:underline underline-offset-4">{photo.owner?.name || photo.owner?.username}</div>
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
        <img src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover/image:scale-110" />
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
        <Link to={`/posts/${photo.id}`} className="text-[10px] font-bold text-black uppercase tracking-[0.3em] hover:underline underline-offset-4 max-w-[150px] truncate block text-right">{photo.name}</Link>
      </div>
    </div>
  );
}
