import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Info, AlertTriangle, X } from 'lucide-react';

type AlertType = 'success' | 'info' | 'warning' | 'error';

interface AlertOptions {
  message: string;
  type?: AlertType;
  duration?: number;
}

interface NotificationContextType {
  showAlert: (options: AlertOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AlertOptions | null>(null);

  const showAlert = (options: AlertOptions) => {
    setAlert(options);
    const duration = options.duration || 3000;
    setTimeout(() => {
      setAlert((current) => current?.message === options.message ? null : current);
    }, duration);
  };

  return (
    <NotificationContext.Provider value={{ showAlert }}>
      {children}
      <AnimatePresence>
        {alert && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              className="bg-black text-white px-8 py-6 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.4)] flex flex-col items-center gap-4 max-w-xs w-full pointer-events-auto border border-white/10 backdrop-blur-xl"
            >
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                {alert.type === 'error' ? <AlertTriangle className="text-red-400" size={32} /> : 
                 alert.type === 'warning' ? <Info className="text-amber-400" size={32} /> :
                 <Check className="text-emerald-400" size={32} />}
              </div>
              <div className="text-center space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Notification</div>
                <div className="text-lg font-bold tracking-tight leading-tight">{alert.message}</div>
              </div>
              <button 
                onClick={() => setAlert(null)}
                className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white transition-colors"
              >
                Tap to dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
