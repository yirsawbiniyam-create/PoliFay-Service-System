import React, { useState } from 'react';
import {
  Shield,
  QrCode,
  RotateCw,
  Printer,
  Sparkles,
  UserCheck,
  CheckCircle,
  Copy,
  Scan,
  CreditCard,
} from 'lucide-react';
import { Staff, CommissionSettings } from '../types';
import { SAMPLE_FAYDA_CITIZENS } from '../data/initialData';
import { PoliceIdCard } from './PoliceIdCard';
import { PoliceIdSystemModal } from './PoliceIdSystemModal';

interface DigitalIdCardsProps {
  staffList: Staff[];
  settings: CommissionSettings;
  onSimulateScan?: (code: string) => void;
  preselectedStaff?: Staff | null;
}

export const DigitalIdCards: React.FC<DigitalIdCardsProps> = ({
  staffList,
  settings,
  onSimulateScan,
  preselectedStaff,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    preselectedStaff?.id || staffList[0]?.id || ''
  );
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedFaydaIdx, setSelectedFaydaIdx] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isIdSystemModalOpen, setIsIdSystemModalOpen] = useState(false);

  const selectedStaff =
    staffList.find((s) => s.id === selectedStaffId) || preselectedStaff || staffList[0];
  const selectedCitizen = SAMPLE_FAYDA_CITIZENS[selectedFaydaIdx] || SAMPLE_FAYDA_CITIZENS[0];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  /**
   * Helper to draw clean SVG barcode lines from a string
   */
  const renderSvgBarcode = (code: string) => {
    // Deterministic pseudo-bar widths based on characters
    const bars: { width: number; isBlack: boolean }[] = [];
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      bars.push({ width: (charCode % 3) + 2, isBlack: true });
      bars.push({ width: ((charCode * 3) % 2) + 1, isBlack: false });
      bars.push({ width: ((charCode * 7) % 3) + 1, isBlack: true });
      bars.push({ width: 2, isBlack: false });
    }
    // Guard bars
    bars.unshift({ width: 3, isBlack: true }, { width: 2, isBlack: false }, { width: 3, isBlack: true });
    bars.push({ width: 3, isBlack: true }, { width: 2, isBlack: false }, { width: 3, isBlack: true });

    let currentX = 10;
    return (
      <svg className="w-full h-16 bg-white p-1 rounded" viewBox="0 0 320 60">
        {bars.map((bar, idx) => {
          const x = currentX;
          currentX += bar.width * 2.2;
          if (!bar.isBlack) return null;
          return (
            <rect
              key={idx}
              x={x}
              y={5}
              width={bar.width * 2}
              height={50}
              fill="#000000"
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white font-serif">
              ዲጂታል መታወቂያ ካርዶች (Police & Fayda IDs)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            የፖሊስ አባላት መታወቂያ (ከጀርባ ባርኮድ ያለው) እና የዜጎች የፋይዳ ዲጂታል መታወቂያ
          </p>
        </div>

        <button
          onClick={() => setIsIdSystemModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer"
        >
          <CreditCard className="w-4 h-4" />
          <span>የዲጂታል መታወቂያ ሲስተም ቋት (Open ID Registry)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CARD 1: Ethiopian Police Officer Digital ID Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                የፖሊስ ዲጂታል መታወቂያ (ፊት እና ጀርባ)
              </span>

              {/* Staff Selector */}
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1 outline-none"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.rank} {s.fullName} ({s.badgeNumber})
                  </option>
                ))}
              </select>
            </div>

            {/* The Badge Card with Exact Official BGR Police Digital ID System */}
            {selectedStaff && (
              <div className="w-full max-w-sm sm:max-w-md mx-auto my-2">
                <PoliceIdCard staff={selectedStaff} settings={settings} />
              </div>
            )}

            {/* Quick Action Controls */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                <span>{isFlipped ? 'የፊት ገጹን አሳይ' : 'የጀርባውን ባርኮድ አሳይ (Flip)'}</span>
              </button>

              {onSimulateScan && selectedStaff && (
                <button
                  onClick={() => onSimulateScan(selectedStaff.badgeNumber)}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  <Scan className="w-4 h-4" />
                  <span>ስካን አድርግ (Scan Badge)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CARD 2: Ethiopian Citizen Fayda Digital ID Card (ፋይዳ ዲጂታል መታወቂያ) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-4 h-4" />
                የፋይዳ ዲጂታል መታወቂያ (Fayda National ID)
              </span>

              {/* Citizen selector */}
              <select
                value={selectedFaydaIdx}
                onChange={(e) => setSelectedFaydaIdx(Number(e.target.value))}
                className="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1 outline-none"
              >
                {SAMPLE_FAYDA_CITIZENS.map((c, idx) => (
                  <option key={c.faydaId} value={idx}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Fayda Card View */}
            <div className="w-full max-w-sm mx-auto aspect-[1.58/1] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 border-2 border-emerald-500/70 p-4 flex flex-col justify-between relative select-none">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs">
                      ፋይዳ
                    </div>
                    <div>
                      <span className="text-[11px] font-extrabold text-white block leading-tight">
                        የኢትዮጵያ ፌዴራላዊ ዲሞክራሲያዊ ሪፐብሊክ
                      </span>
                      <span className="text-[8px] text-emerald-400 font-bold tracking-wider">
                        FAYDA DIGITAL NATIONAL ID
                      </span>
                    </div>
                  </div>
                  <img src="https://flagcdn.com/w40/et.png" alt="ET Flag" className="h-3 rounded" />
                </div>
              </div>

              {/* Citizen Details & QR Code */}
              <div className="flex items-center justify-between gap-3 my-1">
                <div className="leading-tight">
                  <span className="text-[9px] text-slate-400 block">የባለጉዳዩ ሙሉ ስም / Full Name</span>
                  <h4 className="text-sm font-black text-white">{selectedCitizen.fullName}</h4>

                  <span className="text-[9px] text-slate-400 block mt-1">የፋይዳ መለያ ቁጥር (FIN)</span>
                  <span className="font-mono text-xs font-black text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 inline-block">
                    {selectedCitizen.faydaId}
                  </span>

                  <span className="text-[9px] text-slate-400 block mt-1 truncate max-w-[180px]">
                    ጉዳይ: {selectedCitizen.purpose}
                  </span>
                </div>

                {/* Simulated QR Code for Fayda */}
                <div className="w-20 h-20 bg-white p-1.5 rounded-xl shadow-lg shrink-0 flex items-center justify-center border-2 border-emerald-500">
                  <div className="w-full h-full bg-slate-950 rounded flex flex-col items-center justify-center p-1 text-center">
                    <QrCode className="w-10 h-10 text-white" />
                    <span className="text-[7px] text-emerald-400 font-bold mt-0.5">FAYDA QR</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-800">
                <span>የብሔራዊ መታወቂያ ፕሮግራም</span>
                <span className="font-mono text-emerald-400 font-bold">VERIFIED</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => handleCopy(selectedCitizen.faydaId)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer"
              >
                {copiedCode === selectedCitizen.faydaId ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>ኮድ ቅዳ</span>
              </button>

              {onSimulateScan && (
                <button
                  onClick={() => onSimulateScan(selectedCitizen.faydaId)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  <Scan className="w-4 h-4" />
                  <span>ስካን አድርግ (Fayda Scan)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Central Police ID System Modal */}
      <PoliceIdSystemModal
        isOpen={isIdSystemModalOpen}
        onClose={() => setIsIdSystemModalOpen(false)}
        staffList={staffList}
        settings={settings}
        onScanTest={onSimulateScan}
      />
    </div>
  );
};
