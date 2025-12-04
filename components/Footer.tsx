import React from 'react';
import { Twitter, Instagram, Youtube, Github } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black/40 border-t border-white/5 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="col-span-1 md:col-span-1">
             <div className="flex items-center gap-2 mb-4 group">
              <div className="relative w-8 h-8 flex items-center justify-center">
                 <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 8L32 20L8 32V8Z" fill="url(#logo_gradient_footer)" />
                    <defs>
                      <linearGradient id="logo_gradient_footer" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                 </svg>
              </div>
              <span className="font-black text-xl text-white font-sans tracking-tight">VFXB</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              The first AI-powered video editing platform that predicts virality. Built for creators, by creators.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-brand-accent transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">Viral Predictor</a></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">API</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-brand-accent transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">Success Stories</a></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">Community</a></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">Help Center</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-brand-accent transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">Security</a></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs">© 2024 VFXB Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <SocialIcon icon={<Twitter size={18} />} />
            <SocialIcon icon={<Instagram size={18} />} />
            <SocialIcon icon={<Youtube size={18} />} />
            <SocialIcon icon={<Github size={18} />} />
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon = ({ icon }: { icon: React.ReactNode }) => (
  <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-brand-primary hover:text-white transition-all">
    {icon}
  </a>
);