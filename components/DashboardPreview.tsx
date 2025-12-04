import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Zap, TrendingUp, 
  Activity, Eye, Share2, MessageCircle, 
  Scan, ShieldCheck, AlertCircle, CheckCircle2
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DashboardProps {
  isFullMode?: boolean;
}

const VIDEO_SRC = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

const mockAnalysisData = [
  { time: '0s', retention: 100, score: 85 },
  { time: '2s', retention: 95, score: 88 },
  { time: '4s', retention: 88, score: 70 }, 
  { time: '6s', retention: 92, score: 90 }, 
  { time: '8s', retention: 85, score: 82 },
  { time: '10s', retention: 80, score: 85 },
  { time: '12s', retention: 75, score: 80 },
];

export const DashboardPreview: React.FC<DashboardProps> = ({ isFullMode = false }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0); 
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isFullMode) {
      // Logic for full mode init
    }
    return () => {
      if (videoRef.current) {
         videoRef.current.pause();
      }
    }
  }, [isFullMode]);

  const startAnalysis = () => {
    if (isAnalyzing || analysisStep === 3) return;
    
    setIsAnalyzing(true);
    setAnalysisStep(1);
    
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }

    setTimeout(() => {
      setAnalysisStep(2);
    }, 2500);

    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisStep(3);
      if (videoRef.current) videoRef.current.pause();
      setIsPlaying(false);
    }, 4000);
  };

  const resetDemo = () => {
    setAnalysisStep(0);
    setIsAnalyzing(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section className={`relative py-12 lg:py-24 overflow-hidden ${isFullMode ? 'pt-4' : ''}`}>
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
       </div>

      {!isFullMode && (
        <div className="text-center mb-12 px-4 relative z-10">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-brand-accent text-xs font-bold uppercase tracking-wider mb-4">
             <Zap size={12} /> Interactive Demo
           </div>
           <h2 className="text-3xl md:text-5xl font-bold mb-4">See the <span className="text-gradient">Viral Engine</span> in Action</h2>
           <p className="text-gray-400 max-w-2xl mx-auto">
             Upload your footage. Watch AI predict the future.
           </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
        <div className="glass-card rounded-2xl overflow-hidden flex flex-col lg:flex-row min-h-[600px] border border-white/10">
          
          {/* LEFT: Video Player Area */}
          <div className="lg:w-[60%] bg-[#0A0A16] relative flex flex-col">
            {/* Toolbar */}
            <div className="h-14 border-b border-white/5 bg-[#0A0A16] flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                 <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                 </div>
                 <span className="text-xs text-gray-500 ml-2">Standard Video Analysis</span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={analysisStep === 3 ? resetDemo : startAnalysis}
                  className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${analysisStep === 3 ? 'bg-white/10 hover:bg-white/20 text-white' : 'btn-gradient text-white hover:opacity-90'}`}
                >
                  {analysisStep === 0 ? 'Start Analysis' : analysisStep === 3 ? 'Reset Demo' : 'Analyzing...'}
                </button>
              </div>
            </div>

            {/* Video Canvas */}
            <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden group">
               <div className="relative w-full h-full max-h-[500px] aspect-video bg-black shadow-2xl">
                 <video
                    ref={videoRef}
                    src={VIDEO_SRC}
                    className="w-full h-full object-contain" 
                    playsInline
                    onEnded={() => setIsPlaying(false)}
                    onClick={togglePlay}
                 />
                 
                 <AnimatePresence>
                   {analysisStep === 1 && (
                     <motion.div 
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       exit={{ opacity: 0 }}
                       className="absolute inset-0 pointer-events-none"
                     >
                       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                       <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                          {[...Array(9)].map((_, i) => (
                            <div key={i} className="border border-brand-accent/30"></div>
                          ))}
                       </div>
                       <motion.div 
                         animate={{ top: ['0%', '100%'] }}
                         transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                         className="absolute left-0 right-0 h-0.5 bg-brand-accent shadow-[0_0_15px_#32B8C6] z-10"
                       />
                       <motion.div 
                         initial={{ opacity: 0, scale: 0.8 }}
                         animate={{ opacity: 1, scale: 1 }}
                         transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
                         className="absolute top-[20%] left-[30%] w-[40%] h-[60%] border-2 border-brand-accent/80 rounded-lg"
                       >
                          <span className="absolute -top-3 left-2 text-[10px] bg-brand-accent text-black px-1 font-bold">MAIN SUBJECT</span>
                       </motion.div>
                     </motion.div>
                   )}
                 </AnimatePresence>

                 {!isPlaying && analysisStep !== 1 && analysisStep !== 2 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-colors cursor-pointer" onClick={togglePlay}>
                       <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 fill-white text-white ml-1" />
                       </div>
                    </div>
                 )}
               </div>
            </div>

            <div className="h-12 bg-[#0A0A16] border-t border-white/5 flex items-center px-4 gap-4">
              <div className="text-xs text-gray-500 font-mono">00:00:00</div>
              <div className="flex-1 h-8 bg-white/5 rounded relative overflow-hidden">
                 <div className="absolute inset-0 flex items-center justify-around opacity-30">
                    {[...Array(50)].map((_, i) => (
                      <div key={i} className="w-1 bg-brand-primary" style={{ height: `${Math.random() * 100}%` }}></div>
                    ))}
                 </div>
                 <motion.div 
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_white] z-10"
                    animate={{ left: isPlaying ? '100%' : '0%' }}
                    transition={{ duration: 15, ease: "linear" }} 
                 />
              </div>
            </div>
          </div>

          {/* RIGHT: Analytics Panel */}
          <div className="lg:w-[40%] bg-[#121225] border-l border-white/10 flex flex-col">
            
            <div className="p-6 border-b border-white/5">
               <h3 className="font-bold text-white flex items-center gap-2">
                 <Activity className="text-brand-accent" size={18} />
                 Video Intelligence
               </h3>
               <p className="text-xs text-gray-500 mt-1">AI Model v2.5 • Real-time inference</p>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
               {analysisStep < 3 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-80">
                    {analysisStep === 0 ? (
                       <>
                         <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-2 animate-pulse">
                           <Scan size={32} className="text-brand-accent" />
                         </div>
                         <div>
                           <h4 className="text-lg font-medium text-white">Ready to Analyze</h4>
                           <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">Click "Start Analysis" to scan frame-by-frame for engagement triggers.</p>
                         </div>
                         <button onClick={startAnalysis} className="btn-gradient px-6 py-2 rounded-lg text-sm font-bold text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all">Run Viral Scan</button>
                       </>
                    ) : (
                       <div className="flex flex-col items-center">
                          <div className="w-16 h-16 relative mb-4">
                             <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
                             <div className="absolute inset-0 border-4 border-t-brand-accent rounded-full animate-spin"></div>
                          </div>
                          <h4 className="text-white font-medium animate-pulse">
                            {analysisStep === 1 ? 'Scanning Visuals...' : 'Calculating Viral Score...'}
                          </h4>
                          <p className="text-xs text-gray-500 mt-2">Processing neural network layers</p>
                       </div>
                    )}
                 </div>
               ) : (
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                 >
                    {/* Score Card */}
                    <div className="bg-white/5 rounded-xl p-5 border border-white/10 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-3 opacity-10">
                          <TrendingUp size={48} className="text-white" />
                       </div>
                       <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-2">Predicted Viral Score</p>
                       <div className="flex items-baseline gap-3">
                          <span className="text-5xl font-bold text-white">92</span>
                          <span className="text-sm text-gray-500">/ 100</span>
                       </div>
                       <div className="mt-4 w-full bg-black/50 h-2 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: '92%' }} 
                            transition={{ duration: 1, delay: 0.2 }}
                            className="h-full bg-gradient-to-r from-brand-primary to-brand-accent shadow-[0_0_10px_#6366f1]"
                          />
                       </div>
                       <p className="text-xs text-brand-accent mt-3 flex items-center gap-1">
                         <TrendingUp size={12} /> Top 5% of content in your niche
                       </p>
                    </div>

                    {/* Key Insights */}
                    <div>
                       <h4 className="text-sm font-bold text-white mb-4">Optimization Insights</h4>
                       <div className="space-y-3">
                          <InsightItem 
                            type="success" 
                            label="Strong Hook" 
                            desc="First 3s retention is 40% above average." 
                          />
                          <InsightItem 
                            type="warning" 
                            label="Pacing Issue" 
                            desc="Drop-off detected at 0:04. Consider a jump cut." 
                          />
                          <InsightItem 
                            type="info" 
                            label="Audio Quality" 
                            desc="Speech is clear. Background music volume optimized." 
                          />
                       </div>
                    </div>

                    {/* Retention Graph */}
                    <div className="h-48">
                       <h4 className="text-sm font-bold text-white mb-4">Retention Curve</h4>
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={mockAnalysisData}>
                            <defs>
                              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="time" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                              itemStyle={{ color: '#fff' }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="score" 
                              stroke="#6366f1" 
                              strokeWidth={2}
                              fillOpacity={1} 
                              fill="url(#colorScore)" 
                            />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </motion.div>
               )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const InsightItem = ({ type, label, desc }: { type: 'success' | 'warning' | 'info', label: string, desc: string }) => {
  const colors = {
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  };

  const icons = {
    success: <CheckCircle2 size={16} />,
    warning: <AlertCircle size={16} />,
    info: <Activity size={16} />
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${colors[type]}`}>
       <div className="mt-0.5 flex-shrink-0">
         {icons[type]}
       </div>
       <div>
         <p className="text-sm font-bold">{label}</p>
         <p className="text-xs opacity-70 leading-relaxed">{desc}</p>
       </div>
    </div>
  );
};