import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, User as UserIcon, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Profile } from '../types';
import { useTranslation } from 'react-i18next';
import { GRADIENT_CONFIG, FONT_CONFIG } from '../constants/shop';

export default function Follows() {
  const { t } = useTranslation();
  const { username } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(
    location.state?.type || 'followers'
  );

  useEffect(() => {
    if (username) {
      fetchProfileAndData();
    }
  }, [username]);

  async function fetchProfileAndData() {
    setLoading(true);
    // Fetch target profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (profileData) {
      setProfile(profileData);
      
      // Fetch followers
      const { data: followersData } = await supabase
        .from('follows')
        .select('follower:profiles!follower_id(*)')
        .eq('following_id', profileData.id);
      
      // Fetch following
      const { data: followingData } = await supabase
        .from('follows')
        .select('following:profiles!following_id(*)')
        .eq('follower_id', profileData.id);

      if (followersData) setFollowers(followersData.map(f => f.follower));
      if (followingData) setFollowing(followingData.map(f => f.following));
    }
    setLoading(false);
  }

  const currentList = activeTab === 'followers' ? followers : following;

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-slate-200" size={32} /></div>;

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8 space-y-8 min-h-screen bg-white">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-black">@{username}</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            {activeTab === 'followers' ? `${followers.length} ${t('profile.followers')}` : `${following.length} ${t('profile.following')}`}
          </p>
        </div>
      </header>

      <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-100">
        <button 
          onClick={() => setActiveTab('followers')}
          className={cn(
            "flex-1 py-3 text-sm font-bold rounded-xl transition-all relative z-10",
            activeTab === 'followers' ? "text-white" : "text-slate-400 hover:text-black"
          )}
        >
          {t('profile.followers')}
          {activeTab === 'followers' && (
            <motion.div layoutId="follow-tab-active" className="absolute inset-0 bg-black rounded-xl -z-10" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('following')}
          className={cn(
            "flex-1 py-3 text-sm font-bold rounded-xl transition-all relative z-10",
            activeTab === 'following' ? "text-white" : "text-slate-400 hover:text-black"
          )}
        >
          {t('profile.following')}
          {activeTab === 'following' && (
            <motion.div layoutId="follow-tab-active" className="absolute inset-0 bg-black rounded-xl -z-10" />
          )}
        </button>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {currentList.length > 0 ? (
            currentList.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link 
                  to={`/profile/${user.username}`}
                  className="flex items-center justify-between p-4 glass-card group border border-slate-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} className="w-full h-full object-cover" />
                      ) : <UserIcon className="w-full h-full p-3 text-slate-300" />}
                    </div>
                    <div>
                      <div className={cn(
                        "font-bold group-hover:underline underline-offset-4",
                        user.active_gradient ? GRADIENT_CONFIG[user.active_gradient]?.className : "text-black",
                        user.active_font ? FONT_CONFIG[user.active_font]?.className : ""
                      )}>{user.name || user.username}</div>
                      <div className="text-xs text-slate-400 font-medium">@{user.username}</div>
                    </div>
                  </div>
                  <div className="text-slate-200 group-hover:text-black transition-colors">
                    <ChevronLeft className="rotate-180" size={18} />
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center space-y-2">
              <p className="text-slate-200 font-bold uppercase tracking-[0.2em] text-[10px]">{t('profile.nothing_to_see')}</p>
              <p className="text-sm text-slate-400">{t('profile.empty_followers_sub', { username })}</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
