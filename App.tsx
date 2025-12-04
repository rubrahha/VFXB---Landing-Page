
import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { DashboardPreview } from './components/DashboardPreview';
import { EditorInterface } from './components/EditorInterface';
import { AnalysisPage } from './components/AnalysisPage'; // Import new component
import { Features } from './components/Features';
import { Pricing } from './components/Pricing';
import { Footer } from './components/Footer';
import { AnimatePresence, motion } from 'framer-motion';

// Simple Context for Demo Mode switching
export const DemoContext = React.createContext<{
  view: 'landing' | 'analysis' | 'editor' | 'upload';
  setView: (view: 'landing' | 'analysis' | 'editor' | 'upload') => void;
}>({ view: 'landing', setView: () => {} });

export default function App() {
  const [view, setView] = useState<'landing' | 'analysis' | 'editor' | 'upload'>('landing');
  const [currentVideo, setCurrentVideo] = useState<File | null>(null);

  const handleAnalysisComplete = (file: File) => {
    setCurrentVideo(file);
    setView('editor');
  };

  return (
    <DemoContext.Provider value={{ view, setView }}>
      <div className="min-h-screen bg-[#0F0F1E] text-white font-sans selection:bg-brand-primary selection:text-white">
        
        {/* Only show Navbar if not in full editor mode or upload page */}
        {view !== 'editor' && view !== 'upload' && <Navbar />}
        
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.main
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Hero 
                onStartAnalysis={() => setView('analysis')} // "See How It Works" -> Demo Dashboard
                onOpenEditor={() => setView('upload')}      // "Analyze Your Video" -> Upload/Analysis Page
              />
              <div className="relative z-10">
                <DashboardPreview />
                <Features />
                <Pricing />
              </div>
            </motion.main>
          )}

          {view === 'analysis' && (
             <motion.main
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="pt-24 px-4 md:px-8 pb-12 min-h-screen"
            >
              {/* Full Screen Dashboard View */}
              <DashboardPreview isFullMode={true} />
              <div className="mt-8 text-center">
                <button 
                  onClick={() => setView('landing')}
                  className="text-gray-400 hover:text-white transition-colors text-sm underline"
                >
                  Back to Home
                </button>
              </div>
            </motion.main>
          )}

          {view === 'upload' && (
            <motion.div
               key="upload"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 overflow-y-auto"
            >
               <AnalysisPage 
                  onBack={() => setView('landing')} 
                  onAnalysisComplete={handleAnalysisComplete}
               />
            </motion.div>
          )}

          {view === 'editor' && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50"
            >
              <EditorInterface 
                onBack={() => setView('landing')} 
                initialVideoFile={currentVideo}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {view !== 'editor' && view !== 'upload' && <Footer />}
      </div>
    </DemoContext.Provider>
  );
}
