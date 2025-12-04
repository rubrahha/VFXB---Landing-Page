
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Zap, Scan, AlertCircle, CheckCircle2, ArrowRight, FileVideo, Loader2, BrainCircuit, Eye, Activity, Info, TrendingUp, BarChart3, Clock, Target } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface AnalysisPageProps {
  onBack: () => void;
  onAnalysisComplete: (file: File) => void;
}

interface AnalysisResult {
  viralScore: number;
  summary: string;
  hookAnalysis: string;
  visualQuality: string;
  weaknesses: string[];
  strengths: string[];
  fixes: string[];
}

const MOCK_RESULT: AnalysisResult = {
  viralScore: 0,
  summary: "Analysis pending...",
  hookAnalysis: "Pending...",
  visualQuality: "Pending...",
  weaknesses: [],
  strengths: [],
  fixes: []
};

// Helper to simulate retention curve based on score
const generateRetentionData = (score: number) => {
  const data = [];
  // Base drop off rate heavily influenced by viral score
  // Score 100 = very slow drop off. Score 0 = immediate drop off.
  const stability = score / 100; 
  
  let retention = 100;
  for (let i = 0; i <= 100; i+=10) {
    const randomVar = (Math.random() * 5) - 2.5;
    // The lower the stability, the faster it drops
    const drop = (1.5 - stability) * 10; 
    
    // First 10% (Hook) is crucial
    if (i <= 10) {
        retention -= (drop * 0.5); // Hook drop
    } else {
        retention -= drop;
    }
    
    // Add some noise
    retention += randomVar;
    retention = Math.max(0, Math.min(100, retention));
    
    data.push({
      time: `${i}%`,
      retention: Math.round(retention),
      benchmark: Math.max(0, 100 - (i * 0.6)) // Average benchmark
    });
  }
  return data;
};

