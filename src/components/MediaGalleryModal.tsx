import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Flag,
  CheckCircle2,
  Sparkles,
  Upload,
  Link,
  Shield,
  Layers,
  X,
  Award,
} from 'lucide-react';
import {
  LOGO_GALLERY_PRESETS,
  FLAG_GALLERY_PRESETS,
  BENISHANGUL_GUMUZ_POLICE_LOGO_SVG,
  BENISHANGUL_GUMUZ_FLAG_SVG,
  ETHIOPIAN_FLAG_SVG,
  COMBINED_FLAGS_SVG,
} from '../data/initialData';
import { CommissionSettings } from '../types';
import { updateSettings } from '../services/dbService';

interface MediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CommissionSettings;
  targetType?: 'logo' | 'flag' | 'all';
}

export const MediaGalleryModal: React.FC<MediaGalleryModalProps> = ({
  isOpen,
  onClose,
  settings,
  targetType = 'all',
}) => {
  const [activeTab, setActiveTab] = useState<'logos' | 'flags' | 'upload'>(
    targetType === 'flag' ? 'flags' : 'logos'
  );
  const [selectedLogo, setSelectedLogo] = useState<string>(settings.logoUrl);
  const [selectedFlag, setSelectedFlag] = useState<string>(settings.flagUrl);
  const [selectedRegionalFlag, setSelectedRegionalFlag] = useState<string>(
    settings.regionalFlagUrl || BENISHANGUL_GUMUZ_FLAG_SVG
  );
  const [customUrl, setCustomUrl] = useState('');
  const [customType, setCustomType] = useState<'logo' | 'flag' | 'regionalFlag'>('logo');
  const [isApplying, setIsApplying] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state whenever modal opens or settings change
  useEffect(() => {
    if (isOpen && settings) {
      if (settings.logoUrl) setSelectedLogo(settings.logoUrl);
      if (settings.flagUrl) setSelectedFlag(settings.flagUrl);
      if (settings.regionalFlagUrl) {
        setSelectedRegionalFlag(settings.regionalFlagUrl);
      } else {
        setSelectedRegionalFlag(BENISHANGUL_GUMUZ_FLAG_SVG);
      }
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  // Handle local file upload with canvas auto-compression to avoid Firestore 1MB doc limits
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const rawDataUrl = uploadEvent.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL(
            file.type === 'image/png' ? 'image/png' : 'image/jpeg',
            0.88
          );
          if (customType === 'logo') {
            setSelectedLogo(compressedDataUrl);
          } else if (customType === 'regionalFlag') {
            setSelectedRegionalFlag(compressedDataUrl);
          } else {
            setSelectedFlag(compressedDataUrl);
          }
          setSuccessMessage('ምስሉ በተሳካ ሁኔታ ተጭኗል! ከታች ያለውን "በሁሉም ላይ እንዲታይ አስቀምጥ" ቁልፍ ይጫኑ።');
          return;
        }

        if (customType === 'logo') {
          setSelectedLogo(rawDataUrl);
        } else if (customType === 'regionalFlag') {
          setSelectedRegionalFlag(rawDataUrl);
        } else {
          setSelectedFlag(rawDataUrl);
        }
        setSuccessMessage('ምስሉ በተሳካ ሁኔታ ተጭኗል!');
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleApplySettings = async () => {
    setIsApplying(true);
    try {
      await updateSettings({
        commissionName: settings.commissionName,
        motto: settings.motto,
        logoUrl: selectedLogo,
        flagUrl: selectedFlag,
        regionalFlagUrl: selectedRegionalFlag,
      });
      setSuccessMessage('የተመረጠው ሎጎ እና ሰንደቅ ዓላማ በሁሉም ስክሪኖች ላይ በተሳካ ሁኔታ ተተግብሯል!');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to update branding settings:', err);
    } finally {
      setIsApplying(false);
    }
  };

  const handleSelectDefaultPair = () => {
    setSelectedLogo(BENISHANGUL_GUMUZ_POLICE_LOGO_SVG);
    setSelectedFlag(ETHIOPIAN_FLAG_SVG);
    setSelectedRegionalFlag(BENISHANGUL_GUMUZ_FLAG_SVG);
    setSuccessMessage('የቤኒሻንጉል ጉሙዝ ይፋዊ ሎጎ እና ሁለቱም ሰንደቆች ተመርጠዋል!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white font-serif">
                የሎጎ እና የሰንደቅ ዓላማ ይፋዊ ጋለሪ (Media Gallery)
              </h2>
              <p className="text-xs text-slate-400">
                የቤኒሻንጉል ጉሙዝ ፖሊስ ሎጎ፣ የኢትዮጵያ ሰንደቅ እና የክልሉ ሰንደቅ ዓላማዎችን መርጠው በሁሉም ስክሪኖች ላይ ያንጸባርቁ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectDefaultPair}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              <span>ይፋዊ የቤ/ጉሙዝ አርማና ሰንደቆች አዘጋጅ</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mb-4 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('logos')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'logos'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>የፖሊስ ኮሚሽን ሎጎዎች ጋለሪ</span>
          </button>

          <button
            onClick={() => setActiveTab('flags')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'flags'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>ሰንደቅ ዓላማዎች (ኢትዮጵያ & ቤኒሻንጉል ጉሙዝ)</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>ከኮምፒውተር ጫን / URL</span>
          </button>
        </div>

        {/* Alert Feedback */}
        {successMessage && (
          <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 px-4 py-2.5 rounded-xl text-xs mb-3 flex items-center gap-2 shrink-0 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Gallery Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* TAB 1: POLICE LOGOS */}
          {activeTab === 'logos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>ከጋለሪው ውስጥ የሚፈልጉትን አርማ ይምረጡ፡</span>
                <span className="text-amber-400 font-semibold">
                  የተመረጠው ሎጎ በሁሉም ታብሌቶች፣ ስካነሮች እና ካርዶች ላይ ይታያል
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {LOGO_GALLERY_PRESETS.map((item) => {
                  const isSelected = selectedLogo === item.url;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedLogo(item.url)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/10 shadow-xl shadow-amber-500/10'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                      }`}
                    >
                      <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-amber-400/40 p-1 flex items-center justify-center shrink-0 shadow-md">
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-contain rounded-xl"
                        />
                      </div>

                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                            {item.category}
                          </span>
                          {isSelected && (
                            <span className="flex items-center gap-1 text-[11px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                              ተመርጧል
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-white text-sm leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: FLAGS GALLERY (BENISHANGUL-GUMUZ & ETHIOPIA) */}
          {activeTab === 'flags' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>የኢትዮጵያ እና የቤኒሻንጉል ጉሙዝ ክልል ይፋዊ ሰንደቅ ዓላማዎችን ይምረጡ፡</span>
                <span className="text-amber-400 font-semibold">
                  በአናት እና በዳሽቦርዱ ላይ ይንጸባረቃል
                </span>
              </div>

              {/* Quick pair setup button */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    የተሟላ የሁለቱም ሰንደቆች ጥምረት
                  </span>
                  <span className="text-[11px] text-slate-400">
                    የኢትዮጵያ ሰንደቅ እና የቤኒሻንጉል ጉሙዝ ክልል ሰንደቅ ጎን ለጎን
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFlag(ETHIOPIAN_FLAG_SVG);
                    setSelectedRegionalFlag(BENISHANGUL_GUMUZ_FLAG_SVG);
                    setSuccessMessage('የኢትዮጵያ እና የቤኒሻንጉል ጉሙዝ ሰንደቅ ዓላማዎች ተመርጠዋል!');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs hover:from-amber-400 hover:to-amber-500 cursor-pointer shadow"
                >
                  ሁለቱንም በአንድ ላይ ምረጥ
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {FLAG_GALLERY_PRESETS.map((item) => {
                  const isNationalSelected = selectedFlag === item.url;
                  const isRegionalSelected = selectedRegionalFlag === item.url;
                  const isAnySelected = isNationalSelected || isRegionalSelected;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                        isAnySelected
                          ? 'border-amber-400 bg-amber-500/10 shadow-xl shadow-amber-500/10'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        {/* Flag Preview Banner */}
                        <div className="w-full aspect-[16/10] rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shadow-md mb-3 flex items-center justify-center p-1">
                          <img
                            src={item.url}
                            alt={item.title}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                            {item.category}
                          </span>
                          {isAnySelected && (
                            <span className="text-[10px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                              ✓ {isRegionalSelected ? 'ቤ/ጉሙዝ' : 'ኢትዮጵያ'}
                            </span>
                          )}
                        </div>

                        <h4 className="font-extrabold text-white text-sm leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-3">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
                        {item.id === 'bg_regional_flag' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRegionalFlag(item.url);
                              setSuccessMessage('የቤኒሻንጉል ጉሙዝ ክልል ሰንደቅ ተመርጧል!');
                            }}
                            className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isRegionalSelected
                                ? 'bg-amber-500 text-slate-950 font-black'
                                : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                            }`}
                          >
                            {isRegionalSelected ? '✓ የቤ/ጉሙዝ ሰንደቅ ሆኗል' : 'እንደ ቤኒሻንጉል ጉሙዝ ሰንደቅ ምረጥ'}
                          </button>
                        ) : item.id === 'eth_national_flag' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFlag(item.url);
                              setSuccessMessage('የኢትዮጵያ ብሔራዊ ሰንደቅ ተመርጧል!');
                            }}
                            className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isNationalSelected
                                ? 'bg-amber-500 text-slate-950 font-black'
                                : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                            }`}
                          >
                            {isNationalSelected ? '✓ የኢትዮጵያ ሰንደቅ ሆኗል' : 'እንደ ኢትዮጵያ ሰንደቅ ምረጥ'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFlag(item.url);
                              setSelectedRegionalFlag(BENISHANGUL_GUMUZ_FLAG_SVG);
                              setSuccessMessage('ጥምር ሰንደቆች ተመርጠዋል!');
                            }}
                            className="w-full py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 cursor-pointer"
                          >
                            እንደ ዋና ባነር ምረጥ
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM UPLOAD OR URL */}
          {activeTab === 'upload' && (
            <div className="space-y-5 bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-300 block mb-2">
                  የትኛውን ማስተካከል ይፈልጋሉ?
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCustomType('logo')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      customType === 'logo'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    የኮሚሽን ሎጎ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomType('flag')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      customType === 'flag'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    የኢትዮጵያ ሰንደቅ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomType('regionalFlag')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      customType === 'regionalFlag'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    የቤኒሻንጉል ጉሙዝ ሰንደቅ
                  </button>
                </div>
              </div>

              {/* Upload from file */}
              <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 p-6 rounded-2xl text-center bg-slate-900/60 transition-colors">
                <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <label className="cursor-pointer block">
                  <span className="text-sm font-bold text-white block">
                    የምስል ፋይል ይምረጡ (PNG, JPG, SVG)
                  </span>
                  <span className="text-xs text-slate-400 block mt-1">
                    ኮምፒውተርዎ ላይ ያለውን የቤኒሻንጉል ጉሙዝ ፖሊስ ሎጎ ወይም ሰንደቅ እዚህ ይጫኑ
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="inline-block mt-3 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md">
                    ፋይል ምረጥ (Browse File)
                  </span>
                </label>
              </div>

              {/* Or paste URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ወይም የምስል ማስፈንጠሪያ (Image URL) ያስገቡ፡
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://... ወይም data:image/svg+xml;..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!customUrl.trim()) return;
                      const val = customUrl.trim();
                      if (customType === 'logo') {
                        setSelectedLogo(val);
                      } else if (customType === 'regionalFlag') {
                        setSelectedRegionalFlag(val);
                      } else {
                        setSelectedFlag(val);
                      }
                      setSuccessMessage('ማስፈንጠሪያው ተቀባይነት አግኝቷል!');
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-400 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    ተግብር
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Previews & Footer Actions */}
        <div className="border-t border-slate-800 pt-4 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-xs text-slate-400">የአሁን ምርጫ:</span>
            {/* Logo thumbnail */}
            <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <img
                src={selectedLogo}
                alt="Selected Logo"
                className="w-6 h-6 object-contain rounded-full"
              />
              <span className="text-[11px] font-bold text-amber-300">አርማ</span>
            </div>

            {/* Ethiopian Flag thumbnail */}
            <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <img
                src={selectedFlag}
                alt="Selected National Flag"
                className="w-7 h-4 object-contain rounded"
              />
              <span className="text-[11px] font-bold text-emerald-300">ኢትዮጵያ</span>
            </div>

            {/* Benishangul-Gumuz Flag thumbnail */}
            <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <img
                src={selectedRegionalFlag}
                alt="Selected Regional Flag"
                className="w-7 h-4 object-contain rounded"
              />
              <span className="text-[11px] font-bold text-yellow-300">ቤ/ጉሙዝ</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
            >
              ይቅር (Cancel)
            </button>
            <button
              onClick={handleApplySettings}
              disabled={isApplying}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isApplying ? 'በማስቀመጥ ላይ...' : 'በሁሉም ላይ እንዲታይ አስቀምጥ'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
