import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CharacterProfile } from '../types';
import { X, User, Briefcase, Ruler, Fingerprint, Users, Lock, Gift } from 'lucide-react';
import { GiftTransactionModal } from './GiftTransactionModal';
import { MOCK_PROFILE } from '../constants';

interface MemberDetailModalProps {
  member: CharacterProfile;
  onClose: () => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ member, onClose }) => {
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Determine Current User ID to hide Gift button for self
    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);
        else setCurrentUserId(MOCK_PROFILE.id); // Fallback for demo
    };
    checkUser();
  }, []);

  const isSelf = currentUserId === member.id;

  // [수정] 전신 이미지 우선 사용 (없으면 기존 이미지)
  // CharacterProfile 타입에 full_image_url이 아직 없을 수 있으므로 any로 처리
  const displayImage = (member as any).full_image_url || member.image_url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div 
        className="relative w-full max-w-4xl h-[90vh] md:h-[80vh] bg-[#020f0a] border border-[#d4af37] shadow-[0_0_50px_rgba(212,175,55,0.15)] flex flex-col md:flex-row overflow-hidden group"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Decorative Corner Accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#d4af37] z-20"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#d4af37] z-20"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#d4af37] z-20"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#d4af37] z-20"></div>

        {/* Close Button */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 text-[#d4af37]/60 hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition-all border border-transparent hover:border-[#d4af37]/30"
        >
            <X size={24} />
        </button>

        {/* LEFT: Image & Identity (Mobile: Top, Desktop: Left) */}
        <div className="w-full md:w-5/12 h-64 md:h-full relative shrink-0 bg-[#05140e]">
            {/* [수정] displayImage 변수 사용 */}
            <img 
                src={displayImage} 
                alt={member.name_kr} 
                className="w-full h-full object-cover grayscale-[20%] opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020f0a] via-transparent to-transparent"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20 mix-blend-overlay"></div>
            
            {/* Identity Badge */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#020f0a] to-transparent pt-20">
                <div className="flex items-end justify-between mb-2">
                     <h2 className="text-3xl md:text-4xl font-['Cinzel'] font-bold text-[#f9eabb] leading-none drop-shadow-md">
                        {member.name_kr}
                     </h2>
                     <span className="text-4xl font-['Cinzel'] font-bold text-[#d4af37] opacity-30 select-none">#{member.rank}</span>
                </div>
                <p className="text-[#d4af37] text-xs font-bold tracking-[0.3em] uppercase mb-4">
                    {member.name_en}
                </p>
                <div className="flex gap-2 text-[10px] text-gray-400 font-mono border-t border-[#d4af37]/20 pt-3">
                    <span className="uppercase text-[#d4af37]">{member.role}</span>
                    <span>•</span>
                    <span>AGE: {member.age || 'UNKNOWN'}</span>
                </div>

                {/* GIFT BUTTON (Only if not self) */}
                {!isSelf && currentUserId && (
                    <button 
                        onClick={() => setShowGiftModal(true)}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-[#d4af37]/10 border border-[#d4af37] text-[#d4af37] font-bold uppercase tracking-[0.2em] text-xs hover:bg-[#d4af37] hover:text-black transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                    >
                        <Gift size={16} /> Send Gift
                    </button>
                )}
            </div>
        </div>

        {/* RIGHT: Detailed Info */}
        <div className="flex-1 flex flex-col h-full bg-[#020f0a] relative overflow-hidden">
             {/* Header Quote */}
             <div className="shrink-0 p-6 border-b border-[#d4af37]/20 bg-[#05140e]/30">
                 <p className="font-['Playfair_Display'] italic text-gray-300 text-lg md:text-xl text-center leading-relaxed px-4">
                    "{member.quote || 'No comment provided.'}"
                 </p>
             </div>

             {/* Scrollable Content */}
             <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 relative">
                {/* Background Texture */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/lined-paper-2.png')]"></div>

                {/* 1. Basic Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border border-[#d4af37]/10 bg-[#d4af37]/5 flex items-center gap-3">
                        <Ruler className="text-[#d4af37] shrink-0" size={18} />
                        <div>
                            <p className="text-[9px] uppercase text-[#d4af37]/60 tracking-widest">Height / Weight</p>
                            <p className="text-gray-300 font-serif text-sm">
                                {member.height || '?'}cm / {member.weight || '?'}kg
                            </p>
                        </div>
                    </div>
                    <div className="p-3 border border-[#d4af37]/10 bg-[#d4af37]/5 flex items-center gap-3">
                        <Briefcase className="text-[#d4af37] shrink-0" size={18} />
                        <div>
                            <p className="text-[9px] uppercase text-[#d4af37]/60 tracking-widest">Assignment</p>
                            <p className="text-gray-300 font-serif text-sm truncate">
                                {member.role}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Detailed Text Sections */}
                <DetailSection icon={<User size={16}/>} title="Appearance" content={member.appearance} />
                <DetailSection icon={<Fingerprint size={16}/>} title="Personality Analysis" content={member.personality} />
                <DetailSection icon={<Users size={16}/>} title="Known Connections" content={member.relationships} />
                
                {/* 3. Belongings */}
                {member.belongings && member.belongings.length > 0 && (
                     <div className="border-t border-[#d4af37]/20 pt-6">
                        <h4 className="flex items-center gap-2 text-[#d4af37] text-xs font-bold uppercase tracking-[0.2em] mb-4">
                            <Lock size={14} /> Key Inventory
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            {member.belongings.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-2 border border-[#d4af37]/10 bg-black/40">
                                    <div className="w-1.5 h-1.5 bg-[#d4af37] rotate-45"></div>
                                    <span className="text-gray-300 text-sm font-serif italic">{item}</span>
                                </div>
                            ))}
                        </div>
                     </div>
                )}
             </div>

             {/* Footer Stamp */}
             <div className="shrink-0 p-2 text-right border-t border-[#d4af37]/10">
                 <span className="text-[9px] uppercase tracking-[0.3em] text-[#d4af37]/30 font-mono">
                     Classified Level 5 • Eyes Only
                 </span>
             </div>
        </div>
      </div>

      {/* Gift Transaction Modal */}
      {showGiftModal && currentUserId && (
          <GiftTransactionModal 
            senderId={currentUserId}
            receiver={member}
            onClose={() => setShowGiftModal(false)}
          />
      )}
    </div>
  );
};

const DetailSection: React.FC<{ icon: React.ReactNode, title: string, content?: string }> = ({ icon, title, content }) => {
    if (!content) return null;
    return (
        <div className="group">
            <h4 className="flex items-center gap-2 text-[#d4af37] text-xs font-bold uppercase tracking-[0.2em] mb-2 group-hover:text-[#f9eabb] transition-colors">
                {icon} {title}
            </h4>
            <div className="pl-6 border-l border-[#d4af37]/20 group-hover:border-[#d4af37]/50 transition-colors">
                <p className="text-gray-400 font-serif text-sm leading-relaxed whitespace-pre-wrap">
                    {content}
                </p>
            </div>
        </div>
    );
};