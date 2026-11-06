import React, { useState } from 'react';
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
  const [customType, setCustomType] = useState<'logo' | 'flag'>('logo');
  const [isApplying, setIsApplying] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (customType === 'logo') {
        setSelectedLogo(dataUrl);
      } else {
        setSelectedFlag(dataUrl);
      }
      setSuccessMessage('ምስሉ በተሳካ ሁኔታ ተጭኗል! ከታች ያለውን "አስቀምጥ" ቁልፍ ይጫኑ።');
    };
    reader.readAsDataURL(file);
  };

  const handleApplySettings = async () => {
    setIsApplying(true);
    try {
      await updateSettings({
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

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mb-4 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('logos')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
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
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
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
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {FLAG_GALLERY_PRESETS.map((item) => {
                  const isSelected = selectedFlag === item.url || selectedRegionalFlag === item.url;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'bg_regional_flag') {
                          setSelectedRegionalFlag(item.url);
                          setSelectedFlag(item.url);
                        } else {
                          setSelectedFlag(item.url);
                        }
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
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
                          {isSelected && (
                            <span className="text-[10px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                              ✓ ተመርጧል
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

                      <div className="mt-3 pt-2 border-t border-slate-800/80">
                        <span className="text-[11px] text-amber-300 font-semibold">
                          ይምረጡ ➔
                        </span>
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
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCustomType('logo')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                      customType === 'logo'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    የኮሚሽን ሎጎ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomType('flag')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                      customType === 'flag'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    ሰንደቅ ዓላማ
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
                      if (customType === 'logo') {
                        setSelectedLogo(customUrl.trim());
                      } else {
                        setSelectedFlag(customUrl.trim());
                      }
                      setSuccessMessage('ማስፈንጠሪያው ተቀባይነት አግኝቷል!');
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-400 px-4 py-2 rounded-xl text-xs font-bold"
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
          <div className="flex items-center gap-3">
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

            {/* Flag thumbnail */}
            <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <img
                src={selectedFlag}
                alt="Selected Flag"
                className="w-8 h-5 object-contain rounded"
              />
              <span className="text-[11px] font-bold text-emerald-300">ሰንደቅ</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
            >
              ይቅር (Cancel)
            </button>
            <button
              onClick={handleApplySettings}
              disabled={isApplying}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
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
