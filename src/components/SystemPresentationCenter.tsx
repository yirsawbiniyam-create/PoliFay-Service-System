import React, { useState } from 'react';
import {
  Presentation,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  MonitorPlay,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { CommissionSettings } from '../types';
import {
  SYSTEM_SLIDES,
  SystemSlideData,
  downloadSystemPowerPoint,
} from '../utils/presentationGenerator';
import {
  ETHIOPIAN_FLAG_SVG,
  BENISHANGUL_GUMUZ_FLAG_SVG,
} from '../data/initialData';

interface SystemPresentationCenterProps {
  settings: CommissionSettings;
}

export const SystemPresentationCenter: React.FC<SystemPresentationCenterProps> = ({
  settings,
}) => {
  const [viewMode, setViewMode] = useState<'all' | 'presenter'>('all');
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const regionalFlagSrc = settings.regionalFlagUrl || BENISHANGUL_GUMUZ_FLAG_SVG;
  const ethiopianFlagSrc = settings.flagUrl || ETHIOPIAN_FLAG_SVG;
  const mottoText = (settings.motto || 'በሰብዓዊነት ማገልገል በጀግንነት መጠበቅ')
    .replace(/[«»"]/g, '')
    .trim();

  const handleDownloadPptx = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    try {
      await downloadSystemPowerPoint(settings);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3500);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintAllSlides = () => {
    window.print();
  };

  const renderSlide = (slide: SystemSlideData) => {
    const accentClasses = (accent?: 'amber' | 'emerald' | 'cyan' | 'rose') => {
      if (accent === 'emerald') {
        return {
          border: 'border-emerald-500/40 print:border-emerald-700',
          title: 'text-emerald-400 print:text-emerald-900',
        };
      }
      if (accent === 'cyan') {
        return {
          border: 'border-cyan-500/40 print:border-cyan-700',
          title: 'text-cyan-400 print:text-cyan-900',
        };
      }
      if (accent === 'rose') {
        return {
          border: 'border-rose-500/40 print:border-rose-700',
          title: 'text-rose-400 print:text-rose-900',
        };
      }
      return {
        border: 'border-amber-500/40 print:border-amber-700',
        title: 'text-amber-400 print:text-amber-900',
      };
    };

    return (
      <div
        key={slide.id}
        className="bg-slate-900 text-white border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between min-h-[470px] break-after-page print:bg-white print:text-slate-950 print:border-2 print:border-slate-900 print:rounded-none print:shadow-none print:min-h-[92vh]"
      >
        {/* Top Ethiopian Tricolor Accent */}
        <div className="h-2 w-full flex shrink-0">
          <div className="h-full w-1/3 bg-emerald-600" />
          <div className="h-full w-1/3 bg-amber-400" />
          <div className="h-full w-1/3 bg-rose-600" />
        </div>

        {/* Slide Top Header Bar */}
        <div className="px-6 sm:px-8 pt-4 pb-3 border-b border-slate-800 print:border-slate-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={regionalFlagSrc}
              alt="BGR Flag"
              className="h-6 w-10 object-cover rounded border border-slate-700 print:border-slate-400 shrink-0"
            />
            <span className="text-xs font-bold text-amber-400 print:text-amber-800 truncate">
              {slide.tag}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-mono tabular-nums text-slate-400 print:text-slate-600 font-bold">
              {slide.id} / {SYSTEM_SLIDES.length}
            </span>
            <img
              src={ethiopianFlagSrc}
              alt="Ethiopia Flag"
              className="h-6 w-10 object-cover rounded border border-slate-700 print:border-slate-400 shrink-0"
            />
          </div>
        </div>

        {/* Slide Main Content Area */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center">
          {slide.layout === 'cover' ? (
            <div className="text-center max-w-4xl mx-auto space-y-5">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-amber-400 shadow-xl bg-white mx-auto">
                <img
                  src={settings.logoUrl}
                  alt="Police Commission Logo"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-4xl font-black text-white print:text-slate-950 font-serif leading-tight">
                  {slide.title}
                </h2>
                {slide.subtitle && (
                  <p className="text-sm sm:text-base font-bold text-emerald-400 print:text-emerald-800">
                    {slide.subtitle}
                  </p>
                )}
              </div>

              {slide.highlightBox && (
                <div className="bg-slate-950/90 print:bg-slate-100 border border-amber-500/40 print:border-slate-400 rounded-2xl p-5 text-sm sm:text-lg font-bold text-amber-200 print:text-slate-900 leading-relaxed">
                  {slide.highlightBox}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-3xl font-black text-white print:text-slate-950 font-serif">
                  {slide.title}
                </h2>
                {slide.subtitle && (
                  <p className="text-xs sm:text-sm font-semibold text-emerald-400 print:text-emerald-800 mt-1">
                    {slide.subtitle}
                  </p>
                )}
              </div>

              {/* TWO-COLUMN LAYOUT */}
              {slide.layout === 'two_col' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-slate-950/80 print:bg-slate-50 border border-amber-500/35 print:border-slate-300 rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm sm:text-base font-black text-amber-400 print:text-amber-900 border-b border-slate-800 print:border-slate-300 pb-2">
                      {slide.leftTitle}
                    </h3>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200 print:text-slate-800 leading-relaxed">
                      {(slide.leftItems || []).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-400 print:text-amber-700 font-black mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950/80 print:bg-slate-50 border border-emerald-500/35 print:border-slate-300 rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm sm:text-base font-black text-emerald-400 print:text-emerald-900 border-b border-slate-800 print:border-slate-300 pb-2">
                      {slide.rightTitle}
                    </h3>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200 print:text-slate-800 leading-relaxed">
                      {(slide.rightItems || []).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 print:text-emerald-700 font-black mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* CARDS LAYOUT */}
              {slide.layout === 'cards' && slide.cards && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {slide.cards.map((card, cIdx) => {
                    const st = accentClasses(card.accent);
                    return (
                      <div
                        key={cIdx}
                        className={`bg-slate-950/80 print:bg-slate-50 border ${st.border} rounded-2xl p-4 sm:p-5 space-y-3`}
                      >
                        <h3 className={`text-sm sm:text-base font-black ${st.title} border-b border-slate-800 print:border-slate-300 pb-2`}>
                          {card.heading}
                        </h3>
                        <ul className="space-y-2 text-xs sm:text-sm text-slate-200 print:text-slate-800 leading-relaxed">
                          {card.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="font-black mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TABLE LAYOUT */}
              {slide.layout === 'table' && slide.tableHeaders && slide.tableRows && (
                <div className="overflow-x-auto rounded-2xl border border-slate-700 print:border-slate-400">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-amber-500 text-slate-950 font-black">
                        {slide.tableHeaders.map((h, i) => (
                          <th key={i} className="py-3 px-4 border-b border-amber-600">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 print:divide-slate-300">
                      {slide.tableRows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={
                            rIdx % 2 === 0
                              ? 'bg-slate-950/80 print:bg-white'
                              : 'bg-slate-900/80 print:bg-slate-50'
                          }
                        >
                          <td className="py-3 px-4 text-slate-300 print:text-slate-800 align-top">
                            {row[0]}
                          </td>
                          <td className="py-3 px-4 text-emerald-300 print:text-emerald-900 font-semibold align-top">
                            {row[1]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Slide Footer */}
        <div className="px-6 sm:px-8 py-3 bg-slate-950/60 print:bg-slate-100 border-t border-slate-800 print:border-slate-300 flex items-center justify-between gap-3 text-[11px] text-slate-400 print:text-slate-700">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-amber-400/70 bg-white shrink-0">
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <span className="font-bold truncate">{settings.commissionName}</span>
          </div>
          <span className="italic font-semibold shrink-0">«{mottoText}»</span>
        </div>
      </div>
    );
  };

  const activeSlide = SYSTEM_SLIDES[currentSlideIdx] || SYSTEM_SLIDES[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Control Header - Hidden on Print */}
      <div className="print:hidden bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Presentation className="w-6 h-6 text-amber-400 shrink-0" />
            <h1 className="text-xl sm:text-2xl font-black text-white font-serif">
              የሲስተሙ ፓወርፖይንት ሰነድ እና ማተሚያ (PPTX &amp; Print Slides)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            አጠቃላይ የሲስተሙን ሰነድ በ12 የተደራጁ የፓወርፖይንት ስላይዶች መመልከት፣ በ.pptx ማውረድ እና በወረቀት ፕሪንት ማድረግ ይችላሉ።
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'all'
                  ? 'bg-slate-800 text-amber-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>ሁሉንም (12 ስላይድ)</span>
            </button>
            <button
              onClick={() => setViewMode('presenter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'presenter'
                  ? 'bg-slate-800 text-amber-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              <span>አንድ በአንድ አሳይ</span>
            </button>
          </div>

          <button
            onClick={handleDownloadPptx}
            disabled={isExporting}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-60 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : exportSuccess ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{exportSuccess ? 'ፓወርፖይንት ወርዷል!' : 'ፓወርፖይንት (.pptx) አውርድ'}</span>
          </button>

          <button
            onClick={handlePrintAllSlides}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>ሁሉንም ፕሪንት አድርግ (A4 / PDF)</span>
          </button>
        </div>
      </div>

      {/* PRESENTER MODE ON SCREEN (Hidden when printing so ALL 12 slides print cleanly!) */}
      {viewMode === 'presenter' && (
        <div className="print:hidden space-y-4">
          {renderSlide(activeSlide)}

          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-2xl">
            <button
              onClick={() => setCurrentSlideIdx((i) => Math.max(0, i - 1))}
              disabled={currentSlideIdx === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>ቀዳሚ ስላይድ</span>
            </button>

            <div className="flex items-center gap-1.5 overflow-x-auto px-2">
              {SYSTEM_SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentSlideIdx(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer shrink-0 ${
                    idx === currentSlideIdx
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {s.id}
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                setCurrentSlideIdx((i) => Math.min(SYSTEM_SLIDES.length - 1, i + 1))
              }
              disabled={currentSlideIdx === SYSTEM_SLIDES.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs font-black cursor-pointer"
            >
              <span>ቀጣይ ስላይድ</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ALL SLIDES STACK (Always used for Printing! Shown on screen when viewMode === 'all') */}
      <div
        className={`${
          viewMode === 'presenter' ? 'hidden print:block' : 'block'
        } space-y-8 print:space-y-0`}
      >
        {SYSTEM_SLIDES.map((slide) => renderSlide(slide))}
      </div>
    </div>
  );
};
