import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  PlusSquare, 
  Image as ImageIcon, 
  User, 
  Settings,
  Grid,
  MessageSquare,
  X,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

import { useTranslation } from 'react-i18next';

export default function Navigation() {
  const { t } = useTranslation();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showRoadmap, setShowRoadmap] = useState(false);

  const roadmapData = [
    {
      version: 'v1.02',
      changes: [
        'Attachments in Wall Posts',
        'Pin Functionality in The Wall',
        'Minor Improvements'
      ]
    },
    {
      version: 'v1.01',
      changes: [
        'Design updates',
        'Minor improvements'
      ]
    },
    {
      version: 'v1.0',
      changes: [
        'Chat added!',
        'Wall posts',
        'Updated shop descriptions',
        'Display Name styles added',
        'Pets added',
        'Pet Showcase on Profile',
        'Design Update',
        'Minor bug fixes',
        'And more!'
      ]
    }
  ];

  useEffect(() => {
    let userId: string | null = null;
    
    async function getInitialCount() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        userId = session.user.id;
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', userId)
          .eq('is_read', false);
        setUnreadCount(count || 0);
      }
    }

    getInitialCount();

    const channel = supabase
      .channel('unread-counts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
      }, async (payload) => {
        if (!userId) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) userId = session.user.id;
        }
        
        if (userId) {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .eq('is_read', false);
          setUnreadCount(count || 0);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const navItems = [
    { icon: Home, label: t('navigation.feed'), path: '/feed' },
    { icon: Search, label: t('navigation.search'), path: '/search' },
    { icon: PlusSquare, label: t('navigation.add'), path: '/add' },
    { icon: Grid, label: t('navigation.gallery'), path: '/gallery' },
    { icon: User, label: t('navigation.profile'), path: '/profile' },
    { icon: Settings, label: t('navigation.settings'), path: '/settings' },
  ];

  if (location.pathname.startsWith('/chat')) {
    return null;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen glass-panel sticky top-0 z-50 p-6 shadow-[4px_0_24px_rgba(0,0,0,0.01)]">
        <div className="mb-10 px-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-black">StartOrigin</h1>
            <button 
              onClick={() => setShowRoadmap(true)}
              className="px-1.5 py-0.5 bg-slate-50 hover:bg-black hover:text-white transition-all rounded text-[8px] font-black text-slate-300 uppercase tracking-tighter"
            >
              v1.02
            </button>
          </div>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">Your Photo Collection</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group text-[15px] relative",
                isActive 
                  ? "bg-black text-white font-semibold" 
                  : "text-slate-400 hover:text-black hover:bg-slate-50"
              )}
            >
              <item.icon size={20} className={cn(
                "transition-transform group-active:scale-90",
              )} />
              <span>{item.label}</span>
              {location.pathname === item.path && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute left-0 w-1 h-6 bg-black rounded-full"
                  style={{ marginLeft: '-24px', opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 h-18 bg-white/90 backdrop-blur-xl border border-slate-100 rounded-3xl z-50 shadow-2xl shadow-black/5 flex items-center px-4">
        <div className="flex items-center justify-around w-full">
          {navItems.filter(item => item.path !== '/settings').map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center flex-1 gap-1 py-2 transition-all duration-300 relative",
                isActive ? "text-black scale-110" : "text-slate-300"
              )}
            >
              <item.icon size={22} className={cn(
                "transition-transform active:scale-75",
              )} />
              {location.pathname === item.path && (
                <motion.div 
                  layoutId="mobile-nav-indicator"
                  className="absolute -bottom-1 w-1 h-1 bg-black rounded-full"
                />
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <AnimatePresence>
        {showRoadmap && (
          <div 
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowRoadmap(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-black tracking-tight">What's New</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Recent app updates</p>
                </div>
                <button 
                  onClick={() => setShowRoadmap(false)}
                  className="p-2 hover:bg-slate-50 transition-colors rounded-full text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {roadmapData.map((release, idx) => (
                  <div key={release.version} className="relative pl-6">
                    {/* Progress line */}
                    {idx !== roadmapData.length - 1 && (
                      <div className="absolute left-[7px] top-6 bottom-[-32px] w-0.5 bg-slate-100" />
                    )}
                    
                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white bg-black shadow-sm" />
                    
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-sm font-black text-black">{release.version}</span>
                      <div className="h-0.5 flex-1 bg-slate-50" />
                    </div>

                    <ul className="space-y-2">
                      {release.changes.map((change, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-500 text-sm">
                          <ChevronRight size={14} className="mt-1 flex-shrink-0 text-slate-300" />
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-slate-50/50">
                <button 
                  onClick={() => setShowRoadmap(false)}
                  className="w-full h-12 bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-[0.1em] hover:opacity-90 transition-all shadow-lg shadow-black/10"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
