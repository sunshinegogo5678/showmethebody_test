import React from 'react';
import { SectionCard } from './SectionCard';
import { Radio } from 'lucide-react';

// 혹시 모를 props 인터페이스 (데이터가 들어올 경우 대비)
interface RadioNoteProps {
    messages?: string[];
}

export const RadioNote: React.FC<RadioNoteProps> = ({ messages }) => {
    // ✅ 안전장치
    const safeMessages = messages || [];

    return (
        <SectionCard title="Radio Frequency" className="h-full" icon={<Radio size={16}/>}>
            <div className="h-full flex flex-col justify-center items-center text-center p-4 min-h-[150px]">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent mb-4"></div>
                
                {safeMessages.length > 0 ? (
                    // 메시지가 있을 때 리스트 출력
                    <div className="space-y-2 w-full">
                        {safeMessages.map((msg, idx) => (
                            <p key={idx} className="text-[#d4af37] font-mono text-xs animate-pulse">
                                "{msg}"
                            </p>
                        ))}
                    </div>
                ) : (
                    // 메시지가 없을 때 (기본 상태)
                    <>
                        <p className="text-[#d4af37] font-mono text-xs animate-pulse mb-2">
                            CONNECTING TO ENCRYPTED CHANNEL...
                        </p>
                        <p className="text-[10px] text-gray-600 uppercase tracking-widest">
                            Waiting for Admin Broadcast
                        </p>
                    </>
                )}
                
                <div className="w-full h-px bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent mt-4"></div>
            </div>
        </SectionCard>
    );
};