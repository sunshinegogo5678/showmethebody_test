
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Spade, Heart, Club, Diamond, ArrowRight, Lock, Dices, Mail, User } from 'lucide-react';
import { SectionCard } from './SectionCard';

interface LoginPageProps {
  onLogin: () => void;
  onDemoLogin?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onDemoLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
        if (isSignUp) {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) throw error;
            alert("Registration successful! Please check your email or login directly.");
            setIsSignUp(false); // Switch back to login
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            // App.tsx auth listener will handle the transition
            onLogin(); 
        }
    } catch (error: any) {
        if (error.message === 'Failed to fetch') {
            setErrorMsg("Server connection failed. Check your network or use Guest Login.");
        } else {
            setErrorMsg("Authentication failed: " + error.message);
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] w-full px-4 relative z-10 animate-fade-in-up">
      
      {/* Brand Logo Area */}
      <div className="mb-12 text-center relative group">
         {/* Back Glow */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#d4af37] blur-[100px] opacity-10 rounded-full"></div>
         
         <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6 transform transition-transform duration-700 hover:scale-105">
            <div className="absolute inset-0 border border-[#d4af37]/30 rotate-45 backdrop-blur-sm bg-[#051b11]/30"></div>
            <div className="absolute inset-2 border border-[#d4af37]/60 rotate-45"></div>
            
            <div className="relative z-10 text-[#d4af37] drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                <Spade size={48} fill="currentColor" className="opacity-90" />
            </div>
         </div>
         
         <h1 className="text-4xl md:text-5xl font-['Cinzel'] font-black text-transparent bg-clip-text bg-gradient-to-b from-[#f9eabb] via-[#d4af37] to-[#8a7018] drop-shadow-2xl tracking-tight leading-tight uppercase">
            Show me<br/>the body
         </h1>
         <div className="flex items-center justify-center gap-3 mt-4">
             <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#d4af37]/60"></div>
             <p className="text-[#d4af37]/80 font-serif tracking-[0.3em] text-[10px] uppercase">
                High Stakes Society
             </p>
             <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#d4af37]/60"></div>
         </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[420px]">
        <SectionCard className="border-[#d4af37]/20 shadow-2xl bg-[#020f0a]/80" noPadding>
          <div className="p-10">
            {/* Suit Icons Decoration */}
            <div className="flex justify-center gap-8 mb-10 opacity-30">
                <Heart size={14} fill="currentColor" className="text-[#d4af37]" />
                <Club size={14} fill="currentColor" className="text-[#d4af37]" />
                <Diamond size={14} fill="currentColor" className="text-[#d4af37]" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 group">
                <label className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]/60 font-medium ml-1 transition-colors group-focus-within:text-[#d4af37]">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none">
                    <Mail size={18} className="text-[#d4af37]/40 group-focus-within:text-[#d4af37] transition-colors duration-300" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-8 pr-3 py-2 bg-transparent border-b border-[#d4af37]/20 text-[#f9eabb] placeholder-[#d4af37]/20 focus:outline-none focus:border-[#d4af37] focus:shadow-[0_4px_12px_-4px_rgba(212,175,55,0.3)] transition-all duration-300 font-serif tracking-wider"
                    placeholder="agent@casino.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]/60 font-medium ml-1 transition-colors group-focus-within:text-[#d4af37]">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none">
                    <Lock size={18} className="text-[#d4af37]/40 group-focus-within:text-[#d4af37] transition-colors duration-300" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-8 pr-3 py-2 bg-transparent border-b border-[#d4af37]/20 text-[#f9eabb] placeholder-[#d4af37]/20 focus:outline-none focus:border-[#d4af37] focus:shadow-[0_4px_12px_-4px_rgba(212,175,55,0.3)] transition-all duration-300 font-serif tracking-wider"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {errorMsg && (
                  <p className="text-red-500 text-xs text-center bg-red-900/10 p-2 border border-red-500/20">{errorMsg}</p>
              )}

              <div className="pt-6 space-y-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative overflow-hidden group bg-[#d4af37] text-[#051b11] font-bold py-3.5 px-4 transition-all duration-500 transform hover:translate-y-[-1px] shadow-[0_4px_20px_rgba(212,175,55,0.15)] hover:shadow-[0_8px_25px_rgba(212,175,55,0.3)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-[#f9eabb] via-[#d4af37] to-[#b4941f] opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex items-center justify-center gap-3">
                     <span className={`uppercase tracking-[0.25em] text-xs font-black ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                        {isSignUp ? 'Register' : 'Login'}
                     </span>
                     {!isLoading && <ArrowRight size={14} strokeWidth={3} />}
                  </div>
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                        <Dices className="animate-spin text-[#051b11]" size={18} />
                    </div>
                  )}
                  <div className="absolute top-0 -inset-full h-full w-1/2 z-20 block transform -skew-x-12 bg-white/30 group-hover:animate-shine" />
                </button>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="w-full relative overflow-hidden group bg-transparent border border-[#d4af37]/30 text-[#d4af37] font-bold py-3 px-2 transition-all duration-300 hover:bg-[#d4af37]/10"
                    >
                        <span className="uppercase tracking-[0.1em] text-[10px] font-medium">
                        {isSignUp ? 'Back to Login' : 'New Agent Register'}
                        </span>
                    </button>
                    {onDemoLogin && (
                        <button
                            type="button"
                            onClick={onDemoLogin}
                            className="w-full relative overflow-hidden group bg-transparent border border-[#d4af37]/30 text-gray-400 font-bold py-3 px-2 transition-all duration-300 hover:bg-[#d4af37]/10 hover:text-[#d4af37] flex items-center justify-center gap-2"
                        >
                            <User size={12}/>
                            <span className="uppercase tracking-[0.1em] text-[10px] font-medium">
                                Guest Login
                            </span>
                        </button>
                    )}
                </div>
              </div>
            </form>
          </div>
        </SectionCard>
      </div>

      <div className="mt-16 text-[#d4af37]/20 text-[9px] uppercase tracking-[0.4em] font-mono text-center select-none">
        <p>Show me the body System v3.1 • Secured</p>
      </div>
    </div>
  );
};
