import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Photo, Profile } from '../types';
import { 
  Heart, ChevronLeft, User, MessageCircle, Share2, MoreHorizontal, Loader2, 
  Bookmark, Check, BadgeCheck, Snowflake, Monitor, Star, Crown, Diamond, 
  Award, Rocket, Leaf, Moon, Sun, Music, Book, Coffee, Gamepad, Gift, 
  Smile, Sparkles, AlertCircle, X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { cn, optimizeImage } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { GRADIENT_CONFIG, FONT_CONFIG } from '../constants/shop';
import PhotoViewer from '../components/PhotoViewer';

export default function Post({ user }: { user: any }) {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [similarPhotos, setSimilarPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewer, setViewer] = useState<Photo | null>(null);

  const [showOptions, setShowOptions] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);

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
            onClick={() => setViewer(photo)}
            className="aspect-[4/3] md:aspect-square bg-slate-50 md:rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100 cursor-zoom-in"
          >
            <img src={optimizeImage(photo.url, 1200)} alt="" className="w-full h-full object-cover" loading="eager" />
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
                  <div className="flex items-center gap-1">
                    <h2 className={cn(
                      "font-bold text-lg group-hover:underline",
                      photo.owner?.active_gradient ? GRADIENT_CONFIG[photo.owner.active_gradient]?.className : "text-black",
                      photo.owner?.active_font ? FONT_CONFIG[photo.owner.active_font]?.className : ""
                    )}>
                      {photo.owner?.name || photo.owner?.username}
                    </h2>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {formatDistanceToNow(new Date(photo.created_at))} {t('post.ago')}
                  </p>
                </div>
              </Link>
              
              <div className="relative">
                <button 
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-3 text-slate-200 hover:text-black transition-colors"
                >
                  <MoreHorizontal size={24} />
                </button>

                <AnimatePresence>
                  {showOptions && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100]"
                    >
                      <button 
                        onClick={() => {
                          setShowOptions(false);
                          setShowReportConfirm(true);
                        }}
                        className="w-full px-6 py-4 text-left text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors flex items-center gap-3"
                      >
                        <AlertCircle size={18} />
                        Report Post
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-2xl font-bold text-black">{photo.name}</h3>
               <p className="text-slate-400 text-sm leading-relaxed">
                 {t('post.captured_at')} <span className="text-black font-medium">{new Date(photo.created_at).toLocaleDateString()}</span>. 
                 {t('post.found')} <span className="text-black font-medium">@{photo.owner?.username}</span>{t('post.journey')}.
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
                <span className="text-xs font-bold uppercase tracking-widest">{likesCount} {t('post.likes')}</span>
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
                <span className="text-xs font-bold uppercase tracking-widest">{isSaved ? t('post.saved') : t('post.save')}</span>
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
                <span className="text-xs font-bold uppercase tracking-widest">{t('post.share')}</span>
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
                    <img src={optimizeImage(p.url, 400)} alt="" className="w-full h-full object-cover" loading="lazy" />
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
      <AnimatePresence>
        {viewer && (
          <PhotoViewer 
            photo={viewer} 
            onClose={() => setViewer(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReportConfirm && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center space-y-6 shadow-2xl"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-500">
                <AlertCircle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-black">Report Post</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Are you sure you want to report this post for violating our community guidelines?
                </p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowReportConfirm(false)}
                  className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowReportConfirm(false);
                    setShowReportForm(true);
                  }}
                  className="flex-1 h-12 bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                >
                  Report
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showReportForm && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-lg font-bold text-black">Reporting Post</h3>
                <button 
                  onClick={() => setShowReportForm(false)}
                  className="p-2 text-slate-300 hover:text-black transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <iframe 
                src="https://docs.google.com/forms/d/e/1FAIpQLSekwMrb4LPb6GpgBsyBqjkx6ANAewibwZYDT7RmIBt7fP3pvw/viewform?usp=dialog" 
                className="flex-1 w-full border-none"
                title="Report Form"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
