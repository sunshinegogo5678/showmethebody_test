import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { SectionCard } from './SectionCard';
import { CharacterProfile } from '../types';
import { Save, ChevronRight, ChevronLeft, Upload, Loader, X, Check, ZoomIn } from 'lucide-react';
import Cropper from 'react-easy-crop'; 

const DEFAULT_AVATAR_URL = '/default_avatar.png';
const DRAFT_STORAGE_KEY = 'profile_creation_draft';

// --- [Helper] 이미지 유틸리티 ---
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('No 2d context');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}

// [수정된 함수] const -> let 변경
function dataURLtoBlob(dataurl: string) {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length; // 여기가 let이어야 합니다!
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

interface ProfileFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<CharacterProfile>;
  onComplete: () => void;
  onCancel?: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ mode, initialData, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Crop States
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CharacterProfile> & { full_image_url?: string | null }>(initialData || {
    name_kr: '',
    name_en: '',
    age: 25,
    role: 'New Agent',
    quote: '',
    appearance: '',
    height: '',
    weight: '',
    personality: '',
    belongings: [],
    relationships: '',
    image_url: null,
    full_image_url: null, 
  });

  useEffect(() => {
    if (mode === 'create') {
        const savedDraft = sessionStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
            try {
                setFormData(prev => ({ ...prev, ...JSON.parse(savedDraft) }));
            } catch (e) {
                console.error("Failed to load draft", e);
            }
        }
    }
  }, [mode]);

  useEffect(() => {
      if (mode === 'create') {
          sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
      }
  }, [formData, mode]);

  const displayImage = formData.image_url || DEFAULT_AVATAR_URL;

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBelongingChange = (val: string) => {
      const items = val.split(',').map(s => s.trim()).filter(s => s !== '');
      setFormData(prev => ({ ...prev, belongings: items }));
  };

  const onSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setTempImageSrc(reader.result?.toString() || '');
        setIsCropModalOpen(true);
        setZoom(1);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const uploadImages = async () => {
    try {
      if (!tempImageSrc || !croppedAreaPixels) return;
      setUploading(true);

      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);

      // 1. 원본 업로드
      const originalBlob = dataURLtoBlob(tempImageSrc);
      const originalFileName = `full_${timestamp}_${randomStr}.jpg`;
      
      const { error: originalError } = await supabase.storage
        .from('avatars')
        .upload(originalFileName, originalBlob, { contentType: 'image/jpeg' });
        
      if (originalError) throw originalError;
      
      const { data: { publicUrl: originalPublicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(originalFileName);

      // 2. 크롭 업로드
      const croppedBlob = await getCroppedImg(tempImageSrc, croppedAreaPixels);
      const croppedFileName = `crop_${timestamp}_${randomStr}.jpg`;

      const { error: cropError } = await supabase.storage
        .from('avatars')
        .upload(croppedFileName, croppedBlob, { contentType: 'image/jpeg' });

      if (cropError) throw cropError;

      const { data: { publicUrl: cropPublicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(croppedFileName);

      // 3. 데이터 적용
      setFormData(prev => ({
          ...prev,
          image_url: cropPublicUrl,
          full_image_url: originalPublicUrl 
      }));

      setIsCropModalOpen(false);
      setTempImageSrc(null);

    } catch (error: any) {
      alert('Error uploading images: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { alert("로그인이 필요합니다."); return; }

        const { isAdmin, coin, ...safeFormData } = formData as any;
        
        const profilePayload: any = {
            id: user.id, 
            ...safeFormData,
            image_url: formData.image_url || DEFAULT_AVATAR_URL,
            full_image_url: formData.full_image_url || formData.image_url, 
            updated_at: new Date().toISOString()
        };

        if (mode === 'create') profilePayload.coin = 500;

        const { error } = await supabase.from('profiles').upsert(profilePayload);
        if (error) throw error;
        
        if (mode === 'create') sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        onComplete();
    } catch (error: any) {
        alert("Error saving profile: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleCancel = () => {
      if (mode === 'create') sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      if (onCancel) onCancel();
  };

  const renderStep1 = () => (
      <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col items-center justify-center mb-6">
              <div className="relative w-32 h-[170px] mb-4 group"> 
                  <div className="w-full h-full rounded-xl border-2 border-[#d4af37] overflow-hidden bg-black relative shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                      {uploading ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                             <Loader className="animate-spin text-[#d4af37]" />
                          </div>
                      ) : null}
                      <img src={displayImage} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-[#d4af37] text-black p-2 rounded-full cursor-pointer hover:bg-[#f9eabb] transition-colors shadow-lg z-20">
                      <Upload size={16} />
                  </label>
                  <input 
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={onSelectFile}
                    className="hidden"
                    disabled={uploading}
                  />
              </div>
              <p className="text-[10px] text-[#d4af37]/70 uppercase tracking-widest">Upload Agent Photo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                  <label className="text-[10px] uppercase text-[#d4af37]">Code Name (KR)</label>
                  <input 
                    type="text" 
                    value={formData.name_kr || ''} 
                    onChange={e => handleChange('name_kr', e.target.value)}
                    className="w-full bg-[#020f0a] border border-[#d4af37]/30 p-2 text-[#f9eabb] focus:border-[#d4af37] outline-none"
                    placeholder="존 스미스" 
                  />
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] uppercase text-[#d4af37]">Alias (EN)</label>
                  <input 
                    type="text" 
                    value={formData.name_en || ''} 
                    onChange={e => handleChange('name_en', e.target.value)}
                    className="w-full bg-[#020f0a] border border-[#d4af37]/30 p-2 text-[#f9eabb] focus:border-[#d4af37] outline-none"
                    placeholder="John Smith"
                  />
              </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                  <label className="text-[10px] uppercase text-[#d4af37]">Age</label>
                  <input 
                    type="number" 
                    value={formData.age || ''} 
                    onChange={e => handleChange('age', parseInt(e.target.value))}
                    className="w-full bg-[#020f0a] border border-[#d4af37]/30 p-2 text-[#f9eabb] focus:border-[#d4af37] outline-none"
                  />
              </div>
               <div className="col-span-2 space-y-2">
                  <label className="text-[10px] uppercase text-[#d4af37]">Position</label>
                  <input 
                    type="text" 
                    value={formData.role || ''} 
                    onChange={e => handleChange('role', e.target.value)}
                    className="w-full bg-[#020f0a] border border-[#d4af37]/30 p-2 text-[#f9eabb] focus:border-[#d4af37] outline-none"
                    placeholder="T"
                  />
              </div>
          </div>
      </div>
  );

  const renderStep2 = () => (
      <div className="space-y-6 animate-fade-in">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <label className="text-[10px] uppercase text-[#d4af37]">Height</label>
                  <input 
                    type="text" 
                    value={formData.height || ''} 
                    onChange={e => handleChange('height', e.target.value)}
                    className="w-full bg-[#020f0a] border border-[#d4af37]/30 p-2 text-[#f9eabb] focus:border-[#d4af37] outline-none"
                    placeholder="숫자로만 입력 (cm 자동추가)"
                  />
              </div>
               <div className="space-y-2">
                  <label className="text-[10px] uppercase text-[#d4af37]">Weight</label>
                  <input 
                    type="text" 
                    value={formData.weight || ''} 
                    onChange={e => handleChange('weight', e.target.value)}
                    className="w-full bg-[#020f0a] border border-[#d4af37]/30 p-2 text-[#f9eabb] focus:border-[#d4af37] outline-none"
                    placeholder="85 (kg 자동추가) or 무거움"
                  />
              </div>
          </div>
          <div className="space-y-2">
              <label className="text-[10px] uppercase text-[#d4af37]">Signature Quote</label>
              <input 
                type="text" 
                value={formData.quote || ''} 
                onChange={e => handleChange('quote', e.target.value)}
                className="w-full bg-[#020f0a] border border-[#d4af37]/30 p-2 text-[#f9eabb] font-serif italic focus:border-[#d4af37] outline-none"
                placeholder="One line to describe your philosophy."
              />
          </div>
          <div className="space-y-2">
              <label className="text-[10px] uppercase text-[#d4af37]">Appearance Description</label>
              <textarea 
                value={formData.appearance || ''} 
                onChange={e => handleChange('appearance', e.target.value)}
                className="w-full h-24 bg-[#020f0a] border border-[#d4af37]/30 p-2 text-[#f9eabb] text-sm focus:border-[#d4af37] outline-none resize-none custom-scrollbar"
                placeholder="Describe visuals, attire, scars, etc."
              />
          </div>
           <div className="space-y-2">
              <label className="text-[10px] uppercase text-[#d4af37]">Personality Analysis</label>
              <textarea 
                value={formData.personality || ''} 
                onChange={e => handleChange('personality', e.target.value)}
                className="w-full h-24 bg-[#020f0a] border border-[#d4af37]/30 p-2 text-[#f9eabb] text-sm focus:border-[#d4af37] outline-none resize-none custom-scrollbar"
              />
          </div>
      </div>
  );

  const renderStep3 = () => (
      <div className="space-y-6 animate-fade-in">
           <div className="space-y-2">
              <label className="text-[10px] uppercase text-[#d4af37]">Relationships / Connections</label>
              <textarea 
                value={formData.relationships || ''} 
                onChange={e => handleChange('relationships', e.target.value)}
                className="w-full h-20 bg-[#020f0a] border border-[#d4af37]/30 p-2 text-[#f9eabb] text-sm focus:border-[#d4af37] outline-none resize-none custom-scrollbar"
                placeholder="Known allies, rivals, or affiliations."
              />
          </div>
          <div className="space-y-2">
              <label className="text-[10px] uppercase text-[#d4af37]">Inventory / Belongings</label>
              <input 
                type="text" 
                defaultValue={formData.belongings?.join(', ') || ''} 
                onBlur={e => handleBelongingChange(e.target.value)}
                className="w-full bg-[#020f0a] border border-[#d4af37]/30 p-2 text-[#f9eabb] focus:border-[#d4af37] outline-none"
                placeholder="Item 1, Item 2, Item 3 (Comma separated)"
              />
              <p className="text-[9px] text-gray-500">Separate items with commas.</p>
          </div>
      </div>
  );

  return (
    <>
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <SectionCard title={mode === 'create' ? "PERSONNEL ONBOARDING DOSSIER" : "UPDATE PERSONNEL RECORD"} noPadding>
                    <div className="p-8">
                        <div className="flex items-center justify-center mb-8 gap-4">
                            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#d4af37]' : 'text-gray-600'}`}>
                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${step >= 1 ? 'border-[#d4af37] bg-[#d4af37]/10' : 'border-gray-600'}`}>1</div>
                                <span className="text-[10px] uppercase font-bold hidden md:inline">Basic Info</span>
                            </div>
                            <div className="w-8 h-px bg-gray-700"></div>
                            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#d4af37]' : 'text-gray-600'}`}>
                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${step >= 2 ? 'border-[#d4af37] bg-[#d4af37]/10' : 'border-gray-600'}`}>2</div>
                                <span className="text-[10px] uppercase font-bold hidden md:inline">Details</span>
                            </div>
                            <div className="w-8 h-px bg-gray-700"></div>
                            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[#d4af37]' : 'text-gray-600'}`}>
                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${step >= 3 ? 'border-[#d4af37] bg-[#d4af37]/10' : 'border-gray-600'}`}>3</div>
                                <span className="text-[10px] uppercase font-bold hidden md:inline">Connections</span>
                            </div>
                        </div>

                        <div className="min-h-[300px]">
                            {step === 1 && renderStep1()}
                            {step === 2 && renderStep2()}
                            {step === 3 && renderStep3()}
                        </div>

                        <div className="mt-8 flex justify-between border-t border-[#d4af37]/20 pt-6">
                            {step > 1 ? (
                                <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 text-gray-400 hover:text-white uppercase text-xs tracking-widest px-4 py-2">
                                    <ChevronLeft size={14} /> Previous
                                </button>
                            ) : (
                                <div /> 
                            )}

                            <div className="flex gap-4">
                                {mode === 'edit' && onCancel && (
                                    <button onClick={handleCancel} className="text-red-400 hover:text-red-300 uppercase text-xs tracking-widest px-4 py-2">
                                        Cancel
                                    </button>
                                )}
                                
                                {step < 3 ? (
                                    <button onClick={() => setStep(s => s + 1)} className="flex items-center gap-2 bg-[#d4af37] text-black hover:bg-[#f9eabb] font-bold uppercase text-xs tracking-widest px-6 py-2">
                                        Next <ChevronRight size={14} />
                                    </button>
                                ) : (
                                    <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 bg-[#d4af37] text-black hover:bg-[#f9eabb] font-bold uppercase text-xs tracking-widest px-6 py-2 disabled:opacity-50">
                                        {loading ? 'Processing...' : (mode === 'create' ? 'Initialize Profile' : 'Update Record')} <Save size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </SectionCard>
            </div>
        </div>

        {isCropModalOpen && tempImageSrc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                <div className="bg-[#020f0a] border border-[#d4af37] w-full max-w-lg flex flex-col shadow-2xl animate-fade-in">
                    <div className="flex justify-between items-center p-4 border-b border-[#d4af37]/20 bg-[#d4af37]/5">
                        <h3 className="font-['Cinzel'] font-bold text-[#d4af37]">CROP PORTRAIT (3:4)</h3>
                        <button onClick={() => { setIsCropModalOpen(false); setTempImageSrc(null); }} className="text-gray-500 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-3 text-center text-xs text-gray-400">
                        전신 이미지는 원본 그대로 상세 페이지에 저장되며,<br/>
                        여기서 지정한 3:4 영역은 리스트/프로필 대표 이미지로 사용됩니다.
                    </div>
                    
                    <div className="relative w-full h-80 bg-black">
                        <Cropper
                            image={tempImageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={3 / 4}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            cropShape="rect" 
                            showGrid={true}
                        />
                    </div>
                    
                    <div className="p-4 space-y-4">
                        <div className="flex items-center gap-4">
                            <ZoomIn size={16} className="text-[#d4af37]" />
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full accent-[#d4af37] h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => { setIsCropModalOpen(false); setTempImageSrc(null); }}
                                className="flex-1 py-3 text-red-400 border border-red-900/50 hover:bg-red-900/20 font-bold text-xs tracking-widest uppercase"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={uploadImages}
                                disabled={uploading}
                                className="flex-[2] py-3 bg-[#d4af37] text-black hover:bg-white font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2"
                            >
                                {uploading ? <Loader className="animate-spin" size={14} /> : <Check size={14} />}
                                Confirm & Upload
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};