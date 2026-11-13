import React, { useState, useEffect } from 'react';
import {
  Settings,
  Image,
  Flag,
  FileText,
  Clock,
  Save,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Layers,
  Upload,
  Lock,
} from 'lucide-react';
import { CommissionSettings } from '../types';
import { updateSettings } from '../services/dbService';
import {
  DEFAULT_POLICE_LOGO_SVG,
  BENISHANGUL_GUMUZ_POLICE_LOGO_SVG,
  BENISHANGUL_GUMUZ_FLAG_SVG,
  ETHIOPIAN_FLAG_SVG,
  COMBINED_FLAGS_SVG,
} from '../data/initialData';
import { MediaGalleryModal } from './MediaGalleryModal';

interface SettingsManagerProps {
  settings: CommissionSettings;
  onOpenGallery?: () => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ settings, onOpenGallery }) => {
  const [commissionName, setCommissionName] = useState(settings.commissionName);
  const [motto, setMotto] = useState(settings.motto);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [flagUrl, setFlagUrl] = useState(settings.flagUrl);
  const [regionalFlagUrl, setRegionalFlagUrl] = useState(
    settings.regionalFlagUrl || BENISHANGUL_GUMUZ_FLAG_SVG
  );
  const [morningStart, setMorningStart] = useState(settings.morningStart);
  const [morningDeadline, setMorningDeadline] = useState(settings.morningDeadline);
  const [eveningExitTime, setEveningExitTime] = useState(settings.eveningExitTime);
  const [adminPin, setAdminPin] = useState(settings.adminPin || '1992');

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state when external settings update
  useEffect(() => {
    setCommissionName(settings.commissionName);
    setMotto(settings.motto);
    setLogoUrl(settings.logoUrl);
    setFlagUrl(settings.flagUrl);
    if (settings.regionalFlagUrl) setRegionalFlagUrl(settings.regionalFlagUrl);
    setMorningStart(settings.morningStart);
    setMorningDeadline(settings.morningDeadline);
    setEveningExitTime(settings.eveningExitTime);
    setAdminPin(settings.adminPin || '1992');
  }, [settings]);

  // Logo Presets
  const LOGO_PRESETS = [
    {
      name: 'የቤኒሻንጉል ጉሙዝ ክልል ፖሊስ ኮሚሽን ይፋዊ ሎጎ',
      url: BENISHANGUL_GUMUZ_POLICE_LOGO_SVG,
    },
    {
      name: 'የኢትዮጵያ ፖሊስ ኮሚሽን ወርቃማ ማህተም',
      url: DEFAULT_POLICE_LOGO_SVG,
    },
    {
      name: 'የፌዴራል ፖሊስ ኮሚሽን አርማ (Federal Police)',
      url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200&auto=format&fit=crop&q=80',
    },
  ];

  // Flag Presets
  const FLAG_PRESETS = [
    {
      name: 'የቤኒሻንጉል ጉሙዝ ክልል ሰንደቅ ዓላማ',
      url: BENISHANGUL_GUMUZ_FLAG_SVG,
    },
    {
      name: 'የኢትዮጵያ ሰንደቅ ዓላማ (ብሔራዊ)',
      url: ETHIOPIAN_FLAG_SVG,
    },
    {
      name: 'ጥምር ሰንደቆች (ኢትዮጵያ & ቤኒሻንጉል ጉሙዝ)',
      url: COMBINED_FLAGS_SVG,
    },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateSettings({
        commissionName: commissionName.trim(),
        motto: motto.trim(),
        logoUrl: logoUrl.trim(),
        flagUrl: flagUrl.trim(),
        regionalFlagUrl: regionalFlagUrl.trim(),
        morningStart,
        morningDeadline,
        eveningExitTime,
        adminPin: adminPin.trim() || '1992',
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner with direct Media Gallery button */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white font-serif">
              የፖሊስ ኮሚሽኑ አጠቃላይ ማስተካከያ (Branding & Settings)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            አድሚኑ ሎጎዎችን፣ ሰንደቅ አላማዎችን፣ መሪ ቃል እና የስራ ሰዓት ደረጃዎችን ሲቀይር በሁሉም ታብሌቶች እና ስክሪኖች ላይ በቀጥታ ይቀየራል
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsGalleryOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg transition-transform active:scale-95 shrink-0 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>የሎጎ እና ሰንደቅ ጋለሪ ክፈት</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-2xl flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>ማስተካከያው በተሳካ ሁኔታ ተቀምጧል! በሁሉም ስክሪኖች እና በር ላይ ስካነሮች ላይ ተቀይሯል።</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Branding, Logo & Flag */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <Image className="w-4 h-4" />
              <span>የኮሚሽኑ አርማ (ሎጎ) እና ሰንደቅ ዓላማ</span>
            </h2>
            <button
              type="button"
              onClick={() => setIsGalleryOpen(true)}
              className="text-xs text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>በጋለሪ ምረጥ</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              የኮሚሽኑ ይፋዊ ስም
            </label>
            <input
              type="text"
              required
              value={commissionName}
              onChange={(e) => setCommissionName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              የፖሊስ ኮሚሽኑ መሪ ቃል (Motto)
            </label>
            <input
              type="text"
              required
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              placeholder="በጀግንነት መጠበቅ በሰብአዊነት ማገልገል"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-serif italic text-base outline-none focus:ring-2 focus:ring-amber-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              * ባለጉዳዩ አገልግሎቱን ጨርሶ ሲወጣና አስተያየት ሲሰጥ ከሎጎው ጋር አብሮ ይታያል
            </span>
          </div>

          {/* Logo selection & preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              የኮሚሽኑ ሎጎ ይምረጡ (ከጋለሪው የተመረጠ)
            </label>

            {/* Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              {LOGO_PRESETS.map((p, i) => (
                <div
                  key={i}
                  onClick={() => setLogoUrl(p.url)}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    logoUrl === p.url
                      ? 'border-amber-400 bg-amber-500/10 shadow-md'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <img
                    src={p.url}
                    alt={p.name}
                    className="w-12 h-12 object-cover rounded-full bg-slate-900 shrink-0"
                  />
                  <span className="text-xs font-bold text-white leading-tight">{p.name}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="የሎጎ ምስል URL ወይም SVG..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-950 border-2 border-amber-500/60 flex items-center justify-center shrink-0">
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Flag selection & preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              ሰንደቅ ዓላማ ይምረጡ (የቤኒሻንጉል ጉሙዝ / የኢትዮጵያ / ጥምር)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              {FLAG_PRESETS.map((p, i) => (
                <div
                  key={i}
                  onClick={() => {
                    if (p.name.includes('ቤኒሻንጉል')) {
                      setRegionalFlagUrl(p.url);
                    } else if (p.name.includes('ብሔራዊ')) {
                      setFlagUrl(p.url);
                    } else {
                      setFlagUrl(p.url);
                      setRegionalFlagUrl(BENISHANGUL_GUMUZ_FLAG_SVG);
                    }
                  }}
                  className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                    flagUrl === p.url || regionalFlagUrl === p.url
                      ? 'border-amber-400 bg-amber-500/10 shadow-md'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <div className="w-full h-12 bg-slate-950 rounded-lg p-1 border border-slate-800 flex items-center justify-center mb-2">
                    <img src={p.url} alt={p.name} className="h-full object-contain rounded" />
                  </div>
                  <span className="text-xs font-bold text-white leading-tight">{p.name}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  የኢትዮጵያ ሰንደቅ ዓላማ URL / SVG:
                </label>
                <input
                  type="text"
                  value={flagUrl}
                  onChange={(e) => setFlagUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  የቤኒሻንጉል ጉሙዝ ክልል ሰንደቅ ዓላማ URL / SVG:
                </label>
                <input
                  type="text"
                  value={regionalFlagUrl}
                  onChange={(e) => setRegionalFlagUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Work Schedule & Attendance Punctuality Rules */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-base font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="w-4 h-4" />
            <span>የስራ ሰዓት እና የሰዓት አክባሪነት ደንቦች (ከሰኞ እስከ አርብ)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-emerald-400 font-bold block mb-1">
                ጠዋት መግቢያ (ከፍተኛ ደረጃ)
              </span>
              <p className="text-slate-300 mb-2">
                ከ <span className="font-bold text-amber-300">2፡30</span> እስከ{' '}
                <span className="font-bold text-amber-300">3፡00</span> ሰዓት የገቡ
              </p>
              <input
                type="text"
                value={morningStart}
                onChange={(e) => setMorningStart(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono"
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-rose-400 font-bold block mb-1">
                ጠዋት መዘግየት (ዝቅተኛ ደረጃ)
              </span>
              <p className="text-slate-300 mb-2">
                ከ <span className="font-bold text-rose-300">3፡01</span> በኋላ የሚመጡ ሰራተኞች
              </p>
              <input
                type="text"
                value={morningDeadline}
                onChange={(e) => setMorningDeadline(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono"
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-blue-400 font-bold block mb-1">
                ማታ መውጫ (በጣም ከፍተኛ ደረጃ)
              </span>
              <p className="text-slate-300 mb-2">
                ከ <span className="font-bold text-blue-300">11፡00</span> በኋላ የሚወጡ ሰራተኞች
              </p>
              <input
                type="text"
                value={eveningExitTime}
                onChange={(e) => setEveningExitTime(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* ADMIN SECURITY PIN CARD */}
        <div className="bg-slate-900 border-2 border-rose-500/40 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-rose-400">
            <Lock className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-lg text-white">
              የአስተዳዳሪ (Admin) ጥብቅ የደህንነት ፒን (Security PIN)
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            በግድግዳ ላይ የተለጠፉትን ስካን ያደረጉ ሰራተኞች ወይም ባለጉዳዮች ወደ አድሚን ገጽ እንዳይገቡ የሚያግደው የይለፍ ቃል ነው።
            አድሚኑ ወደ ሲስተሙ ሲገባ ይህንን ፒን በማስገባት ብቻ ይገባል።
          </p>

          <div className="max-w-xs">
            <label className="block text-xs font-bold text-slate-300 mb-1">
              የአድሚን ፒን ቁጥር (4-8 አሃዞች)
            </label>
            <input
              type="text"
              required
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              placeholder="1992"
              className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl px-3 py-2 text-white font-mono tracking-widest text-lg outline-none"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              የቀደመው ይፋዊ ፒን፡ 1992 (በፈለጉት ጊዜ መቀየር ይችላሉ)
            </span>
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>ቅንብሩን አስቀምጥ</span>
          </button>
        </div>
      </form>

      {/* Media Gallery Modal for Logos and Flags */}
      <MediaGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        settings={settings}
      />
    </div>
  );
};
