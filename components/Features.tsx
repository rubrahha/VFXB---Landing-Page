import React from 'react';
import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Why Top Creators Switch to VFXB</h2>
          <p className="text-gray-400">The only tool that replaces your editor, analyst, and strategist.</p>
        </div>

        {/* Problem / Solution Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-32">
          <ProblemSolutionCard 
            problem="Unwanted watermarks"
            solution="AI Magic Eraser"
            result="Clean Pro Look"
            delay={0}
          />
          <ProblemSolutionCard 
            problem="Blurry AI video"
            solution="AI 4K Detailer"
            result="1080p → 4K Upscale"
            delay={0.2}
          />
          <ProblemSolutionCard 
            problem="Noisy background audio"
            solution="Studio Audio Master"
            result="Crystal Clear Voice"
            delay={0.4}
          />
        </div>

        {/* Feature Comparison Table */}
        <div className="glass-card rounded-2xl overflow-hidden p-8 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Feature</th>
                <th className="text-center py-4 px-4 text-gray-500 font-medium">CapCut</th>
                <th className="text-center py-4 px-4 text-gray-500 font-medium">TikAlyzer</th>
                <th className="text-center py-4 px-4 font-bold text-brand-primary bg-white/5 rounded-t-lg border-t border-x border-white/10 relative">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-accent text-[10px] font-bold px-2 py-0.5 rounded text-black uppercase shadow-[0_0_10px_#32B8C6]">Winner</span>
                  VFXB
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { name: 'AI Watermark Removal', capcut: false, tikalyzer: false, vfxb: true },
                { name: 'AI Video Upscaling (4K)', capcut: false, tikalyzer: false, vfxb: true },
                { name: 'Studio Audio Mastering', capcut: true, tikalyzer: false, vfxb: true },
                { name: 'Viral Prediction Score', capcut: false, tikalyzer: true, vfxb: true },
                { name: 'Competitor Spy', capcut: false, tikalyzer: false, vfxb: true },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4 font-medium text-gray-200">{row.name}</td>
                  <td className="py-4 px-4 text-center"><StatusIcon status={row.capcut} /></td>
                  <td className="py-4 px-4 text-center"><StatusIcon status={row.tikalyzer} /></td>
                  <td className="py-4 px-4 text-center bg-white/5 border-x border-white/10"><StatusIcon status={row.vfxb} isMain /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </section>
  );
};

const ProblemSolutionCard = ({ problem, solution, result, delay }: { problem: string, solution: string, result: string, delay: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    viewport={{ once: true }}
    className="glass-card p-1 rounded-2xl group hover:border-brand-primary/50 transition-all duration-300"
  >
    <div className="bg-[#121225]/80 p-6 rounded-xl h-full flex flex-col relative overflow-hidden">
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
          <X size={16} />
        </div>
        <p className="text-gray-400 text-sm">{problem}</p>
      </div>
      
      <div className="flex items-center justify-center py-4">
        <div className="h-8 w-[1px] bg-white/10 group-hover:h-12 group-hover:bg-brand-primary transition-all"></div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
          <Check size={16} />
        </div>
        <p className="text-white font-medium text-sm">{solution}</p>
      </div>

      <div className="mt-auto pt-4 border-t border-white/5">
        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Result</p>
        <p className="text-2xl font-bold text-green-400 flex items-center gap-2">
          {result} <span className="text-xs bg-green-500/20 px-1.5 py-0.5 rounded text-green-400">🚀</span>
        </p>
      </div>
    </div>
  </motion.div>
);

const StatusIcon = ({ status, isMain }: { status: boolean, isMain?: boolean }) => {
  if (status) return <Check className={`mx-auto ${isMain ? 'text-brand-accent w-6 h-6' : 'text-gray-500 w-5 h-5'}`} />;
  return <X className="text-gray-700 w-5 h-5 mx-auto" />;
};