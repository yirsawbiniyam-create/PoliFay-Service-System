import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  User,
  CheckCircle2,
  Calendar,
  Phone,
  QrCode,
  RotateCw,
  Printer,
  Award,
} from 'lucide-react';
import { Staff, CommissionSettings } from '../types';
import {
  BENISHANGUL_GUMUZ_POLICE_LOGO_SVG,
  BENISHANGUL_GUMUZ_FLAG_SVG,
  ETHIOPIAN_FLAG_SVG,
} from '../data/initialData';

interface PoliceIdCardProps {
  staff: Staff;
  settings?: CommissionSettings;
  showBackDefault?: boolean;
}

export const PoliceIdCard: React.FC<PoliceIdCardProps> = ({
  staff,
  settings,
  showBackDefault = false,
}) => {
  const [isFlipped, setIsFlipped] = useState(showBackDefault);

  const idNumber = staff.idNumber || staff.id || 'BGR-POL-1600001';
  const badgeNumber = staff.badgeNumber || 'POL-0192';
  const logo = settings?.logoUrl || BENISHANGUL_GUMUZ_POLICE_LOGO_SVG;
  const bgrFlag = settings?.regionalFlagUrl || BENISHANGUL_GUMUZ_FLAG_SVG;
  const ethFlag = settings?.flagUrl || ETHIOPIAN_FLAG_SVG;

  // QR Code URL
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    idNumber
  )}`;

  return (
    <div className="flex flex-col items-center select-none">
      {/* Flip View Toggle Controls */}
      <div className="flex items-center justify-between w-full max-w-[360px] sm:max-w-[420px] mb-2 px-1 text-xs">
        <span className="font-bold text-amber-300 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          {isFlipped ? 'የመታወቂያው ጀርባ (Card Back)' : 'የመታወቂያው ፊት (Card Front)'}
        </span>
        <button
          type="button"
          onClick={() => setIsFlipped(!isFlipped)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold transition-all cursor-pointer text-xs"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>{isFlipped ? 'ፊቱን አሳይ (Show Front)' : 'ጀርባውን አሳይ (Show Back)'}</span>
        </button>
      </div>

      {/* The Physical ID Card Container (CR80 standard aspect ratio ~85.6mm x 53.98mm) */}
      <div className="w-full max-w-[360px] sm:max-w-[420px] aspect-[85.6/53.98] rounded-2xl overflow-hidden shadow-2xl relative border-2 border-amber-400/80 transition-all duration-300">
        {!isFlipped ? (
          /* ==============================================================
             FRONT OF POLICE DIGITAL ID CARD
             ============================================================== */
          <div
            className="w-full h-full relative flex flex-col justify-between p-2.5 sm:p-3 text-slate-900"
            style={{
              background:
                'linear-gradient(135deg, #fef08a 0%, #fde047 35%, #fed7aa 65%, #fffbeb 100%)',
            }}
          >
            {/* Background Security Watermark Emblem */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
              <Shield className="w-48 h-48 text-blue-950" />
            </div>

            {/* Header: Flags and Police Logo */}
            <div className="relative z-10 flex items-center justify-between border-b border-black/10 pb-1">
              <img
                src={bgrFlag}
                alt="BGR Flag"
                className="h-5 sm:h-6 w-9 sm:w-11 object-cover rounded shadow-sm border border-black/20"
              />
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-white shadow-md border-2 border-amber-500 flex items-center justify-center -my-1.5">
                <img
                  src={logo}
                  alt="Police Seal"
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = BENISHANGUL_GUMUZ_POLICE_LOGO_SVG;
                  }}
                />
              </div>
              <img
                src={ethFlag}
                alt="ETH Flag"
                className="h-5 sm:h-6 w-9 sm:w-11 object-cover rounded shadow-sm border border-black/20"
              />
            </div>

            {/* Commission Title */}
            <div className="relative z-10 text-center -mt-0.5">
              <h2 className="text-[10px] sm:text-xs font-black tracking-tight text-black leading-tight">
                የቤንሻንጉል ጉምዝ ክልል ፖሊስ ኮሚሽን
              </h2>
              <h3 className="text-[7.5px] sm:text-[9px] font-extrabold uppercase tracking-tight text-slate-800 leading-none">
                Benishangul-Gumuz Region Police Commission
              </h3>
            </div>

            {/* Main Officer Body Details */}
            <div className="relative z-10 flex items-center gap-2 sm:gap-3 flex-1 my-1">
              {/* Left Column: Personnel Information */}
              <div className="flex-1 space-y-1">
                {/* ID Number pill */}
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/5 border border-black/15">
                  <span className="text-[7px] sm:text-[8px] font-bold text-slate-700 uppercase">
                    መለያ ቁጥር / ID NO:
                  </span>
                  <span className="text-[9px] sm:text-xs font-black text-black tracking-wider font-mono">
                    {idNumber}
                  </span>
                </div>

                {/* Full Name in Amharic & English */}
                <div className="p-1 sm:p-1.5 rounded-sm bg-white/70 border-l-3 border-blue-900 shadow-xs">
                  <span className="text-[6.5px] sm:text-[7.5px] font-black uppercase text-slate-700 block leading-none">
                    ሙሉ ስም / FULL NAME
                  </span>
                  <div className="text-[10px] sm:text-xs font-black text-black truncate leading-tight mt-0.5">
                    {staff.fullName}
                  </div>
                  <div className="text-[8px] sm:text-[9.5px] font-extrabold uppercase text-slate-800 truncate leading-none">
                    {staff.fullNameEn || staff.fullName}
                  </div>
                </div>

                {/* Rank & Responsibility */}
                <div className="grid grid-cols-2 gap-1 text-black">
                  <div className="bg-white/50 p-1 rounded">
                    <span className="text-[6.5px] sm:text-[7.5px] font-black uppercase text-slate-700 block leading-none">
                      ማዕረግ / RANK
                    </span>
                    <span className="text-[8.5px] sm:text-[10px] font-black truncate block leading-tight">
                      {staff.rank} {staff.rankEn ? `/ ${staff.rankEn}` : ''}
                    </span>
                  </div>
                  <div className="bg-white/50 p-1 rounded">
                    <span className="text-[6.5px] sm:text-[7.5px] font-black uppercase text-slate-700 block leading-none">
                      ኃላፊነት / DEPT
                    </span>
                    <span className="text-[8.5px] sm:text-[10px] font-black truncate block leading-tight">
                      {staff.responsibilityAm || staff.departmentName}
                    </span>
                  </div>
                </div>

                {/* Issue and Expiry */}
                <div className="flex items-center justify-between pt-0.5 border-t border-black/10 text-[7px] sm:text-[8px] font-bold text-slate-800">
                  <span>የተሰጠበት: {staff.issuedAt || '2026-01-10'}</span>
                  <span className="text-rose-700 font-black">
                    የሚያበቃበት: {staff.expiresAt || '2028-01-10'}
                  </span>
                </div>
              </div>

              {/* Right Column: Officer Photo */}
              <div className="w-20 sm:w-24 shrink-0 flex flex-col items-center">
                <div className="w-18 h-22 sm:w-22 sm:h-26 rounded-md overflow-hidden bg-white border-2 border-slate-400 shadow-md relative">
                  <img
                    src={
                      staff.photoUrl ||
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'
                    }
                    alt={staff.fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-blue-900/80 text-white text-[7px] font-black text-center py-0.2">
                    {badgeNumber}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Tricolor Accent Ribbon */}
            <div className="absolute bottom-0 inset-x-0 h-1.5 flex">
              <div className="h-full w-1/3 bg-[#009a44]"></div>
              <div className="h-full w-1/3 bg-[#fedd00]"></div>
              <div className="h-full w-1/3 bg-[#ef3340]"></div>
            </div>
          </div>
        ) : (
          /* ==============================================================
             BACK OF POLICE DIGITAL ID CARD
             ============================================================== */
          <div className="w-full h-full relative flex flex-col justify-between p-2.5 sm:p-3 bg-white text-slate-900">
            {/* Watermarked Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <img
                src={logo}
                alt="Watermark"
                className="w-36 h-36 object-contain filter contrast-150"
              />
            </div>

            {/* Notice Section */}
            <div className="relative z-10 border-b border-slate-200 pb-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="bg-red-600 text-white text-[7px] font-black px-1.5 py-0.2 rounded uppercase flex items-center gap-1">
                  <ShieldAlert className="w-2.5 h-2.5" />
                  <span>ማስታወቂያ / NOTICE</span>
                </div>
                <div className="flex-1 h-[1px] bg-red-600/30"></div>
              </div>
              <p className="text-[7px] sm:text-[7.5px] font-black text-black leading-tight text-justify">
                ይህንን መታወቂያ የያዘ የፖሊስ አባል ስለሆነ ህግን የማስከበር ስልጣን ተሰጥቶታል ፣ መታወቂያዉንም የማሳየት ግዴታ አለበት፡፡ መታወቂያው ቢጠፋ ወይም በሌላ ግለሰብ እጅ ቢገኝ በአቅራቢያው ለሚገኝ ፖሊስ ጣቢያ እንዲያስረክቡ እናሳስባለን፡፡
              </p>
              <p className="text-[6px] sm:text-[6.5px] font-bold italic text-slate-700 leading-tight mt-0.5 text-justify">
                The Bearer of this ID card is an authorized member of Police. If found, please return it to the nearest police station.
              </p>
            </div>

            {/* Officer Physical Attributes in 2 Lines */}
            <div className="relative z-10 py-1 border-b border-slate-200 text-[7px] sm:text-[8px] font-black">
              <div className="flex items-center justify-around gap-2 text-slate-800">
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[6px]">ፆታ / GENDER: </span>
                  <span className="text-black">{staff.gender || 'ወ / M'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[6px]">ቁመት / HEIGHT: </span>
                  <span className="text-black">{staff.height || '1.75m'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[6px]">መልክ / COMPLEXION: </span>
                  <span className="text-black">{staff.complexion || 'ጠይም (Brown)'}</span>
                </div>
              </div>
              <div className="flex items-center justify-around gap-2 mt-0.5 text-slate-800">
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[6px]">ስልክ / PHONE: </span>
                  <span className="text-blue-700">{staff.phone || '0911223344'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[6px]">የደም አይነት / BLOOD: </span>
                  <span className="text-red-600">{staff.bloodType || 'O+'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[6px]">ባጅ / BADGE: </span>
                  <span className="text-black">{badgeNumber}</span>
                </div>
              </div>
            </div>

            {/* Bottom: QR Code & Signatures */}
            <div className="relative z-10 flex items-center justify-between gap-2 pt-1 mt-auto">
              {/* QR Code */}
              <div className="flex flex-col items-center">
                <div className="p-0.5 bg-white border border-slate-300 rounded shadow-xs">
                  <img
                    src={qrUrl}
                    alt="ID QR"
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=BGR-POL';
                    }}
                  />
                </div>
                <span className="text-[6px] font-mono font-black text-black mt-0.5">
                  {idNumber}
                </span>
              </div>

              {/* Signatures */}
              <div className="flex-1 flex items-end justify-around">
                {/* Member Signature */}
                <div className="flex flex-col items-center">
                  <div className="h-6 sm:h-7 w-20 sm:w-24 border-b border-black/40 flex items-center justify-center italic font-serif text-slate-600 text-xs">
                    {staff.fullName.split(' ')[0]} ✍️
                  </div>
                  <span className="text-[5.5px] sm:text-[6.5px] font-black uppercase text-black mt-0.5">
                    የአባሉ ፊርማ (Member Sign)
                  </span>
                </div>

                {/* Commissioner Signature */}
                <div className="flex flex-col items-center">
                  <div className="h-6 sm:h-7 w-20 sm:w-24 border-b border-black/40 flex items-center justify-center font-serif text-blue-900 text-xs font-black">
                    ኮሚሽነር ✍️
                  </div>
                  <span className="text-[5.5px] sm:text-[6.5px] font-black uppercase text-black mt-0.5">
                    የኮሚሽነሩ ፊርማ (Commissioner)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
