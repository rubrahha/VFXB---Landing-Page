import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

export const Pricing: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 relative z-10">
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent pointer-events-none"></div>
       
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">Simple Pricing, <span className="text-gradient">Viral Results</span></h2>
          
          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${!isAnnual ? 'text-white font-medium' : 'text-gray-400'}`}>Monthly</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-7 bg-white/10 rounded-full p-1 transition-colors hover:bg-white/20"
            >
              <div className={`w-5 h-5 bg-brand-primary rounded-full shadow-md transform transition-transform duration-300 ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`}></div>
            </button>
            <span className={`text-sm ${isAnnual ? 'text-white font-medium' : 'text-gray-400'}`}>
              Yearly <span className="text-xs text-brand-accent font-bold ml-1">(Save 20%)</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <PricingCard 
            tier="Starter" 
            price={isAnnual ? 15 : 19.99} 
            features={['50 AI Video Edits', 'Basic Analytics', '5 Competitor Tracks', '1 User Seat']}
          />
          <PricingCard 
            tier="Pro" 
            price={isAnnual ? 39 : 49.99} 
            isPopular 
            features={['500 AI Video Edits', 'Advanced Retention Analytics', '50 Competitor Tracks', 'Custom Workflows', 'Priority Support']}
          />
          <PricingCard 
            tier="Agency" 
            price={isAnnual ? 119 : 149.99} 
            features={['Unlimited Edits', 'White-label Reports', 'API Access', 'Dedicated Manager', 'Team Collaboration']}
          />
        </div>
       </div>
    </section>
  );
};

const PricingCard = ({ tier, price, features, isPopular }: { tier: string, price: number, features: string[], isPopular?: boolean }) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className={`relative glass-card rounded-2xl p-8 transition-all ${isPopular ? 'border-brand-primary/50 shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]' : 'border-white/10'}`}
  >
    {isPopular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-purple-500/40">
        MOST POPULAR
      </div>
    )}
    <h3 className="text-xl font-medium text-gray-300 mb-2">{tier}</h3>
    <div className="flex items-baseline mb-6">
      <span className="text-4xl font-bold text-white">${price}</span>
      <span className="text-gray-400 ml-2 text-sm">/month</span>
    </div>
    
    <button className={`w-full py-3 rounded-lg font-bold mb-8 transition-all ${isPopular ? 'btn-gradient text-white hover:shadow-lg hover:shadow-purple-500/25' : 'bg-white/10 text-white hover:bg-white/20'}`}>
      Get Started
    </button>

    <ul className="space-y-4">
      {features.map((feat, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
          <Check className="w-5 h-5 text-brand-primary flex-shrink-0" />
          <span>{feat}</span>
        </li>
      ))}
    </ul>
  </motion.div>
);