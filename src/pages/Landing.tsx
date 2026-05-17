import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, ArrowRight, Menu, X, Image, Lock, Palette, MessageCircle, FileText, Globe, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
        'Text posts on the wall',
        'Profile customization (gradients, fonts)',
        'Minor improvements'
      ]
    },
    {
      version: 'v1.01',
      changes: [
        'Chat added',
        'Design updates',
        'Bug fixes'
      ]
    },
    {
      version: 'v1.0',
      changes: [
        'Photo gallery',
        'Public feed',
        'Simple profile'
      ]
    }
  ];

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const features = [
    {
      icon: Image,
      title: 'Photo storage',
      description: 'All your photos in one place. No more digging through your phone gallery.',
      color: "text-black"
    },
    {
      icon: Globe,
      title: 'Public feed',
      description: 'Share your photos with the world. Or keep them private. Your choice.',
      color: "text-black"
    },
    {
      icon: Lock,
      title: 'Privacy controls',
      description: 'You decide who sees what. No surprises, no unwanted eyes.',
      color: "text-black"
    },
    {
      icon: Palette,
      title: 'Customization',
      description: 'Gradients, fonts, badges. Make your profile look like you.',
      color: "text-black"
    },
    {
      icon: MessageCircle,
      title: 'Chat',
      description: 'Talk to your friends. Direct messages, no noise.',
      color: "text-black"
    },
    {
      icon: FileText,
      title: 'Text posts',
      description: 'Not just photos. Share your thoughts, stories, updates.',
      color: "text-black"
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-medium text-black">StartOrigin</span>
            </Link>
            <button 
              onClick={() => setShowRoadmap(true)}
              className="hidden md:block px-2 py-0.5 bg-slate-50 hover:bg-slate-100 transition-colors rounded text-[10px] text-slate-400"
            >
              v1.02
            </button>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/auth"
              className="px-5 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Get started
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-black"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
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
              <div className="flex flex-col p-4 gap-3">
                <button 
                  onClick={() => {
                    setShowRoadmap(true);
                    setMobileMenuOpen(false);
                  }}
                  className="px-5 py-2 bg-slate-50 text-slate-500 rounded-lg text-center text-sm"
                >
                  v1.02 — What's new
                </button>
                <Link
                  to="/auth"
                  className="px-5 py-2 bg-black text-white rounded-lg text-center text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {showRoadmap && (
          <div 
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowRoadmap(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-black">What's new</h2>
                  <p className="text-xs text-slate-400">StartOrigin updates</p>
                </div>
                <button 
                  onClick={() => setShowRoadmap(false)}
                  className="p-1 hover:bg-slate-50 transition-colors rounded-full text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto">
                {roadmapData.map((release, idx) => (
                  <div key={release.version}>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-sm font-medium text-black">{release.version}</span>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>
                    <ul className="space-y-2">
                      {release.changes.map((change, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-500 text-sm">
                          <ChevronRight size={12} className="mt-0.5 flex-shrink-0 text-slate-300" />
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="p-5 bg-slate-50">
                <button 
                  onClick={() => setShowRoadmap(false)}
                  className="w-full py-2.5 bg-white border border-slate-200 text-black rounded-lg text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="px-6 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <p className="text-xs text-slate-400 uppercase tracking-wider">
              StartOrigin v1.02
            </p>
            
            <h1 className="text-4xl md:text-5xl font-medium text-black leading-tight">
              Your photos shouldn't get lost.
            </h1>
            
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              A simple place to store, share, and organize your memories. No ads. No algorithms. Just your photos.
            </p>
            
            <div className="pt-4">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg text-base font-medium hover:bg-gray-800 transition-colors"
              >
                Get started
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* Features — 6 честных фич */}
        <section className="px-6 py-16 border-t border-slate-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-medium text-black">What you get</h2>
              <p className="text-slate-400 mt-2">Everything you need. Nothing you don't.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="text-center space-y-3 p-4">
                  <div className="inline-flex p-3 rounded-full bg-slate-50 mx-auto">
                    <feature.icon size={20} className={feature.color} />
                  </div>
                  <h3 className="text-base font-medium text-black">{feature.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Honest section */}
        <section className="px-6 py-16 bg-slate-50">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-2xl font-medium text-black">Not another Instagram</h2>
            <p className="text-slate-500 leading-relaxed">
              No infinite scroll. No suggested posts. No tracking you across the web. 
              Just your photos, your friends, your conversations.
            </p>
            <div className="flex flex-wrap gap-3 justify-center pt-4">
              <span className="px-3 py-1 bg-white rounded-full text-xs text-slate-500">No ads</span>
              <span className="px-3 py-1 bg-white rounded-full text-xs text-slate-500">No algorithms</span>
              <span className="px-3 py-1 bg-white rounded-full text-xs text-slate-500">Your data stays yours</span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-2xl font-medium text-black">Start saving your memories</h2>
            <p className="text-slate-500">
              It's free. It's simple. Join a community that cares about photography, not engagement.
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg text-base font-medium hover:bg-gray-800 transition-colors"
            >
              Create account
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-100 py-10 px-6">
          <div className="max-w-7xl mx-auto flex flex-col items-center space-y-4 text-center">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-black flex items-center justify-center">
                <Camera size={10} className="text-white" />
              </div>
              <span className="text-xs font-medium text-black">StartOrigin</span>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <a href="#" className="hover:text-black transition-colors">Documentation</a>
              <span>•</span>
              <a href="#" className="hover:text-black transition-colors">Rules</a>
              <span>•</span>
              <a href="#" className="hover:text-black transition-colors">Privacy</a>
            </div>
            
            <p className="text-xs text-slate-300">
              © {currentYear} StartOrigin — save your photos
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