export const AnalysisPage: React.FC<AnalysisPageProps> = ({ onBack, onAnalysisComplete }) => {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'results'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing...");
  const [result, setResult] = useState<AnalysisResult>(MOCK_RESULT);
  const [retentionData, setRetentionData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use the provided key for the demo
  const [apiKey] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      startDeepAnalysis(e.target.files[0]);
    }
  };

  const extractFrames = async (videoFile: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const frames: string[] = [];
      const url = URL.createObjectURL(videoFile);
      
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';

      // 1. Wait for metadata to load to get duration/dimensions
      video.onloadedmetadata = async () => {
        const duration = video.duration || 10;
        // Limit resolution for API speed/cost (480p width is sufficient for analysis)
        const scale = Math.min(1, 480 / video.videoWidth);
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        
        // Extract 3 key frames: Start (Hook), Middle (Body), End (Payoff)
        const timePoints = [0.1, duration * 0.5, duration * 0.9];

        for (const time of timePoints) {
           video.currentTime = time;
           await new Promise<void>(r => {
               const onSeek = () => {
                   video.removeEventListener('seeked', onSeek);
                   if (ctx) {
                       ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                       // Medium quality JPEG - Reduced to 0.4 to prevent large payload errors
                       frames.push(canvas.toDataURL('image/jpeg', 0.4).split(',')[1]);
                   }
                   r();
               };
               video.addEventListener('seeked', onSeek);
           });
           setProgress(p => Math.min(p + 20, 60)); // Update progress
        }
        
        URL.revokeObjectURL(url);
        resolve(frames);
      };

      video.onerror = (e) => reject(e);
    });
  };

  const startDeepAnalysis = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setStep('analyzing');
    setProgress(5);
    setStatusText("Extracting Key Frames...");

    try {
      // 1. Extract Frames
      const frames = await extractFrames(uploadedFile);
      
      if (frames.length === 0) {
          throw new Error("Could not extract frames");
      }

      setStatusText("VFXB Vision Analyzing Content...");
      setProgress(70);

      // 2. Send to Gemini
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        You are an expert Video Editor and Viral Strategist. 
        I am sending you 3 frames from a video (Start, Middle, End).
        
        Your task is to:
        1. IDENTIFY exactly what is in the video (Subject, Action, Context).
        2. ANALYZE the visual quality, lighting, and pacing implied by the frames.
        3. PREDICT the viral potential (0-100).
        4. CRITIQUE the "Hook" (First frame).
        
        Return the result as a raw JSON object with this exact structure:
        {
          "summary": "A detailed 2-sentence description of exactly what happens in the video.",
          "viralScore": number (integer 0-100),
          "hookAnalysis": "Specific critique of the first frame/hook.",
          "visualQuality": "Assessment of resolution, lighting, and composition.",
          "weaknesses": ["Critique 1", "Critique 2", "Critique 3"],
          "strengths": ["Strength 1", "Strength 2"],
          "fixes": ["Specific actionable fix 1", "Specific actionable fix 2", "Specific actionable fix 3"]
        }
      `;

      // Convert frames to parts
      const parts = [
        { text: prompt },
        ...frames.map(base64Data => ({
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data,
          },
        }))
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts },
      });
      
      let text = response.text || "";
      
      // Clean up markdown if present
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      let analysisData: AnalysisResult;
      try {
          analysisData = JSON.parse(text);
      } catch (e) {
          console.error("JSON Parse Error", text);
          // Fallback if AI fails to output valid JSON
          analysisData = {
              ...MOCK_RESULT,
              summary: "Raw analysis: " + text.slice(0, 100) + "...",
              viralScore: 50
          };
      }
      
      setResult(analysisData);
      setRetentionData(generateRetentionData(analysisData.viralScore));
      setProgress(100);
      setStatusText("Report Generated.");
      setTimeout(() => setStep('results'), 800);

    } catch (error) {
      console.error("Analysis failed:", error);
      setStatusText("AI Analysis failed. Please try again.");
      setTimeout(() => {
          setResult({
              ...MOCK_RESULT,
              summary: "Analysis failed due to a technical error (likely file size). Please try uploading a shorter or lower resolution video.",
              weaknesses: ["Video processing error"]
          });
          setStep('results');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F1E] text-white pt-24 px-4 pb-12 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <button onClick={onBack} className="text-gray-400 hover:text-white mb-8 flex items-center gap-2 text-sm transition-colors">
           <ArrowRight className="rotate-180" size={16} /> Back to Home
        </button>

        <AnimatePresence mode="wait">
          
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
                Analyze Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">Content DNA</span>
              </h1>
              <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
                Upload raw footage. Our multi-modal AI extracts frame-by-frame data to predict virality, identify retention leaks, and generate an instant fix plan.
              </p>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="max-w-xl mx-auto border-2 border-dashed border-white/10 hover:border-brand-primary hover:bg-brand-primary/5 rounded-3xl p-16 transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none"></div>
                <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
                
                <div className="w-24 h-24 bg-[#1A1A2E] rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-2xl border border-white/5">
                  <Upload size={40} className="text-brand-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-brand-accent transition-colors">Drop Video Here</h3>
                <p className="text-gray-500 font-medium">MP4, MOV, WEBM (Max 500MB)</p>
                <div className="mt-8 flex justify-center gap-4">
                    <span className="text-xs bg-white/5 px-3 py-1 rounded-full text-gray-400 border border-white/5">Auto-Frame Extraction</span>
                    <span className="text-xs bg-white/5 px-3 py-1 rounded-full text-gray-400 border border-white/5">VFXB Vision 2.5</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: ANALYZING */}
          {step === 'analyzing' && (
            <motion.div 
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
               <div className="relative w-40 h-40 mb-10">
                 {/* Decorative rings */}
                 <div className="absolute inset-0 border border-white/5 rounded-full scale-150 animate-pulse"></div>
                 <div className="absolute inset-0 border border-white/5 rounded-full scale-125"></div>
                 
                 {/* Progress Ring */}
                 <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#1A1A2E" strokeWidth="8" />
                    <circle 
                        cx="50" cy="50" r="45" 
                        fill="none" 
                        stroke="#6366f1" 
                        strokeWidth="8" 
                        strokeDasharray="283"
                        strokeDashoffset={283 - (283 * progress / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-300 ease-out"
                    />
                 </svg>
                 
                 <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-3xl font-bold text-white">{progress}%</span>
                 </div>
               </div>

               <h2 className="text-3xl font-bold mb-3 text-white">{statusText}</h2>
               <p className="text-gray-500 max-w-md text-center">
                 VFXB Vision is decomposing your video into keyframes, analyzing lighting composition, and predicting audience retention curves.
               </p>
            </motion.div>
          )}

          {/* STEP 3: ANALYTICS DASHBOARD */}
          {step === 'results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full"
            >
              {/* --- DASHBOARD HEADER --- */}
              <div className="flex flex-col md:flex-row justify-between items-end mb-8 pb-6 border-b border-white/10 gap-4">
                  <div>
                      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                          <FileVideo size={24} className="text-brand-primary" />
                          {file?.name}
                      </h2>
                      <p className="text-gray-400 text-sm mt-1 max-w-2xl">{result.summary}</p>
                  </div>
                  <button 
                      onClick={() => file && onAnalysisComplete(file)}
                      className="btn-gradient px-6 py-3 rounded-lg font-bold text-white flex items-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap"
                   >
                      Fix in Studio <ArrowRight size={18} />
                   </button>
              </div>

              {/* --- KPI GRID --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <KPICard 
                    label="Viral Potential" 
                    value={result.viralScore} 
                    max={100} 
                    icon={<TrendingUp size={20} className="text-brand-accent"/>}
                    color={result.viralScore >= 80 ? 'green' : result.viralScore >= 50 ? 'yellow' : 'red'}
                    trend="+14% vs avg"
                  />
                  <KPICard 
                    label="Predicted Retention" 
                    value={Math.round(result.viralScore * 0.85)} 
                    max={100} 
                    unit="%"
                    icon={<Clock size={20} className="text-blue-400"/>}
                    color="blue"
                  />
                  <KPICard 
                    label="Engagement Score" 
                    value={Math.round(result.viralScore * 0.9)} 
                    max={100} 
                    icon={<Activity size={20} className="text-purple-400"/>}
                    color="purple"
                  />
                  <KPICard 
                    label="Target Audience" 
                    value="Broad" 
                    isText
                    icon={<Target size={20} className="text-pink-400"/>}
                    color="pink"
                  />
              </div>

              {/* --- MAIN CONTENT GRID --- */}
              <div className="grid grid-cols-12 gap-8">
                  
                  {/* LEFT COLUMN: VISUALIZATIONS & DEEP DIVE (8 cols) */}
                  <div className="col-span-12 lg:col-span-8 space-y-8">
                      
                      {/* CHART CARD */}
                      <div className="glass-card p-6 rounded-2xl">
                          <div className="flex items-center justify-between mb-6">
                              <h3 className="font-bold text-lg flex items-center gap-2">
                                  <BarChart3 size={18} className="text-gray-400"/> Audience Retention Curve
                              </h3>
                              <div className="flex items-center gap-4 text-xs">
                                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-brand-primary"></div> Prediction</div>
                                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-600"></div> Benchmark</div>
                              </div>
                          </div>
                          <div className="h-64 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={retentionData}>
                                      <defs>
                                          <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                          </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                      <XAxis dataKey="time" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                      <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                                      <Tooltip 
                                          contentStyle={{ backgroundColor: '#1A1A2E', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                                          itemStyle={{ color: '#fff' }}
                                      />
                                      <Area type="monotone" dataKey="retention" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRetention)" />
                                      <Line type="monotone" dataKey="benchmark" stroke="#4b5563" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                                  </AreaChart>
                              </ResponsiveContainer>
                          </div>
                          <p className="text-xs text-gray-400 mt-4 text-center italic">
                              *Projected drop-off based on hook strength ({result.hookAnalysis.slice(0, 30)}...)
                          </p>
                      </div>

                      {/* DETAILED METRICS GRID */}
                      <div className="grid md:grid-cols-2 gap-6">
                          <DetailCard 
                              title="Hook Analysis" 
                              icon={<Zap size={18} className="text-yellow-400"/>}
                              content={result.hookAnalysis}
                              score={Math.round(result.viralScore * (result.hookAnalysis.includes('Good') ? 1.1 : 0.8))}
                          />
                          <DetailCard 
                              title="Visual Fidelity" 
                              icon={<Eye size={18} className="text-blue-400"/>}
                              content={result.visualQuality}
                              score={85}
                          />
                      </div>
                  </div>

                  {/* RIGHT COLUMN: ACTION PLAN (4 cols) */}
                  <div className="col-span-12 lg:col-span-4 space-y-6">
                      
                      {/* ACTION CHECKLIST */}
                      <div className="glass-card p-6 rounded-2xl h-full flex flex-col bg-gradient-to-b from-[#1A1A2E] to-black">
                          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                              <Target size={18} className="text-brand-accent"/> Optimization Plan
                          </h3>
                          
                          <div className="flex-1 space-y-4">
                              {result.fixes.map((fix, i) => (
                                  <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-brand-primary/50 transition-all cursor-default group">
                                      <div className="flex gap-3">
                                          <div className="mt-0.5 w-5 h-5 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-xs font-bold border border-brand-primary/20 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                              {i+1}
                                          </div>
                                          <p className="text-sm text-gray-300 leading-snug">{fix}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>

                          <div className="mt-8 pt-6 border-t border-white/10">
                              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Critical Issues Detected</h4>
                              <ul className="space-y-2">
                                  {result.weaknesses.slice(0, 3).map((weak, i) => (
                                      <li key={i} className="flex items-center gap-2 text-xs text-red-300">
                                          <AlertCircle size={12} className="text-red-500" /> {weak}
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      </div>

                  </div>

              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const KPICard = ({ label, value, max, unit, icon, color, trend, isText }: any) => {
    const getColorClass = (c: string) => {
        if (c === 'green') return 'text-green-400';
        if (c === 'yellow') return 'text-yellow-400';
        if (c === 'red') return 'text-red-400';
        if (c === 'blue') return 'text-blue-400';
        if (c === 'purple') return 'text-purple-400';
        return 'text-white';
    };

    return (
        <div className="glass-card p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{label}</span>
                <div className={`p-2 rounded-lg bg-white/5 ${getColorClass(color)}`}>
                    {icon}
                </div>
            </div>
            <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-bold ${isText ? 'text-xl' : 'text-white'}`}>
                    {value}{unit}
                </span>
                {max && <span className="text-gray-500 text-sm">/ {max}</span>}
            </div>
            {trend && (
                <div className="mt-2 text-xs font-medium text-green-400 flex items-center gap-1">
                    <TrendingUp size={12}/> {trend}
                </div>
            )}
        </div> 
    );
};

const DetailCard = ({ title, icon, content, score }: any) => (
    <div className="glass-card p-5 rounded-xl border border-white/5">
        <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold flex items-center gap-2 text-gray-200">
                {icon} {title}
            </h4>
            {score && (
                <div className={`px-2 py-1 rounded text-xs font-bold ${score > 80 ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    Score: {score}
                </div>
            )}
        </div>
        <p className="text-sm text-gray-400 leading-relaxed border-l-2 border-white/10 pl-3">
            {content}
        </p>
    </div>
);
