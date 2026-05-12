import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { AlertCircle, ArrowRight, Loader2, Mail } from 'lucide-react';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modeParam = searchParams.get('mode');
  
  const [isLogin, setIsLogin] = useState(modeParam !== 'register');
  const [isRegistered, setIsRegistered] = useState(false);
  const [validationModal, setValidationModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
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
        // Проверка username (через profiles)
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', formData.username.toLowerCase())
          .maybeSingle();

        if (existingUser) {
          setValidationModal({ 
            show: true, 
            message: 'This username is already taken. Please choose another one.' 
          });
          setLoading(false);
          return;
        }

        // Регистрация — Supabase сам проверит email
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              username: formData.username.toLowerCase(),
              name: formData.name,
            }
          }
        });
        
        if (authError) {
          if (authError.message?.includes('already registered')) {
            setValidationModal({ 
              show: true, 
              message: 'This email is already registered. Please use a different email or sign in.' 
            });
            setLoading(false);
            return;
          }
          throw authError;
        }
        
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              username: formData.username.toLowerCase(),
              name: formData.name,
              email: formData.email.toLowerCase(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          
          if (profileError) {
            console.error("Profile creation error:", profileError);
          }
        }
        
        setIsRegistered(true);
        setFormData({ name: '', username: '', email: '', password: '' });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (isRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-white rounded-3xl p-10 space-y-8 text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto shadow-xl">
            <Mail className="text-white" size={32} />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-black">Check your mail</h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed px-2">
              We've sent you a confirmation email. Confirm your mail and login to explore StartOrigin.
            </p>
          </div>
          <button
            onClick={() => {
              setIsRegistered(false);
              setIsLogin(true);
            }}
            className="w-full h-14 bg-black text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-black/90 active:scale-95 transition-all shadow-xl shadow-black/10 mt-4"
          >
            <span>Back to Login</span>
            <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <motion.div 
        layout
        className="w-full max-w-sm bg-white rounded-3xl p-10 space-y-10 shadow-xl"
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
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 text-[15px] focus:outline-none focus:bg-white focus:border-black/10 transition-all font-medium placeholder:text-slate-300"
                    placeholder="Your Name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-2">Username</label>
                  <input
                    required
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 text-[15px] focus:outline-none focus:bg-white focus:border-black/10 transition-all font-medium placeholder:text-slate-300"
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
              onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
              className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 text-[15px] focus:outline-none focus:bg-white focus:border-black/10 transition-all font-medium placeholder:text-slate-300"
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
              className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 text-[15px] focus:outline-none focus:bg-white focus:border-black/10 transition-all font-medium placeholder:text-slate-300"
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
            className="w-full h-14 bg-black text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-black/90 active:scale-95 transition-all shadow-xl shadow-black/10 disabled:opacity-50 mt-8"
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

      <AnimatePresence>
        {validationModal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white rounded-3xl p-10 text-center space-y-8 shadow-2xl"
            >
              <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto">
                <AlertCircle className="text-rose-500" size={32} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-black">Hold on...</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  {validationModal.message}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setValidationModal({ show: false, message: '' })}
                  className="w-full h-14 bg-black text-white font-bold rounded-2xl hover:bg-black/90 active:scale-95 transition-all shadow-xl shadow-black/10"
                >
                  Try again
                </button>
                {validationModal.message.includes('email') && (
                  <button
                    onClick={() => {
                      setValidationModal({ show: false, message: '' });
                      setIsLogin(true);
                    }}
                    className="w-full h-14 bg-slate-50 text-slate-400 font-bold rounded-2xl hover:bg-slate-100 hover:text-black active:scale-95 transition-all"
                  >
                    Go to Login
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}