import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  PlusSquare, 
  Image as ImageIcon, 
  User, 
  Settings,
  Grid,
  MessageSquare
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

import { useTranslation } from 'react-i18next';

export default function Navigation() {
  const { t } = useTranslation();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

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
          <h1 className="text-2xl font-bold tracking-tight text-black">StartOrigin</h1>
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
    </>
  );
}
