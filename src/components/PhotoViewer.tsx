import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share2, ZoomIn } from 'lucide-react';
import { Photo } from '../types';

interface PhotoViewerProps {
  photo: Photo;
  onClose: () => void;
}

export default function PhotoViewer({ photo, onClose }: PhotoViewerProps) {
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
        <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
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
           <h2 className="text-xl font-bold text-white tracking-tight">{photo.name || 'Untitled Moment'}</h2>
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
