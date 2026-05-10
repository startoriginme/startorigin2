import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Collection, Album, Photo } from '../types';
import { Folder, ChevronRight, MoreHorizontal, Trash2, Edit3, Settings, Grid as GridIcon, Plus, LayoutGrid, Image as ImageIcon, X, Save, Eye, EyeOff, Move } from 'lucide-react';
import { cn } from '../lib/utils';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '../components/SortableItem';

export default function Gallery({ user }: { user: any }) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit modals state
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [unsortedPhotos, setUnsortedPhotos] = useState<Photo[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'collection' | 'album' | 'photo';
    id: string;
    name?: string;
  } | null>(null);

  useEffect(() => {
    fetchCollections();
    fetchUnsorted();
  }, []);

  async function fetchUnsorted() {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .eq('user_id', user.id)
      .is('collection_id', null)
      .order('created_at', { ascending: false });
    
    if (data) setUnsortedPhotos(data);
  }

  async function fetchCollections() {
    setLoading(true);
    // Fetch owned collections
    const { data: ownedData } = await supabase
      .from('collections')
      .select('*, albums(*, photos(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    // Fetch shared collections (where user is a collaborator)
    const { data: sharedData } = await supabase
      .from('collaborators')
      .select('collection:collections(*, albums(*, photos(*)))')
      .eq('user_id', user.id);

    let allCollections = ownedData || [];
    
    if (sharedData) {
      const shared: any[] = (sharedData as any[]).map(s => s.collection).filter(Boolean);
      // Avoid duplicates
      const ownedIds = new Set(allCollections.map((c: any) => c.id));
      shared.forEach((c: any) => {
        if (!ownedIds.has(c.id)) allCollections.push(c);
      });
    }

    setCollections(allCollections);
    setLoading(false);
  }

  async function deleteCollection(id: string) {
    const { error } = await supabase.from('collections').delete().eq('id', id);
    if (!error) {
      setCollections(collections.filter(c => c.id !== id));
      if (selectedCollection?.id === id) setSelectedCollection(null);
      setDeleteConfirm(null);
    } else {
      console.error('Delete error:', error);
    }
  }

  async function deleteAlbum(albumId: string) {
    const { error } = await supabase.from('albums').delete().eq('id', albumId);
    if (!error) {
      if (selectedCollection) {
        const updatedAlbums = selectedCollection.albums?.filter(a => a.id !== albumId) || [];
        const updatedCollection = { ...selectedCollection, albums: updatedAlbums };
        setSelectedCollection(updatedCollection);
        setCollections(collections.map(c => c.id === selectedCollection.id ? updatedCollection : c));
      }
      if (selectedAlbum?.id === albumId) setSelectedAlbum(null);
      setDeleteConfirm(null);
    } else {
      console.error('Delete error:', error);
    }
  }

  async function handleUpdateCollection() {
    if (!editingCollection) return;
    const { error } = await supabase
      .from('collections')
      .update({ name: editingCollection.name, privacy: editingCollection.privacy })
      .eq('id', editingCollection.id);
    
    if (!error) {
      setCollections(collections.map(c => c.id === editingCollection.id ? { ...c, ...editingCollection } : c));
      if (selectedCollection?.id === editingCollection.id) {
        setSelectedCollection({ ...selectedCollection, ...editingCollection });
      }
      setEditingCollection(null);
    }
  }

  async function handleUpdateAlbum() {
    if (!editingAlbum) return;
    const { error } = await supabase
      .from('albums')
      .update({ name: editingAlbum.name, privacy: editingAlbum.privacy })
      .eq('id', editingAlbum.id);
    
    if (!error) {
      if (selectedCollection) {
        const updatedAlbums = selectedCollection.albums?.map(a => a.id === editingAlbum.id ? { ...a, ...editingAlbum } : a) || [];
        const updatedCollection = { ...selectedCollection, albums: updatedAlbums };
        setSelectedCollection(updatedCollection);
        setCollections(collections.map(c => c.id === selectedCollection.id ? updatedCollection : c));
      }
      if (selectedAlbum?.id === editingAlbum.id) {
        setSelectedAlbum({ ...selectedAlbum, ...editingAlbum });
      }
      setEditingAlbum(null);
    }
  }

  async function handleCreateAlbum() {
    if (!newAlbumName || !selectedCollection) return;
    
    const { data, error } = await supabase
      .from('albums')
      .insert({
        name: newAlbumName,
        collection_id: selectedCollection.id,
        user_id: user.id,
        privacy: 'private'
      })
      .select()
      .single();

    if (!error && data) {
      const updatedAlbums = [...(selectedCollection.albums || []), { ...data, photos: [] }];
      const updatedCollection = { ...selectedCollection, albums: updatedAlbums };
      setSelectedCollection(updatedCollection);
      setCollections(collections.map(c => c.id === selectedCollection.id ? updatedCollection : c));
      setNewAlbumName('');
      setIsCreatingAlbum(false);
    } else {
      console.error('Create album error:', error);
    }
  }

  return (
    <div className="max-w-screen-xl mx-auto p-4 md:p-8 space-y-8 min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {selectedCollection && (
            <button 
              onClick={() => { 
                if (selectedAlbum) setSelectedAlbum(null);
                else setSelectedCollection(null);
              }}
              className="p-2 glass-card rounded-xl hover:bg-black/5 transition-all text-slate-400"
            >
              <ChevronRight size={20} className="rotate-180" />
            </button>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-black">
                {selectedCollection ? (selectedAlbum ? selectedAlbum.name : selectedCollection.name) : 'Your Gallery'}
              </h1>
              {selectedCollection && !selectedAlbum && (
                <button onClick={() => setEditingCollection(selectedCollection)} className="p-2 text-slate-400 hover:text-black transition-all">
                  <Settings size={18} />
                </button>
              )}
              {selectedAlbum && (
                <button onClick={() => setEditingAlbum(selectedAlbum)} className="p-2 text-slate-400 hover:text-black transition-all">
                  <Settings size={18} />
                </button>
              )}
            </div>
            <p className="text-slate-500 font-medium">
              {selectedCollection 
                ? (selectedAlbum ? `Organizing ${selectedAlbum.photos?.length || 0} photos` : `Managing ${selectedCollection.albums?.length || 0} albums`)
                : `You have ${collections.length} collections`}
            </p>
          </div>
        </div>
        
        {!selectedCollection && (
          <a 
            href="/add" 
            className="btn-primary h-12 px-6 flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Create Collection</span>
          </a>
        )}
      </header>

      <AnimatePresence mode="wait">
        {!selectedCollection ? (
          <motion.div 
            key="collections-grid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {unsortedPhotos.length > 0 && (
              <div 
                className="glass-card group relative p-6 cursor-pointer flex flex-col justify-between min-h-[160px] border border-black/5 hover:border-black/10 transition-all bg-slate-50/50"
                onClick={() => setSelectedCollection({
                  id: 'unsorted',
                  name: 'Unsorted',
                  privacy: 'private',
                  albums: [{
                    id: 'unsorted-album',
                    name: 'Recents',
                    photos: unsortedPhotos,
                    collection_id: 'unsorted',
                    user_id: user.id
                  }]
                } as any)}
              >
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <LayoutGrid className="text-slate-400 group-hover:text-black transition-colors" size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black">Unsorted</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-400">
                      Private
                    </span>
                    <span className="text-xs text-slate-300 font-bold tracking-tight">• {unsortedPhotos.length} photos</span>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="aspect-video glass-card animate-pulse rounded-3xl border border-black/5 bg-slate-50" />
              ))
            ) : (
              collections.map((collection) => (
                <div 
                  key={collection.id} 
                  className="glass-card group relative p-6 cursor-pointer flex flex-col justify-between min-h-[160px] border border-black/5 hover:border-black/10 transition-all bg-white"
                  onClick={() => setSelectedCollection(collection)}
                >
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <Folder className="text-slate-400 group-hover:text-black transition-colors" size={24} />
                    </div>
                    <div className="flex gap-1 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingCollection(collection); }}
                        className="p-2 text-slate-200 hover:text-black rounded-lg transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setDeleteConfirm({ type: 'collection', id: collection.id, name: collection.name }); 
                        }}
                        className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black">{collection.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold",
                        collection.privacy === 'public' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                      )}>
                        {collection.privacy}
                      </span>
                      <span className="text-xs text-slate-300 font-bold tracking-tight">• {collection.albums?.length || 0} albums</span>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {collections.length === 0 && !loading && (
              <div className="md:col-span-3 flex flex-col items-center justify-center p-20 glass-card border-dashed border-slate-200">
                <LayoutGrid size={48} className="text-slate-100 mb-4" />
                <p className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">No collections found. Creativity awaits.</p>
              </div>
            )}
          </motion.div>
        ) : !selectedAlbum ? (
          <motion.div 
            key="albums-grid"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6"
          >
            {selectedCollection.albums?.map((album) => (
              <div 
                key={album.id}
                onClick={() => setSelectedAlbum(album)}
                className="glass-card group aspect-square flex flex-col items-center justify-center cursor-pointer space-y-3 p-4 hover:scale-[1.02] transition-transform border border-black/5 bg-white relative"
              >
                <div className="absolute top-2 right-2 flex gap-1 transition-opacity">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setDeleteConfirm({ type: 'album', id: album.id, name: album.name });
                    }}
                    className="p-1.5 text-slate-200 hover:text-red-500 rounded-lg transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                  <GridIcon className="text-slate-300 group-hover:text-black transition-colors" size={32} />
                </div>
                <div className="text-center">
                  <div className="font-bold text-sm truncate max-w-[120px] text-black">{album.name}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{album.photos?.length || 0} photos</div>
                </div>
              </div>
            ))}
            
            <button 
              onClick={() => setIsCreatingAlbum(true)}
              className="glass-card aspect-square border-dashed border-slate-200 bg-transparent flex flex-col items-center justify-center space-y-2 opacity-40 hover:opacity-100 transition-opacity"
            >
              <Plus size={24} className="text-slate-400" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Add Album</span>
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="photos-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <PhotoSortableGrid photos={selectedAlbum.photos || []} collectionId={selectedCollection.id} albums={selectedCollection.albums || []} collections={collections} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Collection Modal */}
      {editingCollection && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full space-y-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-black">Edit Collection</h3>
              <button onClick={() => setEditingCollection(null)} className="text-slate-300 hover:text-black transition-all">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Name</label>
                <input 
                  type="text" 
                  value={editingCollection.name}
                  onChange={(e) => setEditingCollection({ ...editingCollection, name: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-black/10 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Privacy</label>
                <select 
                  value={editingCollection.privacy}
                  onChange={(e) => setEditingCollection({ ...editingCollection, privacy: e.target.value as any })}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-black/10 font-bold"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <button 
                onClick={handleUpdateCollection}
                className="w-full h-14 btn-primary rounded-2xl flex items-center justify-center gap-2"
              >
                <Save size={18} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Album Modal */}
      {editingAlbum && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full space-y-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-black">Edit Album</h3>
              <button onClick={() => setEditingAlbum(null)} className="text-slate-300 hover:text-black transition-all">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Name</label>
                <input 
                  type="text" 
                  value={editingAlbum.name}
                  onChange={(e) => setEditingAlbum({ ...editingAlbum, name: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-black/10 font-bold"
                />
              </div>
              <button 
                onClick={handleUpdateAlbum}
                className="w-full h-14 btn-primary rounded-2xl flex items-center justify-center gap-2"
              >
                <Save size={18} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Album Modal */}
      {isCreatingAlbum && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full space-y-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-black">New Album</h3>
              <button onClick={() => { setIsCreatingAlbum(false); setNewAlbumName(''); }} className="text-slate-300 hover:text-black transition-all">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Album Name</label>
                <input 
                  type="text" 
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  placeholder="e.g. Summer Memories"
                  autoFocus
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-black/10 font-bold"
                />
              </div>
              <button 
                onClick={handleCreateAlbum}
                disabled={!newAlbumName}
                className="w-full h-14 btn-primary rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Plus size={18} />
                <span>Create Album</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full space-y-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto">
                <Trash2 size={40} className="text-rose-500" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-black tracking-tight">Delete {deleteConfirm.type}?</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Are you sure you want to delete <span className="font-bold text-black">"{deleteConfirm.name || 'this item'}"</span>? 
                  This action is permanent and cannot be reversed.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    if (deleteConfirm.type === 'collection') deleteCollection(deleteConfirm.id);
                    if (deleteConfirm.type === 'album') deleteAlbum(deleteConfirm.id);
                  }}
                  className="w-full h-14 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                >
                  Yes, delete it
                </button>
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="w-full h-14 bg-slate-100 text-slate-900 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  No, keep it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PhotoSortableGrid({ photos: initialPhotos, collectionId, albums, collections }: { photos: Photo[], collectionId: string, albums: Album[], collections: Collection[] }) {
  const [items, setItems] = useState(initialPhotos);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState(collectionId);
  const [availableAlbums, setAvailableAlbums] = useState<Album[]>(albums);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name?: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (editingPhoto) {
      setSelectedCollectionId(editingPhoto.collection_id || 'unsorted');
    }
  }, [editingPhoto]);

  useEffect(() => {
    if (editingPhoto) {
      if (selectedCollectionId === 'unsorted') {
        setAvailableAlbums([]);
      } else {
        const col = collections.find(c => c.id === selectedCollectionId) as any;
        setAvailableAlbums(col?.albums || []);
      }
    }
  }, [selectedCollectionId, editingPhoto, collections]);

  async function handleUpdatePhoto() {
    if (!editingPhoto) return;
    const { error } = await supabase
      .from('photos')
      .update({ 
        name: editingPhoto.name, 
        privacy: editingPhoto.privacy,
        album_id: editingPhoto.album_id === 'unsorted' ? null : (editingPhoto.album_id || null),
        collection_id: selectedCollectionId === 'unsorted' ? null : (selectedCollectionId || null)
      })
      .eq('id', editingPhoto.id);
    
    if (!error) {
      // If moved to another album or collection, remove from current view
      const targetCollectionId = selectedCollectionId === 'unsorted' ? null : selectedCollectionId;
      const targetAlbumId = editingPhoto.album_id === 'unsorted' ? null : editingPhoto.album_id;
      
      const currentCollectionId = collectionId === 'unsorted' ? null : collectionId;
      const currentAlbumId = initialPhotos[0]?.album_id;

      if (targetCollectionId !== currentCollectionId || targetAlbumId !== currentAlbumId) {
        setItems(items.filter(i => i.id !== editingPhoto.id));
      } else {
        setItems(items.map(i => i.id === editingPhoto.id ? editingPhoto : i));
      }
      setEditingPhoto(null);
    }
  }

  async function deletePhoto(photoId: string) {
    const { error } = await supabase.from('photos').delete().eq('id', photoId);
    if (!error) {
      setItems(items.filter(i => i.id !== photoId));
      setDeleteConfirm(null);
    } else {
      console.error('Delete error:', error);
    }
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        const updated = arrayMove(items, oldIndex, newIndex) as Photo[];
        
        // Update sort order in background
        updated.forEach((item, index) => {
          supabase.from('photos').update({ sort_order: index }).eq('id', item.id);
        });
        
        return updated;
      });
    }
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map((photo) => (
              <SortableItem key={photo.id} id={photo.id}>
                <div className="aspect-square glass-card overflow-hidden group relative border border-black/5 bg-white p-1">
                  <div className="w-full h-full rounded-[1.25rem] overflow-hidden">
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-black/5 opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex gap-2 relative z-10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingPhoto(photo); }}
                        className="p-2 bg-white/90 hover:bg-white rounded-lg text-black transition-all shadow-lg pointer-events-auto"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setDeleteConfirm({ id: photo.id, name: photo.name });
                        }}
                        className="p-2 bg-rose-500/90 hover:bg-rose-500 rounded-lg text-white transition-all shadow-lg pointer-events-auto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </SortableItem>
            ))}
            <a href="/add" className="aspect-square glass-card border-dashed border-slate-200 bg-transparent flex flex-col items-center justify-center space-y-2 opacity-40 hover:opacity-100 transition-opacity text-slate-400">
              <Plus size={24} />
              <span className="text-[10px] uppercase font-bold tracking-widest">Add Photo</span>
            </a>
          </div>
        </SortableContext>
      </DndContext>

      {/* Delete Photo Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full space-y-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto">
                <Trash2 size={40} className="text-rose-500" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-black tracking-tight">Delete photo?</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Are you sure you want to delete <span className="font-bold text-black">"{deleteConfirm.name || 'this photo'}"</span>? 
                  It will be gone forever.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => deletePhoto(deleteConfirm.id)}
                  className="w-full h-14 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                >
                  Yes, delete it
                </button>
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="w-full h-14 bg-slate-100 text-slate-900 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  No, keep it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {editingPhoto && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full space-y-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-black">Manage Photo</h3>
              <button onClick={() => setEditingPhoto(null)} className="text-slate-300 hover:text-black transition-all">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Name</label>
                <input 
                  type="text" 
                  value={editingPhoto.name}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, name: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-black/10 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Privacy</label>
                <select 
                  value={editingPhoto.privacy}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, privacy: e.target.value as any })}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-black/10 font-bold"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Move to Collection</label>
                <select 
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-black/10 font-bold"
                >
                  <option value="unsorted">Unsorted (No Collection)</option>
                  {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Move to Album</label>
                <select 
                  value={editingPhoto.album_id || ''}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, album_id: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-black/10 font-bold"
                >
                  <option value="">Main / General</option>
                  {availableAlbums.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <button 
                onClick={handleUpdatePhoto}
                className="w-full h-14 btn-primary rounded-2xl flex items-center justify-center gap-2"
              >
                <Move size={18} />
                <span>Move & Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
