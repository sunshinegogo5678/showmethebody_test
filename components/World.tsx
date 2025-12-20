import React from 'react';
import { SectionCard } from './SectionCard';
import { Globe, MapPin } from 'lucide-react';

export const World: React.FC = () => {
  return (
    <div className="animate-fade-in space-y-8 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-['Cinzel'] text-[#d4af37] tracking-widest mb-2">WORLD SETTING</h2>
        <div className="h-px w-24 bg-[#d4af37]/40 mx-auto"></div>
      </div>

      <div className="relative h-64 md:h-80 w-full overflow-hidden border border-[#d4af37]/20 group">
          <img 
            src="https://images.unsplash.com/photo-1517524285303-d6fc683dddf8?q=80&w=2000&auto=format&fit=crop" 
            alt="World Map" 
            className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020f0a] via-transparent to-[#020f0a]"></div>
          <div className="absolute bottom-6 left-6 md:left-10">
              <h3 className="text-2xl font-['Cinzel'] text-[#f9eabb]">The Floating City</h3>
              <p className="text-[#d4af37] text-xs uppercase tracking-[0.3em]">Sector 7 - Neutral Zone</p>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border border-[#d4af37]/10 bg-[#05140e]/50 backdrop-blur-sm hover:border-[#d4af37]/30 transition-colors">
              <MapPin className="text-[#d4af37] mb-4" />
              <h4 className="font-bold text-[#f9eabb] mb-2 font-serif">The Gilded Cage</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                  The central casino floor. A place where fortunes are made and lives are sold. Open 24/7 for those with the golden chip.
              </p>
          </div>
          <div className="p-6 border border-[#d4af37]/10 bg-[#05140e]/50 backdrop-blur-sm hover:border-[#d4af37]/30 transition-colors">
              <MapPin className="text-[#d4af37] mb-4" />
              <h4 className="font-bold text-[#f9eabb] mb-2 font-serif">Black Market</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                  Located in the lower decks. Weapons, information, and rare artifacts can be traded here away from prying eyes.
              </p>
          </div>
          <div className="p-6 border border-[#d4af37]/10 bg-[#05140e]/50 backdrop-blur-sm hover:border-[#d4af37]/30 transition-colors">
              <MapPin className="text-[#d4af37] mb-4" />
              <h4 className="font-bold text-[#f9eabb] mb-2 font-serif">The Penthouse</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                  Reserved for Rank 1 members only. The stakes here aren't just money, but political influence and territory.
              </p>
          </div>
      </div>
    </div>
  );
};