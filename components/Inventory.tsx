import React from 'react';
import { SectionCard } from './SectionCard';
import { Package, Grid } from 'lucide-react'; // 아이콘 추가

interface InventoryItem {
    id: string;
    name: string;
    count: number;
    desc: string;
    icon: string;
    type?: string; // 타입 추가
}

interface InventoryProps {
    items: InventoryItem[];
    title?: string; // 제목 변경 가능하게
    icon?: React.ReactNode; // 아이콘 변경 가능하게
    className?: string; // 높이 조절용
}

export const Inventory: React.FC<InventoryProps> = ({ 
    items, 
    title = "Inventory", 
    icon = <Package size={16}/>,
    className
}) => {
    // 안전장치
    const safeItems = items || [];

    // 빈 슬롯 채우기 (디자인 유지용, 최소 1줄은 보이게)
    const minSlots = 5;
    const emptySlots = Math.max(0, minSlots - safeItems.length);

    return (
        <SectionCard title={title} className={`h-full ${className}`} icon={icon}>
            <div className="space-y-1">
                {/* 헤더 */}
                <div className="flex justify-between text-[10px] text-[#d4af37]/60 uppercase tracking-widest px-2 pb-2 border-b border-[#d4af37]/10 mb-2">
                    <span>Item Name</span>
                    <span>Qty</span>
                </div>

                {/* 아이템 목록 */}
                <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {safeItems.length === 0 && (
                        <div className="text-center py-4 text-gray-600 italic text-xs">
                            Empty.
                        </div>
                    )}
                    
                    {safeItems.map((item) => (
                        <div key={item.id} className="group flex justify-between items-center p-2 rounded bg-[#020f0a] border border-[#d4af37]/10 hover:border-[#d4af37]/30 transition-all">
                            <div className="flex items-center gap-3">
                                {/* 아이콘/이미지 */}
                                <div className="w-8 h-8 bg-black/50 rounded border border-[#d4af37]/20 flex items-center justify-center overflow-hidden">
                                    {item.icon.startsWith('http') ? (
                                        <img src={item.icon} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                                    ) : (
                                        <span className="text-lg">{item.icon}</span>
                                    )}
                                </div>
                                <div>
                                    <div className="text-[#d4af37] text-xs font-bold group-hover:text-[#f9eabb]">{item.name}</div>
                                    <div className="text-[10px] text-gray-600 truncate max-w-[120px]">{item.desc}</div>
                                </div>
                            </div>
                            <span className="font-mono text-[#d4af37] text-xs bg-[#d4af37]/10 px-1.5 py-0.5 rounded">
                                x{item.count}
                            </span>
                        </div>
                    ))}

                    {/* 빈 슬롯 (비주얼용) */}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-10 border border-dashed border-[#d4af37]/5 rounded bg-transparent"></div>
                    ))}
                </div>
            </div>
        </SectionCard>
    );
};