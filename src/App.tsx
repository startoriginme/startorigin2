import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { supabase } from './lib/supabase';
import Navigation from './components/Navigation';
import Feed from './pages/Feed';
import Search from './pages/Search';
import Add from './pages/Add';
import Gallery from './pages/Gallery';
import Profile from './pages/Profile';
import Follows from './pages/Follows';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import Landing from './pages/Landing';
import { Profile as ProfileType } from './types';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) setProfile(data);
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-3xl font-bold tracking-widest uppercase text-black"
        >
          StartOrigin
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-white text-slate-900 flex flex-col md:flex-row">
        {session && <Navigation />}
        
        <main className="flex-1 relative pb-20 md:pb-0 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={session ? <Navigate to="/feed" /> : <Landing />} />
              <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/feed" />} />
              
              {/* Protected Routes */}
              <Route path="/feed" element={session ? <Feed user={session.user} /> : <Navigate to="/auth" />} />
              <Route path="/search" element={session ? <Search /> : <Navigate to="/auth" />} />
              <Route path="/add" element={session ? <Add user={session.user} /> : <Navigate to="/auth" />} />
              <Route path="/gallery" element={session ? <Gallery user={session.user} /> : <Navigate to="/auth" />} />
              <Route path="/profile" element={session ? <Profile user={session.user} onUpdate={fetchProfile} /> : <Navigate to="/auth" />} />
              <Route path="/profile/:username" element={session ? <Profile user={session.user} onUpdate={fetchProfile} /> : <Navigate to="/auth" />} />
              <Route path="/profile/:username/follows" element={session ? <Follows /> : <Navigate to="/auth" />} />
              <Route path="/settings" element={session ? <Settings user={session.user} profile={profile} onUpdate={fetchProfile} /> : <Navigate to="/auth" />} />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </Router>
  );
}
