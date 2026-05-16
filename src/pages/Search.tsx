import { useState, useEffect } from 'react';
import { 
  Search as SearchIcon, User, Grid, Folder, Image as ImageIcon, Loader2, Hash, Shield, Flame
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Collection, Album, Photo, Profile } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PhotoViewer from '../components/PhotoViewer';
import { GRADIENT_CONFIG, FONT_CONFIG, BADGE_CONFIG } from '../constants/shop';

type SearchCategory = 'photos' | 'users' | 'hashtags';

const CLAN_EMOJIS = [
  '🐉', '🐲', '🦁', '🦅', '🐺', '🐻', '🗡️', '🛡️', '⚔️', '🏰', '🔮', '🧙', '👑', '💎', '🌋',
  '🤖', '👾', '💻', '⌨️', '🖥️', '📡', '🛸', '🔫', '🎮', '🧬', '⚡', '🔋', '🌐', '💊', '🎛️',
  '🎨', '🖌️', '✏️', '🎭', '🎬', '🎧', '🎵', '🎸', '🥁', '📸', '🎞️', '🖼️', '✂️', '🧵', '🪡',
  '🏆', '🥇', '⚽', '🏀', '🎾', '🏈', '💪', '🥊', '🚴', '🏋️', '🧗', '🏊', '⛷️', '🏅',
  '🌿', '🍃', '🌸', '🌻', '🍄', '🪶', '🐾', '🕊️', '🐝', '🦋', '🌙', '✨', '⭐', '☕', '🍜'
];

const HONOR_BOARD = [
  { username: 'mavebo', label: 'Founder & CEO', role: 'official' },
  { username: 'pipinos', label: 'Main Developer', role: 'official' },
  { username: 'winter', label: 'Creative Director', role: 'official' },
  { username: 'startorigin', label: 'StartOrigin Official', role: 'official' },
  { username: 'camilakiriek', label: 'Friend of StartOrigin', role: 'friend' },
  { username: 'viscaelbarca', label: 'Friend of StartOrigin', role: 'friend' },
  { username: 'winterwastaken', label: 'Friend of StartOrigin', role: 'friend' },
];

