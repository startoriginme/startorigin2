import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { AlertCircle, ArrowRight, Loader2, Mail, Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modeParam = searchParams.get('mode');
  
  const [isLogin, setIsLogin] = useState(modeParam !== 'register');
  const [isRegistered, setIsRegistered] = useState(false);
  const [validationModal, setValidationModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
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
        // 1. Проверка username (через profiles)
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

        // 2. Проверка email в profiles.email
        const { data: existingEmail } = await supabase
          .from('profiles')
          .select('email')
          .eq('email', formData.email.toLowerCase())
          .maybeSingle();

        if (existingEmail) {
          setValidationModal({ 
            show: true, 
            message: 'This email is already registered. Please sign in instead or use a different email.' 
          });
          setLoading(false);
          return;
        }

        // 3. Регистрация
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
          // Fallback: если вдруг проверка пропустила дубликат
          if (authError.message?.includes('already registered')) {
            setValidationModal({ 
              show: true, 
              message: 'This email is already registered. Please sign in instead.' 
            });
            setLoading(false);
            return;
          }
          throw authError;
        }
        
        if (authData.user) {
          // Создаём профиль с email
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
            <h2 className="text-2xl font-bold tracking-tight text-black">{t('auth.check_mail')}</h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed px-2">
              {t('auth.check_mail_desc')}
            </p>
          </div>
          <button
            onClick={() => {
              setIsRegistered(false);
              setIsLogin(true);
            }}
            className="w-full h-14 bg-black text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-black/90 active:scale-95 transition-all shadow-xl shadow-black/10 mt-4"
          >
            <span>{t('auth.back_to_login')}</span>
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
            {isLogin ? t('auth.login') : t('auth.signup')}
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
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-2">{t('auth.name')}</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 text-[15px] focus:outline-none focus:bg-white focus:border-black/10 transition-all font-medium placeholder:text-slate-300"
                    placeholder={t('auth.name')}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-2">{t('auth.username')}</label>
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
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-2">{t('auth.email')}</label>
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
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-2">{t('auth.password')}</label>
            <div className="relative group/pass">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 pr-14 text-[15px] focus:outline-none focus:bg-white focus:border-black/10 transition-all font-medium placeholder:text-slate-300"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-black transition-colors"
                title={showPassword ? t('auth.hide_password') : t('auth.show_password')}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
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
                <span>{isLogin ? t('auth.login') : t('auth.signup')}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="text-center space-y-4">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-400 hover:text-black text-xs font-bold transition-colors block w-full"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
          <button
            onClick={() => navigate('/help')}
            className="text-slate-300 hover:text-black text-[10px] uppercase font-bold tracking-widest transition-colors"
          >
            Need help?
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