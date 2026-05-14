import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, Image as ImageIcon, MessageSquare, Trash2, 
  ShieldAlert, LogOut, ChevronRight, Search, Loader2,
  Lock, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';

const ADMIN_PASSWORD = 'RealMaveboAdminModeration67';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'photos' | 'posts'>('users');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [users, setUsers] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('mavebo_admin_auth');
    if (savedAuth === 'true') setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, activeTab]);

  async function fetchData() {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        setUsers(data || []);
      } else if (activeTab === 'photos') {
        const { data } = await supabase.from('photos').select('*, owner:profiles(*)').order('created_at', { ascending: false });
        setPhotos(data || []);
      } else if (activeTab === 'posts') {
        const { data } = await supabase.from('posts').select('*, owner:profiles(*)').order('created_at', { ascending: false });
        setPosts(data || []);
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
    }
    setLoading(false);
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('mavebo_admin_auth', 'true');
    } else {
      alert('Invalid admin credentials');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('mavebo_admin_auth');
  };

  async function deleteUser(userId: string) {
    if (!confirm('Warning: This will delete the user profile. Associated data might cause RLS errors if not handled. Proceed?')) return;
    
    try {
      const response = await fetch(`/api/admin/user/${userId}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': ADMIN_PASSWORD }
      });
      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        const err = await response.json();
        alert('Server Error: ' + err.error);
      }
    } catch (err) {
      alert('Network Error');
    }
  }

  async function deletePhoto(photoId: string) {
    if (!confirm('Delete this photo?')) return;
    
    try {
      const response = await fetch(`/api/admin/photo/${photoId}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': ADMIN_PASSWORD }
      });
      if (response.ok) {
        setPhotos(prev => prev.filter(p => p.id !== photoId));
      } else {
        const err = await response.json();
        alert('Server Error: ' + err.error);
        
        // Fallback for when Service Role Key is not set by user yet
        if (err.error?.includes('Key not configured')) {
            alert('Admin note: Please set SUPABASE_SERVICE_ROLE_KEY in the Secrets panel for this to work.');
        }
      }
    } catch (err) {
      alert('Network Error');
    }
  }

  async function deletePost(postId: string) {
    if (!confirm('Delete this wall post?')) return;
    
    try {
      const response = await fetch(`/api/admin/post/${postId}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': ADMIN_PASSWORD }
      });
      if (response.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      } else {
        const err = await response.json();
        alert('Server Error: ' + err.error);
      }
    } catch (err) {
      alert('Network Error');
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-10 space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white rotate-3">
              <ShieldAlert size={32} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase tracking-widest">Admin Control</h1>
            <p className="text-slate-400 text-sm">Authentication Required</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entry Key"
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white focus:outline-none focus:ring-2 focus:ring-white/10 transition-all font-mono"
              />
              <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            </div>
            <button className="w-full h-14 bg-white text-black font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all uppercase tracking-widest text-xs">
              Deauthorize Access
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-white">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="font-bold text-black uppercase tracking-widest text-xs">Staff Panel</h1>
              <p className="text-[10px] font-bold text-emerald-500 uppercase">System Online</p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-slate-400 hover:text-black hover:bg-slate-100 transition-all font-bold text-[10px] uppercase tracking-widest"
          >
            <LogOut size={14} />
            <span>Terminate</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex p-1 bg-white border border-slate-100 rounded-2xl shadow-sm w-full md:w-auto">
            <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} label="Users" />
            <TabButton active={activeTab === 'photos'} onClick={() => setActiveTab('photos')} icon={ImageIcon} label="Photos" />
            <TabButton active={activeTab === 'posts'} onClick={() => setActiveTab('posts')} icon={MessageSquare} label="Wall Posts" />
          </div>

          <div className="relative w-full md:w-72">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter identification..."
              className="w-full h-12 bg-white border border-slate-100 rounded-2xl pl-12 pr-4 text-sm focus:outline-none focus:border-black/10 transition-all shadow-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          </div>
        </div>

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center text-slate-300 space-y-4">
            <Loader2 className="animate-spin" size={32} />
            <span className="font-bold uppercase tracking-widest text-[10px]">Syncing Data</span>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {activeTab === 'users' && <UserTable users={filteredUsers} onDelete={deleteUser} />}
              {activeTab === 'photos' && <PhotoTable photos={photos} onDelete={deletePhoto} />}
              {activeTab === 'posts' && <PostTable posts={posts} onDelete={deletePost} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 h-11 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all",
        active ? "bg-black text-white shadow-lg" : "text-slate-400 hover:text-black"
      )}
    >
      <Icon size={14} />
      <span>{label}</span>
    </button>
  );
}

function UserTable({ users, onDelete }: any) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-slate-50 bg-slate-50/50">
          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Identity</th>
          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Balance</th>
          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Joined</th>
          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {users.map((u: any) => (
          <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="px-8 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shadow-inner">
                  {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-300">{u.username?.[0]}</div>}
                </div>
                <div>
                  <div className="font-bold text-black text-sm">{u.name || 'Anonymous'}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">@{u.username}</div>
                </div>
              </div>
            </td>
            <td className="px-8 py-5">
              <div className="font-mono text-sm font-bold text-emerald-600">{u.spent_origins || 0} O.G.</div>
            </td>
            <td className="px-8 py-5">
              <div className="text-[10px] font-bold uppercase text-slate-400">{formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}</div>
            </td>
            <td className="px-8 py-5">
              <button 
                onClick={() => onDelete(u.id)}
                className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PhotoTable({ photos, onDelete }: any) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-slate-50 bg-slate-50/50">
          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Media</th>
          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Creator</th>
          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Uploaded</th>
          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {photos.map((p: any) => (
          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="px-8 py-5">
              <div className="w-20 aspect-video rounded-lg overflow-hidden bg-slate-100 shadow-sm">
                <img src={p.url} className="w-full h-full object-cover" />
              </div>
            </td>
            <td className="px-8 py-5 text-sm font-bold text-slate-600">
              @{p.owner?.username}
            </td>
            <td className="px-8 py-5">
              <div className="text-[10px] font-bold uppercase text-slate-400">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</div>
            </td>
            <td className="px-8 py-5">
              <button 
                onClick={() => onDelete(p.id)}
                className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PostTable({ posts, onDelete }: any) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-slate-50 bg-slate-50/50">
          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Content Preview</th>
          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Author</th>
          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {posts.map((p: any) => (
          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="px-8 py-5">
              <p className="text-sm font-medium text-slate-600 line-clamp-1 max-w-sm">{p.content}</p>
            </td>
            <td className="px-8 py-5 text-sm font-bold text-slate-600">
              @{p.owner?.username}
            </td>
            <td className="px-8 py-5">
              <button 
                onClick={() => onDelete(p.id)}
                className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
