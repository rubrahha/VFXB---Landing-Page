import React from 'react';
import { motion } from 'framer-motion';
import { Play, TrendingUp, Zap, BarChart3 } from 'lucide-react';

interface HeroProps {
  onStartAnalysis: () => void;
  onOpenEditor: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartAnalysis, onOpenEditor }) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Animated Background Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-900/40 blur-[120px] animate-pulse-slow" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-900/40 blur-[100px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-indigo-900/30 blur-[120px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
        
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent"></span>
          </span>
          <span className="text-xs md:text-sm font-medium text-gray-300">AI Model v2.5 Now Live</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6 max-w-5xl"
        >
          Stop Guessing. <br />
          Start Going <span className="text-gradient">Viral.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed"
        >
          The only platform that edits your video <span className="text-white font-semibold">AND</span> predicts its viral potential before you hit publish. Trusted by 10,000+ creators.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center"
        >
          <button 
            onClick={onOpenEditor}
            className="w-full sm:w-auto group relative px-8 py-4 rounded-xl font-bold text-white overflow-hidden shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 transition-all"
          >
            <div className="absolute inset-0 btn-gradient transition-transform duration-300 group-hover:scale-110"></div>
            <span className="relative flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" />
              Analyze Your Video
            </span>
          </button>
          
          <button 
            onClick={onStartAnalysis}
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-white border border-white/20 hover:bg-white/10 transition-all flex items-center justify-center gap-2 group backdrop-blur-sm"
          >
            <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
            See How It Works
          </button>
        </motion.div>

        {/* Floating cards elements - decorative */}
        <div className="absolute top-1/2 left-0 hidden lg:block -translate-y-1/2 -translate-x-20 animate-float">
           <GlassCard icon={<TrendingUp className="text-brand-accent" />} label="Virality Score" value="98/100" trend="+24%" />
        </div>
        <div className="absolute bottom-20 right-0 hidden lg:block translate-x-10 animate-float" style={{ animationDelay: '1s' }}>
           <GlassCard icon={<BarChart3 className="text-brand-secondary" />} label="Hook Retention" value="85%" trend="+12s" />
        </div>

      </div>
      
      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500"
      >
        <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-gray-500 to-transparent"></div>
      </motion.div>
    </div>
  );
};

const GlassCard = ({ icon, label, value, trend }: { icon: React.ReactNode, label: string, value: string, trend: string }) => (
  <div className="glass-card p-4 rounded-2xl flex items-center gap-4 w-64 transform rotate-[-5deg] hover:rotate-0 transition-transform duration-500">
    <div className="p-3 bg-white/10 rounded-xl">
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{label}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-bold text-white">{value}</h3>
        <span className="text-xs font-bold text-green-400">{trend}</span>
      </div>
    </div>
  </div>
);