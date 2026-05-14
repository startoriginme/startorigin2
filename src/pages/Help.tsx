import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Mail, HelpCircle, AlertCircle, Trash2, Key } from 'lucide-react';
import { motion } from 'motion/react';

export default function Help() {
  const faqs = [
    {
      id: 1,
      icon: AlertCircle,
      question: "I created an account but I forgot to verify it and now the link isn't available",
      solution: "It's ok. Just contact our technical support: gerxog04@gmail.com."
    },
    {
      id: 2,
      icon: Key,
      question: "I forgot my password",
      solution: "Unfortunately, the reset the password function is in development. The only things we can suggest is deleting your account or sending you magic link for logging in. Contact us: gerxog04@gmail.com"
    },
    {
      id: 3,
      icon: Trash2,
      question: "I want to delete my account",
      solution: "Really? Oh.. Anyway, to delete your account, contact our technical support: gerxog04@gmail.com"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <Link to="/auth" className="p-3 bg-white rounded-2xl text-slate-400 hover:text-black shadow-sm transition-all border border-slate-100">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-black flex items-center gap-2">
              <HelpCircle className="text-blue-500" />
              Help Center
            </h1>
            <p className="text-slate-400 font-medium">Common problems & solutions</p>
          </div>
        </header>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                  <faq.icon size={24} />
                </div>
                <div className="space-y-1">
                  <h2 className="font-bold text-black text-lg leading-tight">{faq.question}</h2>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-4">
                    <div className="flex items-start gap-3">
                      <Mail size={16} className="text-blue-500 mt-1 flex-shrink-0" />
                      <p className="text-slate-600 font-medium text-sm leading-relaxed">
                        {faq.solution}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <footer className="text-center pt-8">
          <p className="text-slate-400 text-sm font-medium">
            Still need help? Email us directly at <a href="mailto:gerxog04@gmail.com" className="text-blue-500 font-bold hover:underline">gerxog04@gmail.com</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
