import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CharacterProfile } from '../types';
import { Trophy, Dices, Search, Loader2 } from 'lucide-react';
import { MemberDetailModal } from './MemberDetailModal';
import { MOCK_PROFILE } from '../constants';

interface MembersProps {
    onMemberSelect?: (member: CharacterProfile) => void;
}

export const Members: React.FC<MembersProps> = () => {
  const [members, setMembers] = useState<CharacterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<CharacterProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
      fetchMembers();
  }, []);

  const fetchMembers = async () => {
      setLoading(true);
      try {
          const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .order('rank', { ascending: true });

          if (error) throw error;
          if (data) setMembers(data as CharacterProfile[]);
      } catch (e) {
          console.warn("Failed to fetch members (Demo Mode). Using mock + self.");
          setMembers([MOCK_PROFILE]); 
      } finally {
          setLoading(false);
      }
  };

  const filteredMembers = members.filter(m => 
      m.name_kr.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6 relative max-w-7xl mx-auto w-full flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 shrink-0">
         <div className="text-center md:text-left">
            <h2 className="text-3xl font-['Cinzel'] text-[#d4af37] tracking-widest">SOCIETY MEMBERS</h2>
            <div className="h-px w-24 bg-[#d4af37]/40 md:mx-0 mx-auto mt-2"></div>
         </div>
         <div className="relative w-full md:w-64">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Search size={14} className="text-[#d4af37]/50" />
             </div>
             <input 
                 type="text" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full bg-[#05140e] border border-[#d4af37]/20 rounded-full py-2 pl-10 pr-4 text-xs text-[#f9eabb] focus:outline-none focus:border-[#d4af37] placeholder-[#d4af37]/30 transition-all"
                 placeholder="Find Agent..."
             />
         </div>
      </div>

      {loading && (
          <div className="flex-1 flex items-center justify-center text-[#d4af37]">
              <Loader2 className="animate-spin" size={32} />
          </div>
      )}

      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 flex-1 content-start overflow-y-auto custom-scrollbar pb-20">
            {filteredMembers.map((member) => (
            <div key={member.id} onClick={() => setSelectedMember(member)} className="cursor-pointer group perspective">
                {/* [수정] aspect ratio를 3/4로 변경하여 크롭 이미지와 비율 일치시킴 */}
                <div className="relative aspect-[3/4] w-full bg-[#020f0a] border border-[#d4af37]/20 group-hover:border-[#d4af37] overflow-hidden shadow-lg transition-all duration-300 transform group-hover:-translate-y-1">
                    
                    <img 
                        src={member.image_url} 
                        alt={member.name_kr} 
                        className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-in-out" 
                    />
                    
                    <div className="absolute inset-2 border border-[#d4af37]/10 pointer-events-none group-hover:border-[#d4af37]/40 transition-colors z-10"></div>
                    <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#d4af37] opacity-50"></div>
                    <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[#d4af37] opacity-50"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 z-0"></div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 text-center z-20">
                        <div className="mb-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                            <h3 className="font-['Cinzel'] text-[#f9eabb] text-lg font-bold truncate drop-shadow-md">
                                {member.name_kr}
                            </h3>
                            <p className="text-[#d4af37] text-[9px] uppercase tracking-[0.2em] truncate opacity-70 group-hover:opacity-100 transition-opacity">
                                {member.name_en}
                            </p>
                        </div>
                        
                        <div className="flex justify-center items-center gap-3 border-t border-[#d4af37]/20 pt-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-gray-400 text-[9px] uppercase font-mono truncate max-w-[80px]">{member.role}</span>
                            <div className="flex items-center gap-1 text-[#d4af37]">
                                <Trophy size={10} />
                                <span className="text-[10px] font-bold">#{member.rank}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            ))}
        </div>
      )}

      {selectedMember && (
          <MemberDetailModal 
            member={selectedMember} 
            onClose={() => setSelectedMember(null)} 
          />
      )}
    </div>
  );
};