export default function Search() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('photos');
  const [results, setResults] = useState<any[]>([]);
  const [topClans, setTopClans] = useState<any[]>([]);
  const [topHashtags, setTopHashtags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [honorUsers, setHonorUsers] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHonorBoard();
    fetchTopMetadata();
  }, []);

  async function fetchTopMetadata() {
    // Top Clans (based on member count)
    const { data: profiles } = await supabase.from('profiles').select('clan');
    if (profiles) {
      const counts: Record<string, number> = {};
      profiles.forEach(p => { if (p.clan) counts[p.clan] = (counts[p.clan] || 0) + 1; });
      const sortedClans = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([emoji, count]) => ({ emoji, count }));
      setTopClans(sortedClans);
    }

    // Top Hashtags (mocking top since we don't have aggregation easily without RPC/Functions)
    // We can fetch recent posts/photos with tags
    const { data: posts } = await supabase.from('posts').select('tags').not('tags', 'is', null).limit(100);
    const { data: photos } = await supabase.from('photos').select('tags').not('tags', 'is', null).limit(100);
    
    const tagCounts: Record<string, number> = {};
    [...(posts || []), ...(photos || [])].forEach(p => {
      p.tags?.forEach((t: string) => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
    });
    
    const sortedTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
    setTopHashtags(sortedTags);
  }

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
    
    if (category === 'photos') {
      const { data } = await supabase
        .from('photos')
        .select('*, owner:profiles(*)')
        .eq('privacy', 'public')
        .ilike('name', `%${query}%`);
      if (data) setResults(data);
    } else if (category === 'users') {
      // Users search
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,name.ilike.%${query}%`);
      
      setResults(data || []);
    } else {
      // Hashtags
      const tag = query.startsWith('#') ? query.slice(1) : query;
      const { data: photos } = await supabase.from('photos').select('*, owner:profiles(*)').contains('tags', [tag.toLowerCase()]);
      const { data: posts } = await supabase.from('posts').select('*, owner:profiles(*)').contains('tags', [tag.toLowerCase()]);
      
      const combined = [
        ...(photos || []).map(p => ({ ...p, type: 'photo' })),
        ...(posts || []).map(p => ({ ...p, type: 'post' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setResults(combined);
    }
    
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
            placeholder={t('search.placeholder')}
            className="w-full h-18 bg-slate-50 border border-slate-100 rounded-[2rem] pl-16 pr-6 text-lg font-bold focus:outline-none focus:bg-white focus:border-black/10 transition-all shadow-sm placeholder:text-slate-300"
          />
          {loading && <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 animate-spin text-slate-400" size={24} />}
        </div>

        <div className="flex gap-2 p-1.5 glass-card rounded-[1.25rem] w-fit mx-auto border border-black/5 shadow-sm overflow-x-auto max-w-full no-scrollbar">
          <CategoryTab active={category === 'photos'} onClick={() => setCategory('photos')} label={t('navigation.gallery')} icon={ImageIcon} />
          <CategoryTab active={category === 'users'} onClick={() => setCategory('users')} label={t('search.users_tab')} icon={User} />
          <CategoryTab active={category === 'hashtags'} onClick={() => setCategory('hashtags')} label="Hashtags" icon={Hash} />
        </div>
      </div>

      {!query && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {category === 'hashtags' && topHashtags.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
                  <Flame size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-tight">Trending Tags</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global popular hashtags</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {topHashtags.map(({ tag, count }) => (
                  <button 
                    key={tag}
                    onClick={() => { setQuery(`#${tag}`); setCategory('hashtags'); }}
                    className="px-6 py-3 bg-white border border-slate-100 rounded-2xl hover:border-black transition-all group flex items-center gap-2"
                  >
                    <span className="text-slate-300 group-hover:text-black font-bold">#</span>
                    <span className="font-bold text-sm text-black">{tag}</span>
                    <span className="ml-1 text-[10px] font-bold text-slate-300 bg-slate-50 px-1.5 py-0.5 rounded-lg">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {category === 'users' && topClans.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500 text-white flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-tight">Top Clans</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mightiest legacies</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {topClans.map(({ emoji, count }) => (
                  <div key={emoji} className="glass-card p-4 flex flex-col items-center gap-2 border border-black/5 bg-white bg-gradient-to-br from-white to-slate-50/50">
                    <span className="text-3xl hover:scale-125 transition-transform cursor-default">{emoji}</span>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{count} members</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-12 text-black">
        {!query && !loading && category === 'users' && honorUsers.length > 0 && (
          <div className="space-y-8">
            <div className="flex flex-col items-center text-center space-y-2">
               <h2 className="text-2xl font-bold tracking-tight">{t('search.honor_board')}</h2>
               <p className="text-slate-400 font-medium text-sm italic">{t('search.honor_board_sub')}</p>
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
                          <SearchIcon size={11} className="rotate-45" />
                       </div>
                     )}
                   </div>
                   <div className="space-y-1 text-center flex flex-col items-center">
                     <div className="flex items-center gap-1 justify-center">
                       <div className={cn(
                         "font-bold text-[15px]",
                         user.active_gradient ? GRADIENT_CONFIG[user.active_gradient]?.className : "text-black",
                         user.active_font ? FONT_CONFIG[user.active_font]?.className : ""
                       )}>
                         {user.name || user.username}
                       </div>
                     </div>
                     <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">@{user.username}</div>
                     <div className="mt-1 px-3 py-1 bg-black/5 rounded-full text-[9px] font-bold uppercase tracking-tighter text-slate-500 whitespace-nowrap">
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
              <p className="font-bold tracking-[0.3em] uppercase text-[10px]">{t('search.awaiting')}</p>
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
           <p className="text-center text-slate-400 font-medium font-italic italic">{t('search.no_matches')} "{query}"</p>
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
      className="glass-card overflow-hidden group cursor-pointer border border-black/5 hover:scale-[1.05] transition-all duration-300 relative"
    >
      {(category === 'photos' || (category === 'hashtags' && item.type === 'photo')) && (
        <div className="aspect-square relative">
          <img src={item.url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
             <div className="text-[10px] uppercase font-bold tracking-widest text-white">{item.owner?.username}</div>
          </div>
          {category === 'hashtags' && (
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-[8px] font-bold text-white uppercase tracking-widest">Photo</div>
          )}
        </div>
      )}

      {category === 'hashtags' && item.type === 'post' && (
        <div className="p-6 flex flex-col h-full justify-between space-y-4">
          <div className="absolute top-2 right-2 bg-slate-100 px-2 py-0.5 rounded-lg text-[8px] font-bold text-slate-400 uppercase tracking-widest">Post</div>
          <p className="text-xs font-medium text-slate-600 line-clamp-4 leading-relaxed">
            {item.content}
          </p>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-100">
               {item.owner?.avatar_url && <img src={item.owner.avatar_url} className="w-full h-full object-cover" />}
            </div>
            <span className="text-[10px] font-bold text-slate-400">@{item.owner?.username}</span>
          </div>
        </div>
      )}

      {category === 'users' && (
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-white border border-black/5 flex items-center justify-center overflow-hidden shadow-inner">
            {item.avatar_url ? <img src={item.avatar_url} className="w-full h-full object-cover" /> : <User size={32} className="text-slate-300" />}
          </div>
          <div className="flex flex-col items-center justify-center min-h-[4.5rem] group w-full px-2">
            <div className="flex items-center justify-center gap-1 mb-1 w-full">
              <div className={cn(
                "font-bold text-[15px] truncate max-w-[120px] leading-none pr-1 py-1 flex items-center",
                item.active_gradient ? GRADIENT_CONFIG[item.active_gradient]?.className : "text-black",
                item.active_font ? FONT_CONFIG[item.active_font]?.className : ""
              )}>
                {item.name || item.username}
              </div>
              {item.badges && item.badges.length > 0 && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {item.badges.slice(0, 2).map((bid: string) => {
                    const cfg = BADGE_CONFIG[bid];
                    return cfg ? <cfg.icon key={bid} className={cn("w-4 h-4", cfg.color)} /> : null;
                  })}
                </div>
              )}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">@{item.username}</div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
