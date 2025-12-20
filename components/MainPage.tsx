import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { MainPagePost } from './MainPagePost';
import { MainPagePre } from './MainPagePre';
import { CharacterProfile } from '../types';

interface MainPageProps {
    profile: CharacterProfile;
    onNavigate: (tab: any) => void;
}

export const MainPage: React.FC<MainPageProps> = ({ profile, onNavigate }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSystemStatus();
    }, []);

    const checkSystemStatus = async () => {
        try {
            const { data, error } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'is_open')
                .single();

            if (data && data.value === 'true') {
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }
        } catch (e) {
            console.error('System check failed:', e);
            setIsOpen(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black" />;

    return isOpen ? (
        <MainPagePost profile={profile} onNavigate={onNavigate} />
    ) : (
        <MainPagePre profile={profile} onNavigate={onNavigate} />
    );
};