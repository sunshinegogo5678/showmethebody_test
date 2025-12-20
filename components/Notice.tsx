import React from 'react';
import { SectionCard } from './SectionCard';
import { Bell, AlertCircle } from 'lucide-react';

export const Notice: React.FC = () => {
  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-['Cinzel'] text-[#d4af37] tracking-widest mb-2">OFFICIAL NOTICE</h2>
        <div className="h-px w-24 bg-[#d4af37]/40 mx-auto"></div>
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <SectionCard key={i} className="hover:bg-[#d4af37]/5 transition-colors cursor-pointer" noPadding>
             <div className="p-6 flex gap-4">
                 <div className="shrink-0 pt-1 text-[#d4af37]">
                     {i === 1 ? <AlertCircle size={24} /> : <Bell size={24} />}
                 </div>
                 <div className="flex-1">
                     <div className="flex items-center justify-between mb-2">
                         <span className="px-2 py-0.5 border border-[#d4af37]/30 text-[10px] uppercase text-[#d4af37] tracking-widest rounded-sm">
                             {i === 1 ? 'Important' : 'Update'}
                         </span>
                         <span className="text-gray-500 font-mono text-xs">2023.10.2{4-i}</span>
                     </div>
                     <h3 className="text-[#f9eabb] font-serif text-lg mb-2">
                         {i === 1 ? 'Emergency Maintenance: High-Stakes Floor' : 
                          i === 2 ? 'New Slot Machines "Golden Pharoah" Arrived' : 
                          'System Update v3.0 Patch Notes'}
                     </h3>
                     <p className="text-gray-400 text-sm line-clamp-2">
                         {i === 1 ? 'The high-stakes floor will be undergoing maintenance for security upgrades. Please withdraw your credits before 03:00 AM.' :
                          'Experience the new thrill with our latest machines installed in the East Wing.'}
                     </p>
                 </div>
             </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
};