import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Photo, Profile } from '../types';
import { Heart, ChevronLeft, User, MessageCircle, Share2, MoreHorizontal, Loader2, Bookmark, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Post({ user }: { user: any }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [similarPhotos, setSimilarPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchSimilarPosts();
      if (user) checkIsSaved();
    }
  }, [id, user]);

  async function checkIsSaved() {
    if (!user || !id) return;
    const { data } = await supabase
      .from('saved_photos')
      .select('id')
      .eq('user_id', user.id)
      .eq('photo_id', id)
      .single();
    setIsSaved(!!data);
  }

  async function toggleSave() {
    if (!user || !photo || saving) return;
    setSaving(true);
    try {
      if (isSaved) {
        await supabase
          .from('saved_photos')
          .delete()
          .eq('user_id', user.id)
          .eq('photo_id', photo.id);
        setIsSaved(false);
      } else {
        await supabase
          .from('saved_photos')
          .insert({ user_id: user.id, photo_id: photo.id });
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
    } finally {
      setSaving(false);
    }
  }

  async function fetchSimilarPosts() {
    // Fetch up to 50 other photos to pick 16 randomly ( Pinterest-style )
    const { data } = await supabase
      .from('photos')
      .select('*, owner:profiles(username, name, avatar_url)')
      .neq('id', id)
      .limit(50);
    
    if (data) {
      // Shuffle client-side to ensure variety on each load
      const shuffled = [...data].sort(() => 0.5 - Math.random());
      setSimilarPhotos(shuffled.slice(0, 16) as any);
    }
  }

  async function fetchPost() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*, owner:profiles(*), likes:likes(count)')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setPhoto(data as any);
        if (data.likes?.[0]) {
          setLikesCount(data.likes[0].count);
        }
        checkIfLiked(data.id);
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      navigate('/feed');
    } finally {
      setLoading(false);
    }
  }

  async function checkIfLiked(photoId: string) {
    if (!user) return;
    const { data } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', user.id)
      .eq('photo_id', photoId)
      .single();
    if (data) setLiked(true);
  }

  async function toggleLike() {
    if (!photo || !user) return;
    
    if (liked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('photo_id', photo.id);
      setLikesCount(prev => Math.max(0, prev - 1));
      setLiked(false);
    } else {
      await supabase.from('likes').insert({ user_id: user.id, photo_id: photo.id });
      setLikesCount(prev => prev + 1);
      setLiked(true);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-200" size={32} />
      </div>
    );
  }

  if (!photo) return null;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto md:p-8">
        <div className="flex items-center gap-4 p-4 md:mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all text-slate-400"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-black truncate">{photo.name}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 pb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="aspect-[4/3] md:aspect-square bg-slate-50 md:rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100"
          >
            <img src={photo.url} alt="" className="w-full h-full object-cover" />
          </motion.div>

          <div className="p-6 md:p-0 space-y-12">
            <div className="flex items-center justify-between">
              <Link to={`/profile/${photo.owner?.username}`} className="flex items-center gap-4 group">
                <div className="w-14 h-14 rounded-full p-1 border border-slate-100 shadow-sm transition-transform group-hover:scale-105">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white">
                    {photo.owner?.avatar_url ? (
                      <img src={photo.owner.avatar_url} className="w-full h-full object-cover" />
                    ) : <User className="w-full h-full p-3 text-slate-200" />}
                  </div>
                </div>
                <div>
                  <h2 className="font-bold text-black text-lg group-hover:underline">{photo.owner?.name || photo.owner?.username}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {formatDistanceToNow(new Date(photo.created_at))} ago
                  </p>
                </div>
              </Link>
              
              <button className="p-3 text-slate-200 hover:text-black transition-colors">
                <MoreHorizontal size={24} />
              </button>
            </div>

            <div className="space-y-4">
               <h3 className="text-2xl font-bold text-black">{photo.name}</h3>
               <p className="text-slate-400 text-sm leading-relaxed">
                 Captured at <span className="text-black font-medium">{new Date(photo.created_at).toLocaleDateString()}</span>. 
                 This moment was preserved as part of the <span className="text-black font-medium">@{photo.owner?.username}</span> journey.
               </p>
            </div>

            <div className="flex items-center gap-6 pt-6 border-t border-slate-50">
              <button 
                onClick={toggleLike}
                className={cn(
                  "flex flex-col items-center gap-2 group transition-all",
                  liked ? "text-rose-500" : "text-slate-300 hover:text-black"
                )}
              >
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-all", liked ? "bg-rose-50" : "bg-slate-50 group-hover:bg-black group-hover:text-white")}>
                  <Heart size={28} className={liked ? "fill-current" : ""} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">{likesCount} Likes</span>
              </button>

              <button 
                onClick={toggleSave}
                disabled={saving || !user}
                className={cn(
                  "flex flex-col items-center gap-2 group transition-all",
                  isSaved ? "text-emerald-500" : "text-slate-300 hover:text-black"
                )}
              >
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-all", isSaved ? "bg-emerald-50" : "bg-slate-50 group-hover:bg-black group-hover:text-white")}>
                  {saving ? <Loader2 className="animate-spin" size={24} /> : isSaved ? <Check size={28} /> : <Bookmark size={28} />}
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">{isSaved ? 'Saved' : 'Save Moment'}</span>
              </button>

              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }}
                className="flex flex-col items-center gap-2 group transition-all text-slate-300 hover:text-black"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center transition-all group-hover:bg-black group-hover:text-white">
                  <Share2 size={28} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">Share Link</span>
              </button>
            </div>
          </div>
        </div>

        {/* Similar Posts Section */}
        {similarPhotos.length > 0 && (
          <div className="mt-8 p-6 md:p-0 space-y-8 pb-32">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-black tracking-tight">More like this</h3>
              <div className="h-px flex-1 bg-slate-50 mx-8 hidden md:block" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {similarPhotos.map((p) => (
                <Link 
                  key={p.id} 
                  to={`/posts/${p.id}`}
                  className="group space-y-4"
                >
                  <div className="aspect-[4/3] rounded-[2rem] overflow-hidden bg-slate-50 border border-slate-100 shadow-sm transition-all group-hover:scale-[1.02] group-hover:shadow-xl">
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="px-2">
                    <div className="text-[10px] font-bold text-black uppercase tracking-widest truncate">{p.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-4 h-4 rounded-full overflow-hidden bg-slate-100">
                        {p.owner?.avatar_url && <img src={p.owner.avatar_url} className="w-full h-full object-cover" />}
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">@{p.owner?.username}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
