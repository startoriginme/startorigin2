import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Collection, Album, Photo } from '../types';
import { Tag, Image as ImageIcon, Plus, X, Upload, Check, Loader2, Globe, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function Add({ user }: { user: any }) {
  const navigate = useNavigate();
  const [view, setView] = useState<'options' | 'collection' | 'photo'>('options');
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [selectedAlbum, setSelectedAlbum] = useState<string>('');
  const [albums, setAlbums] = useState<Album[]>([]);

  // Collection form
  const [colData, setColData] = useState({ name: '', privacy: 'private' as 'private' | 'public' });
  
  // Photo upload form
  const [files, setFiles] = useState<{
    file: File, 
    name: string, 
    privacy: 'private' | 'public',
    collection_id: string,
    album_id: string
  }[]>([]);

  useEffect(() => {
    fetchCollections();
  }, []);

  async function fetchCollections() {
    const { data } = await supabase.from('collections').select('*, albums(*)').eq('user_id', user.id);
    if (data) setCollections(data);
  }

  async function handleCreateCollection() {
    if (!colData.name) return;
    setLoading(true);
    const { data } = await supabase
      .from('collections')
      .insert({ user_id: user.id, name: colData.name, privacy: colData.privacy })
      .select()
      .single();
    
    if (data) {
      await supabase.from('albums').insert({ collection_id: data.id, name: 'Main', user_id: user.id });
      navigate('/gallery');
    }
    setLoading(false);
  }

  async function handleUploadPhotos() {
    if (files.length === 0) return;
    setLoading(true);
    
    try {
      for (const item of files) {
        const fileExt = item.file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, item.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath);

        await supabase.from('photos').insert({
          user_id: user.id,
          album_id: item.album_id || null,
          collection_id: item.collection_id || null,
          name: item.name,
          privacy: item.privacy,
          url: publicUrl
        });
      }
      navigate('/gallery');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 10).map((f: File) => ({
        file: f,
        name: f.name.split('.')[0],
        privacy: 'private' as const,
        collection_id: '',
        album_id: ''
      }));
      setFiles([...files, ...newFiles].slice(0, 10));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {view === 'options' && (
          <motion.div 
            key="options" 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full"
          >
            <OptionButton 
              onClick={() => setView('collection')}
              title="New Collection"
              desc="Structure by theme"
              icon={Tag}
            />
            <OptionButton 
              onClick={() => setView('photo')}
              title="Add Photos"
              desc="Upload to albums"
              icon={ImageIcon}
            />
          </motion.div>
        )}

        {view === 'collection' && (
          <motion.div 
            key="collection"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full glass-card p-10 space-y-10"
          >
            <div className="flex justify-between items-center px-2">
              <h2 className="text-3xl font-bold tracking-tight text-black">New Collection</h2>
              <button onClick={() => setView('options')} className="text-slate-300 hover:text-black"><X size={24}/></button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-2">Collection Name</label>
                <input 
                  type="text"
                  value={colData.name}
                  onChange={(e) => setColData({...colData, name: e.target.value})}
                  className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[1.25rem] px-6 focus:outline-none focus:bg-white focus:border-black/10 transition-all text-lg font-bold placeholder:text-slate-200"
                  placeholder="e.g. Summer Essence"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-2">Initial Privacy</label>
                <div className="flex gap-4">
                   <PrivacyToggle 
                     active={colData.privacy === 'private'} 
                     onClick={() => setColData({...colData, privacy: 'private' })}
                     icon={Lock}
                     label="Private"
                   />
                   <PrivacyToggle 
                     active={colData.privacy === 'public'} 
                     onClick={() => setColData({...colData, privacy: 'public' })}
                     icon={Globe}
                     label="Public"
                   />
                </div>
              </div>

              <button 
                onClick={handleCreateCollection}
                disabled={!colData.name || loading}
                className="w-full h-14 bg-black text-white font-bold rounded-[1.25rem] hover:bg-black/90 active:scale-95 transition-all disabled:opacity-50 mt-8"
              >
                {loading ? <Loader2 className="animate-spin mx-auto text-white" /> : 'Create sanctuary'}
              </button>
            </div>
          </motion.div>
        )}

        {view === 'photo' && (
          <motion.div 
            key="photo"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full glass-card p-10 space-y-10"
          >
            <div className="flex justify-between items-center px-2">
              <h2 className="text-3xl font-bold tracking-tight text-black">Add Photos</h2>
              <button onClick={() => setView('options')} className="text-slate-300 hover:text-black"><X size={24}/></button>
            </div>

            <div className="space-y-8">
              {files.length === 0 ? (
                <label className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-100 rounded-[2.5rem] cursor-pointer hover:bg-black/5 transition-all group scale-100 active:scale-[0.98]">
                   <Upload size={40} className="text-slate-200 group-hover:text-black transition-colors mb-4" />
                   <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Up to 10 photos</span>
                   <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              ) : (
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                   {files.map((fileItem, idx) => (
                     <div key={idx} className="glass-card p-6 flex flex-col gap-6 bg-white shadow-sm border border-slate-100">
                        <div className="flex gap-4 items-start">
                          <img src={URL.createObjectURL(fileItem.file)} alt="" className="w-20 h-20 object-cover rounded-2xl shadow-sm" />
                          <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-center">
                              <input 
                                type="text" 
                                value={fileItem.name} 
                                onChange={(e) => {
                                  const newFiles = [...files];
                                  newFiles[idx].name = e.target.value;
                                  setFiles(newFiles);
                                }}
                                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 focus:outline-none focus:bg-white transition-all text-sm font-bold placeholder:text-slate-300"
                                placeholder="Photo name"
                              />
                              <button 
                                onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                                className="ml-2 p-2 text-slate-300 hover:text-rose-500 transition-colors"
                              >
                                <X size={20} />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="relative">
                                <select 
                                  value={fileItem.collection_id}
                                  onChange={(e) => {
                                    const newFiles = [...files];
                                    newFiles[idx].collection_id = e.target.value;
                                    newFiles[idx].album_id = ''; // Reset album
                                    setFiles(newFiles);
                                  }}
                                  className="w-full h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-[11px] font-bold appearance-none cursor-pointer"
                                >
                                  <option value="">No Collection</option>
                                  {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <Tag size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                              </div>

                              <div className="relative">
                                <select 
                                  value={fileItem.album_id}
                                  onChange={(e) => {
                                    const newFiles = [...files];
                                    newFiles[idx].album_id = e.target.value;
                                    setFiles(newFiles);
                                  }}
                                  disabled={!fileItem.collection_id}
                                  className="w-full h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-[11px] font-bold appearance-none cursor-pointer disabled:opacity-30"
                                >
                                  <option value="">Main Album</option>
                                  {collections.find(c => c.id === fileItem.collection_id)?.albums?.map((a: any) => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                  ))}
                                </select>
                                <ImageIcon size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                              </div>
                            </div>

                            <div className="flex gap-2">
                               <button 
                                 onClick={() => {
                                    const newFiles = [...files];
                                    newFiles[idx].privacy = newFiles[idx].privacy === 'private' ? 'public' : 'private';
                                    setFiles(newFiles);
                                 }}
                                 className={cn("px-4 py-1.5 rounded-lg border flex items-center gap-2 transition-all text-[10px] font-bold uppercase tracking-wider", 
                                    fileItem.privacy === 'public' ? "bg-black text-white border-black" : "bg-white border-slate-100 text-slate-400")
                                 }
                               >
                                 {fileItem.privacy === 'public' ? <Globe size={12}/> : <Lock size={12}/>}
                                 {fileItem.privacy}
                               </button>
                            </div>
                          </div>
                        </div>
                     </div>
                   ))}
                   <label className="block w-full py-6 text-center glass-card border-dashed border-slate-100 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-black/5 transition-all">
                      <Plus size={16} className="inline mr-2" /> Add more...
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                   </label>
                </div>
              )}

              <button 
                onClick={handleUploadPhotos}
                disabled={files.length === 0 || loading}
                className="w-full h-14 bg-black text-white font-bold rounded-[1.25rem] hover:bg-black/90 active:scale-95 transition-all disabled:opacity-50 mt-4"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" /> : `Upload ${files.length} moments`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OptionButton({ onClick, title, desc, icon: Icon }: any) {
  return (
    <button 
      onClick={onClick}
      className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-6 hover:bg-black/5 transition-all hover:scale-[1.05] active:scale-95 group border border-black/5"
    >
      <div className="w-16 h-16 rounded-[2.5rem] bg-black/5 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
        <Icon size={32} strokeWidth={2} className="text-slate-400 group-hover:text-black transition-colors" />
      </div>
      <div>
        <h3 className="text-xl font-bold tracking-tight text-black">{title}</h3>
        <p className="text-slate-500 text-sm font-medium mt-1">{desc}</p>
      </div>
    </button>
  );
}

function PrivacyToggle({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 h-14 flex items-center justify-center gap-3 rounded-[1.25rem] border-2 transition-all",
        active ? "bg-black text-white border-black" : "glass-card text-slate-400 border-black/5"
      )}
    >
      <Icon size={18} />
      <span className="font-bold text-[13px] uppercase tracking-widest">{label}</span>
    </button>
  );
}
