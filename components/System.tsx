import React from 'react';
import { SectionCard } from './SectionCard';
import { Scale, Shield, FileText } from 'lucide-react';

export const System: React.FC = () => {
  return (
    <div className="animate-fade-in space-y-6 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-['Cinzel'] text-[#d4af37] tracking-widest mb-2">SYSTEM & RULES</h2>
        <div className="h-px w-24 bg-[#d4af37]/40 mx-auto"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SectionCard title="Fair Play Policy" className="h-full">
             <div className="flex flex-col items-center text-center gap-4 py-4">
                <Scale size={48} className="text-[#d4af37]/40" />
                <p className="text-gray-300 text-sm font-serif leading-relaxed">
                    All games within "Show me the body" utilize a provably fair algorithm. Any attempt to manipulate RNG or exploit system vulnerabilities will result in immediate termination of membership and seizure of assets.
                </p>
             </div>
          </SectionCard>

          <SectionCard title="Security Protocol" className="h-full">
             <div className="flex flex-col items-center text-center gap-4 py-4">
                <Shield size={48} className="text-[#d4af37]/40" />
                <p className="text-gray-300 text-sm font-serif leading-relaxed">
                    Your identity is encrypted with military-grade cipher. Transactions are anonymous but traceable by the administration for dispute resolution. Share your private key with no one.
                </p>
             </div>
          </SectionCard>

          <SectionCard title="Betting Limits" className="md:col-span-2">
             <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="shrink-0">
                    <FileText size={48} className="text-[#d4af37]/40" />
                </div>
                <div className="text-left space-y-4 text-sm font-serif text-gray-300">
                    <p><strong>Standard Table:</strong> Max bet 5,000 Chips.</p>
                    <p><strong>VIP Room:</strong> Min bet 10,000 Chips - No Maximum.</p>
                    <p className="text-xs text-gray-500 italic">* Limits may be adjusted based on Member Rank.</p>
                </div>
             </div>
          </SectionCard>
      </div>
    </div>
  );
};