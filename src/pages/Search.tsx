import { useState, useEffect } from 'react';
import { Search as SearchIcon, User, Grid, Folder, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Collection, Album, Photo, Profile } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import PhotoViewer from '../components/PhotoViewer';

type SearchCategory = 'photos' | 'users';

const HONOR_BOARD = [
  { username: 'mavebo', label: 'Founder & CEO', role: 'official' },
  { username: 'pipinos', label: 'Main Developer', role: 'official' },
  { username: '1winter_', label: 'Creative Director', role: 'official' },
  { username: 'startorigin', label: 'StartOrigin Official', role: 'official' },
  { username: 'camilakiriek', label: 'Friend of StartOrigin', role: 'friend' },
  { username: 'viscaelbarca', label: 'Friend of StartOrigin', role: 'friend' },
  { username: 'winterwastaken', label: 'Friend of StartOrigin', role: 'friend' },
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('photos');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [honorUsers, setHonorUsers] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHonorBoard();
  }, []);

  async function fetchHonorBoard() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('username', HONOR_BOARD.map(u => u.username));
    
    if (data) {
      const sorted = HONOR_BOARD.map(h => ({
        ...data.find(d => d.username === h.username),
        ...h
      })).filter(u => u.id); // Only include if user exists in DB
      setHonorUsers(sorted);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) handleSearch();
      else setResults([]);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, category]);

  async function handleSearch() {
    setLoading(true);
    let promise;
    
    switch (category) {
      case 'photos':
        promise = supabase.from('photos').select('*, owner:profiles(*)').eq('privacy', 'public').ilike('name', `%${query}%`);
        break;
      case 'users':
        promise = supabase.from('profiles').select('*').ilike('username', `%${query}%`);
        break;
    }

    const { data } = await promise;
    if (data) setResults(data);
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 min-h-screen">
      <div className="space-y-6">
        <div className="relative group">
          <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-black transition-colors" size={24} />
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search StartOrigin discovery..."
            className="w-full h-18 bg-slate-50 border border-slate-100 rounded-[2rem] pl-16 pr-6 text-lg font-bold focus:outline-none focus:bg-white focus:border-black/10 transition-all shadow-sm placeholder:text-slate-300"
          />
          {loading && <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 animate-spin text-slate-400" size={24} />}
        </div>

        <div className="flex gap-2 p-1.5 glass-card rounded-[1.25rem] w-fit mx-auto border border-black/5 shadow-sm">
          <CategoryTab active={category === 'photos'} onClick={() => setCategory('photos')} label="Photos" icon={ImageIcon} />
          <CategoryTab active={category === 'users'} onClick={() => setCategory('users')} label="Users" icon={User} />
        </div>
      </div>

      <div className="space-y-12 text-black">
        {!query && !loading && category === 'users' && honorUsers.length > 0 && (
          <div className="space-y-8">
            <div className="flex flex-col items-center text-center space-y-2">
               <h2 className="text-2xl font-bold tracking-tight">Honor Board</h2>
               <p className="text-slate-400 font-medium text-sm italic">The pioneers and friends of StartOrigin</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
               {honorUsers.map((user, i) => (
                 <motion.div
                   key={user.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.1 }}
                   onClick={() => navigate(`/profile/${user.username}`)}
                   className="glass-card p-6 flex flex-col items-center text-center space-y-4 cursor-pointer border border-black/5 hover:scale-[1.05] transition-all bg-white shadow-sm"
                 >
                   <div className="relative group">
                     <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-slate-50 group-hover:border-black transition-colors bg-white shadow-inner">
                       {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-50 flex items-center justify-center font-bold text-slate-200">{user.username[0]}</div>}
                     </div>
                     {user.role === 'official' && (
                       <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1 shadow-lg">
                          <SearchIcon size={12} className="rotate-45" />
                       </div>
                     )}
                   </div>
                   <div className="space-y-1">
                     <div className="font-bold text-[15px]">{user.name || user.username}</div>
                     <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">@{user.username}</div>
                     <div className="mt-2 px-3 py-1 bg-black/5 rounded-full text-[9px] font-bold uppercase tracking-tighter text-slate-500 whitespace-nowrap">
                       {user.label}
                     </div>
                   </div>
                 </motion.div>
               ))}
            </div>
          </div>
        )}

        {!query && !loading && (category === 'photos' || (category === 'users' && honorUsers.length === 0)) && (
           <div className="h-64 flex flex-col items-center justify-center space-y-4 text-slate-200">
              <SearchIcon size={64} strokeWidth={1.5} />
              <p className="font-bold tracking-[0.3em] uppercase text-[10px]">Awaiting discovery</p>
           </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {results.map((item, i) => (
              <SearchResultCard 
                key={item.id} 
                item={item} 
                category={category} 
                index={i} 
                onClick={() => {
                  if (category === 'photos') setSelectedPhoto(item);
                  else navigate(`/profile/${item.username}`);
                }}
              />
            ))}
          </AnimatePresence>
        </div>

        {query && results.length === 0 && !loading && (
           <p className="text-center text-slate-400 font-medium font-italic italic">No matches found for "{query}"</p>
        )}
      </div>

      {selectedPhoto && (
        <PhotoViewer 
          photo={selectedPhoto} 
          onClose={() => setSelectedPhoto(null)} 
        />
      )}
    </div>
  );
}

function CategoryTab({ active, onClick, label, icon: Icon }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold transition-all relative",
        active ? "text-white" : "text-slate-400 hover:text-black"
      )}
    >
      <Icon size={16} />
      <span className="z-10">{label}</span>
      {active && <motion.div layoutId="search-tab-active" className="absolute inset-0 bg-black rounded-xl" />}
    </button>
  );
}

function SearchResultCard({ item, category, index, onClick }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="glass-card overflow-hidden group cursor-pointer border border-black/5 hover:scale-[1.05] transition-all duration-300"
    >
      {category === 'photos' && (
        <div className="aspect-square relative">
          <img src={item.url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
             <div className="text-[10px] uppercase font-bold tracking-widest text-white">{item.owner?.username}</div>
          </div>
        </div>
      )}

      {category === 'users' && (
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-white border border-black/5 flex items-center justify-center overflow-hidden shadow-inner">
            {item.avatar_url ? <img src={item.avatar_url} className="w-full h-full object-cover" /> : <User size={32} className="text-slate-300" />}
          </div>
          <div>
            <div className="font-bold text-[15px] text-black truncate w-full">{item.username}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{item.name}</div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
