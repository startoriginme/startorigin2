import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share2, ZoomIn, Bookmark, Check, Loader2 } from 'lucide-react';
import { Photo } from '../types';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface PhotoViewerProps {
  photo: Photo;
  onClose: () => void;
}

export default function PhotoViewer({ photo, onClose }: PhotoViewerProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) checkIsSaved(user.id);
    });
  }, [photo.id]);

  async function checkIsSaved(userId: string) {
    const { data } = await supabase
      .from('saved_photos')
      .select('id')
      .eq('user_id', userId)
      .eq('photo_id', photo.id)
      .single();
    setIsSaved(!!data);
  }

  async function toggleSave() {
    if (!user || saving) return;
    setSaving(true);
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
    setSaving(false);
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50 flex gap-2">
          <button 
            onClick={toggleSave}
            disabled={saving || !user}
            className={cn(
              "p-3 rounded-full transition-all backdrop-blur-md border border-white/10 flex items-center gap-2",
              isSaved ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : isSaved ? <Check size={20} /> : <Bookmark size={20} />}
            <span className="text-xs font-bold uppercase tracking-widest hidden md:block">{isSaved ? 'Saved' : 'Save Moment'}</span>
          </button>
          <button 
            onClick={onClose} 
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md border border-white/10"
          >
            <X size={24} />
          </button>
        </div>
        <div className="relative flex items-center justify-center w-full h-full max-h-[75vh]">
          <img 
            src={photo.url} 
            alt={photo.name || ''} 
            className="max-w-full max-h-full rounded-[2rem] object-contain shadow-[0_0_100px_rgba(255,255,255,0.05)] border border-white/5"
          />
        </div>

        <div className="text-center space-y-1 mb-10">
           <Link to={`/posts/${photo.id}`} className="block">
             <h2 className="text-xl font-bold text-white tracking-tight hover:underline underline-offset-4">{photo.name || 'Untitled Moment'}</h2>
           </Link>
           {photo.owner && (
             <p className="text-white/20 font-bold text-[10px] uppercase tracking-[0.2em]">
               @{photo.owner.username}
             </p>
           )}
        </div>
      </motion.div>
    </motion.div>
  );
}
