import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, ArrowRight, Heart, Menu, X, Users, Flame, Palette, Star, ShoppingBag, Image, Trophy, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export default function Landing() {
  const { t } = useTranslation();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    setCurrentYear(new Date().getFullYear());
  }, []);

  const features = [
    {
      icon: Camera,
      title: t('landing.features.publish'),
      description: t('landing.features.publish_desc'),
      color: "text-blue-500"
    }, ✔️
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
      color: "text-blue-500",
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
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-black tracking-tight">StartOrigin</span>
            </Link>
            <button 
              onClick={() => setShowRoadmap(true)}
              className="hidden md:block px-2 py-0.5 bg-slate-50 hover:bg-black hover:text-white transition-all rounded-md text-[10px] font-bold text-slate-400"
            >
              v1.02
            </button>
          </div>

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
                <button 
                  onClick={() => {
                    setShowRoadmap(true);
                    setMobileMenuOpen(false);
                  }}
                  className="px-6 py-3 bg-slate-50 text-slate-500 rounded-xl text-center font-bold text-sm uppercase tracking-widest"
                >
                  View Roadmap v1.02
                </button>
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
                  <h2 className="text-xl font-bold text-black tracking-tight">Roadmap</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Evolution of StartOrigin</p>
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
                  Close Roadmap
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="min-h-[85vh] flex items-center justify-center px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => setShowRoadmap(true)}
            >
              <Sparkles size={14} className="text-amber-500" />
              <span>StartOrigin v1.02 is here</span>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-[10px] md:text-xs text-slate-400 max-w-2xl mx-auto font-bold uppercase tracking-[0.3em] mb-4"
            >
              {t('landing.subtitle')}
            </motion.p>

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
              className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium"
            >
              Step into the new era of creative expression.
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

        {/* Professional Archiving Highlight */}
        <section className="py-24 px-6 border-y border-slate-50">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
             <div className="flex-1 space-y-6">
                <div className="inline-flex p-3 rounded-2xl bg-black text-white">
                  <Image size={32} />
                </div>
                <h2 className="text-4xl font-bold text-black tracking-tight leading-tight">
                  Your Personal <br/> Photo Space
                </h2>
                <p className="text-slate-500 font-medium text-lg leading-relaxed">
                  StartOrigin is made for people who love photography. No ads. Just your beautiful moments, saved in high quality.
                </p>
                <div className="flex items-center gap-4 pt-4">
                   <div className="flex -space-x-3 overflow-hidden">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-300 border border-slate-50">
                           {i}
                        </div>
                      ))}
                   </div>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Join 500+ Photographers</p>
                </div>
             </div>
             <div className="flex-1 w-full aspect-square bg-slate-50 rounded-[3rem] border border-slate-100 flex items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-black/[0.02] to-transparent" />
                <div className="grid grid-cols-2 gap-4 w-full">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="aspect-square bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-100">
                        <ArrowRight size={40} strokeWidth={1} />
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-black tracking-tight">{t('landing.features_title')}</h2>
              <p className="text-slate-400 font-medium">{t('landing.features_sub')}</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.filter(f => f.title !== t('landing.features.swipe')).map((feature, index) => (
                <motion.div 
                  key={index}
                  whileHover={{ y: -8 }}
                  className={cn(
                    "p-8 rounded-[2.5rem] bg-white border border-slate-100 space-y-4 shadow-sm transition-all",
                    feature.highlight && "ring-1 ring-black/5"
                  )}
                >
                  <div className={cn("inline-flex p-3 rounded-2xl bg-slate-50", feature.color)}>
                    <feature.icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-black">{feature.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Removed Tinder Mode Highlight */}

        {/* Call to Action */}
        <section className="py-24 px-6 bg-slate-50">
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
              made for you
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
