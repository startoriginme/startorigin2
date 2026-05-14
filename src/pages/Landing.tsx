import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, ArrowRight, Heart, Menu, X, Users, Flame, Palette, Star, ShoppingBag, Image, Trophy, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export default function Landing() {
  const { t } = useTranslation();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const features = [
    {
      icon: Camera,
      title: t('landing.features.publish'),
      description: t('landing.features.publish_desc'),
      color: "text-blue-500"
    },
    {
      icon: Users,
      title: t('landing.features.follow'),
      description: t('landing.features.follow_desc'),
      color: "text-blue-500"
    },
    {
      icon: Heart,
      title: t('landing.features.inspire'),
      description: t('landing.features.inspire_desc'),
      color: "text-blue-500"
    },
    {
      icon: Flame,
      title: t('landing.features.swipe'),
      description: t('landing.features.swipe_desc'),
      color: "text-orange-500",
      highlight: true
    },
    {
      icon: Palette,
      title: t('landing.features.decorations'),
      description: t('landing.features.decorations_desc'),
      color: "text-purple-500",
      highlight: true
    },
    {
      icon: Star,
      title: t('landing.features.badges'),
      description: t('landing.features.badges_desc'),
      color: "text-amber-400",
      highlight: true
    },
    {
      icon: ShoppingBag,
      title: t('landing.features.shop'),
      description: t('landing.features.shop_desc'),
      color: "text-green-500",
      highlight: true
    },
    {
      icon: Image,
      title: t('landing.features.gallery'),
      description: t('landing.features.gallery_desc'),
      color: "text-blue-500",
      highlight: true
    },
    {
      icon: Trophy,
      title: t('landing.features.achievements'),
      description: t('landing.features.achievements_desc'),
      color: "text-yellow-500",
      highlight: true
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-black tracking-tight">StartOrigin</span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/auth"
              className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-black/5"
            >
              {t('landing.get_started')}
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-black"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
            >
              <div className="flex flex-col p-6 gap-4">
                <Link
                  to="/auth"
                  className="px-6 py-3 bg-black text-white rounded-xl text-center font-bold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('landing.get_started')}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="min-h-[85vh] flex items-center justify-center px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest"
            >
              <Sparkles size={14} className="text-amber-500" />
              <span>StartOrigin v1.0 is here</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-bold tracking-tighter text-black"
            >
              Hey, it's{' '}
              <span className="text-slate-400">
                StartOrigin
              </span>
              .
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto font-medium"
            >
              {t('landing.subtitle')}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            >
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-black text-white rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-2xl shadow-black/10"
              >
                {t('landing.get_started')}
                <ArrowRight size={20} />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-6 bg-slate-50">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-black tracking-tight">{t('landing.features_title')}</h2>
              <p className="text-slate-400 font-medium">{t('landing.features_sub')}</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  whileHover={{ y: -8 }}
                  className={cn(
                    "p-8 rounded-[2.5rem] bg-white border border-slate-100 space-y-4 shadow-sm transition-all",
                    feature.highlight && "ring-2 ring-black/5"
                  )}
                >
                  <div className={cn("inline-flex p-3 rounded-2xl bg-slate-50", feature.color)}>
                    <feature.icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-black">{feature.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{feature.description}</p>
                  {feature.highlight && feature.title !== t('landing.features.swipe') && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 text-black text-[10px] font-bold uppercase tracking-widest">
                      <Sparkles size={10} />
                      <span>New Era</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Tinder Mode Highlight */}
        <section className="py-32 px-6 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-pink-50 opacity-50" />
          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto"
            >
              <Flame size={40} className="text-orange-500" />
            </motion.div>
            
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-black tracking-tighter">
                {t('landing.tinder_title')}
              </h2>
              <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
                {t('landing.tinder_sub')}
              </p>
            </div>

            <div className="flex justify-center gap-10">
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-emerald-500">
                  <Heart size={24} fill="currentColor" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest opacity-40">Like</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-rose-500">
                  <X size={24} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest opacity-40">Pass</span>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto rounded-[4rem] bg-black p-12 md:p-20 text-center space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              {t('landing.ready')}
            </h2>
            <p className="text-white/40 text-lg font-medium max-w-md mx-auto">
              {t('landing.ready_sub')}
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-3 px-10 py-5 bg-white text-black rounded-2xl font-bold text-lg hover:scale-105 transition-all"
            >
              {t('landing.create_account')}
              <ArrowRight size={20} />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-100 py-16 px-6">
          <div className="max-w-7xl mx-auto flex flex-col items-center space-y-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-black flex items-center justify-center">
                <Camera size={12} className="text-white" />
              </div>
              <span className="text-sm font-bold text-black tracking-tight">StartOrigin</span>
            </div>
            
            <div className="flex items-center gap-6">
              <a href="https://startorigin.gitbook.io/startorigin" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-black transition-colors">Documentation</a>
              <a href="https://startorigin.gitbook.io/startorigin/rules" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-black transition-colors">Rules</a>
            </div>
            
            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              © {currentYear} StartOrigin — {t('landing.footer', { heart: '' })}
              <Heart size={12} className="text-rose-500 fill-rose-500" /> 
              for creators
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
