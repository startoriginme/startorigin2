import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modeParam = searchParams.get('mode');
  
  const [isLogin, setIsLogin] = useState(modeParam !== 'register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    setIsLogin(modeParam !== 'register');
  }, [modeParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        navigate('/feed');
      } else {
        // Register flow
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });
        
        if (authError) throw authError;
        
        if (authData.user) {
          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              username: formData.username,
              name: formData.name,
            });
          
          if (profileError) throw profileError;
        }
        
        setError("Account created! Check your email for confirmation (if enabled). You can now sign in.");
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div 
        layout
        className="w-full max-w-sm glass-card p-10 space-y-10"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-black">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            {isLogin ? 'Sign in to continue to StartOrigin' : 'Join our premium creative community'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-5 overflow-hidden"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-2">Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[1.25rem] px-5 text-[15px] focus:outline-none focus:bg-white focus:border-black/5 transition-all font-medium placeholder:text-slate-300 focus:placeholder-slate-300"
                    placeholder="Your Name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-2">Username</label>
                  <input
                    required
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[1.25rem] px-5 text-[15px] focus:outline-none focus:bg-white focus:border-black/5 transition-all font-medium placeholder:text-slate-300 focus:placeholder-slate-300"
                    placeholder="johndoe"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-2">Email</label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[1.25rem] px-5 text-[15px] focus:outline-none focus:bg-white focus:border-black/5 transition-all font-medium placeholder:text-slate-300 focus:placeholder-slate-300"
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-2">Password</label>
            <input
              required
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[1.25rem] px-5 text-[15px] focus:outline-none focus:bg-white focus:border-black/5 transition-all font-medium placeholder:text-slate-300 focus:placeholder-slate-300"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-semibold"
            >
              <AlertCircle size={14} />
              <span>{error}</span>
            </motion.div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full h-14 bg-black text-white font-bold rounded-[1.25rem] flex items-center justify-center gap-2 hover:bg-black/90 active:scale-95 transition-all shadow-xl shadow-black/10 disabled:opacity-50 mt-8"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-400 hover:text-black text-xs font-bold transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
