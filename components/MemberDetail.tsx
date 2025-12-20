import React from 'react';
import { CharacterProfile } from '../types';
import { Trophy, Activity, X, Dices, ArrowLeft } from 'lucide-react';

interface MemberDetailProps {
  member: CharacterProfile;
  onBack: () => void;
}

export const MemberDetail: React.FC<MemberDetailProps> = ({ member, onBack }) => {
  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-[#020f0a] animate-fade-in relative">
        {/* Back Button (Mobile/Desktop) */}
        <button 
            onClick={onBack}
            className="absolute top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-all duration-300 uppercase tracking-widest text-xs font-bold group"
        >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to List</span>
        </button>

       {/* LEFT PANEL: Image & Identity (40%) */}
       <div className="relative h-[40vh] md:h-full md:w-5/12 shrink-0 bg-black group overflow-hidden">
          <img 
            src={member.image_url} 
            alt={member.name_kr} 
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700"
          />
          {/* Image Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020f0a] via-transparent to-transparent opacity-90"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#020f0a]/30 via-transparent to-transparent opacity-50"></div>
          
          {/* Content Overlay on Image */}
          <div className="absolute bottom-0 left-0 right-0 p-8 pt-20 bg-gradient-to-t from-[#020f0a] to-transparent">
              <h2 className="text-4xl lg:text-5xl font-['Cinzel'] font-bold text-[#f9eabb] mb-2 drop-shadow-xl leading-none">
                {member.name_kr}
              </h2>
              <p className="text-[#d4af37] text-sm tracking-[0.3em] uppercase mb-4 font-bold drop-shadow-md">
                {member.name_en}
              </p>
              
              <div className="h-px w-12 bg-[#d4af37] mb-4"></div>
              
              <p className="font-['Playfair_Display'] italic text-gray-300 text-lg leading-relaxed text-shadow-sm">
                "{member.quote}"
              </p>
              
              <div className="mt-4 inline-block px-3 py-1 border border-[#d4af37]/30 bg-black/40 text-gray-400 text-xs uppercase tracking-widest">
                {member.role}
              </div>
          </div>
       </div>

       {/* RIGHT PANEL: Stats & Detailed Info (60%) */}
       <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-[#05140e] relative">
           {/* Background Pattern */}
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-[0.05] pointer-events-none"></div>

           <div className="p-8 md:p-12 pt-16 md:pt-12 space-y-8 relative z-10">
               
               {/* Stats Row: Rank / Plays / Win Rate */}
               <div className="grid grid-cols-3 gap-4 border-b border-[#d4af37]/20 pb-8">
                   <div className="text-center group cursor-default">
                       <div className="flex justify-center text-[#d4af37]/50 mb-2 group-hover:text-[#d4af37] transition-colors"><Trophy size={20} /></div>
                       <div className="text-3xl font-['Cinzel'] font-bold text-white mb-1">#{member.rank}</div>
                       <div className="text-[9px] uppercase tracking-[0.2em] text-gray-500">Global Rank</div>
                   </div>
                   <div className="text-center group cursor-default">
                       <div className="flex justify-center text-[#d4af37]/50 mb-2 group-hover:text-[#d4af37] transition-colors"><Dices size={20} /></div>
                       <div className="text-3xl font-['Cinzel'] font-bold text-white mb-1">{member.gamePlays || 0}</div>
                       <div className="text-[9px] uppercase tracking-[0.2em] text-gray-500">Game Plays</div>
                   </div>
                   <div className="text-center group cursor-default">
                       <div className="flex justify-center text-[#d4af37]/50 mb-2 group-hover:text-[#d4af37] transition-colors"><Activity size={20} /></div>
                       <div className="text-3xl font-['Cinzel'] font-bold text-white mb-1">{member.winRate || 0}%</div>
                       <div className="text-[9px] uppercase tracking-[0.2em] text-gray-500">Win Rate</div>
                   </div>
               </div>

               {/* Detailed Text Sections */}
               <div className="space-y-8">
                   <InfoSection title="Appearance" content={member.appearance || ''} />
                   <InfoSection title="Personality" content={member.personality || ''} />
                   
                   {/* Two columns for smaller sections */}
                   <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                       <InfoSection title="Belongings" content={member.belongings ? member.belongings.join(', ') : ''} />
                       <InfoSection title="Other Information" content={member.etc || ''} />
                   </div>
               </div>
               
               {/* Footer decorative line */}
               <div className="pt-8 mt-4 flex justify-center opacity-30">
                   <div className="h-px w-full bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"></div>
               </div>
           </div>
       </div>
    </div>
  );
};

// Helper Component for Info Sections
const InfoSection: React.FC<{ title: string; content: string }> = ({ title, content }) => (
    <div className="group">
        <h4 className="flex items-center gap-3 text-[#d4af37] text-xs font-bold uppercase tracking-[0.25em] mb-3 group-hover:text-[#f9eabb] transition-colors">
            <span className="w-1.5 h-1.5 bg-[#d4af37] rotate-45"></span>
            {title}
        </h4>
        <p className="text-gray-400 font-serif leading-loose text-sm pl-4 border-l border-[#d4af37]/10 group-hover:border-[#d4af37]/30 transition-colors">
            {content}
        </p>
    </div>
);