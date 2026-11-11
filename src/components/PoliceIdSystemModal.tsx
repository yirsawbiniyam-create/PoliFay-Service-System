import React, { useState } from 'react';
import {
  Shield,
  Search,
  Plus,
  Eye,
  CheckCircle2,
  Printer,
  X,
  CreditCard,
  User,
  Phone,
  Calendar,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Staff, CommissionSettings } from '../types';
import { PoliceIdCard } from './PoliceIdCard';

interface PoliceIdSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: Staff[];
  settings: CommissionSettings;
  onScanTest?: (badgeOrId: string) => void;
}

export const PoliceIdSystemModal: React.FC<PoliceIdSystemModalProps> = ({
  isOpen,
  onClose,
  staffList,
  settings,
  onScanTest,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffList[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'card_view' | 'member_list'>('card_view');

  if (!isOpen) return null;

  const currentStaff =
    staffList.find((s) => s.id === selectedStaffId || (s.idNumber && s.idNumber === selectedStaffId)) ||
    staffList[0];

  const filteredStaff = staffList.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.fullNameEn && s.fullNameEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.idNumber && s.idNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.badgeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rank.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  የቤንሻንጉል ጉምዝ ክልል ፖሊስ ኮሚሽን የዲጂታል መታወቂያ ሲስተም
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30 hidden sm:inline-block">
                  የተገናኘ ቋት (Connected System)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                የፖሊስ አባላት ዲጂታል መታወቂያ፣ የባርኮድ/QR ማረጋገጫ እና ሙሉ መረጃ ቋት
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('card_view')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'card_view'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>የመታወቂያ ካርድ እይታ (ID Card View)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('member_list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'member_list'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>የአባላት ሙሉ ዝርዝር ({staffList.length})</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ስም፣ ባጅ ወይም መለያ ቁጥር ፈልግ..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-900/60">
          {activeTab === 'card_view' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Member Selector List */}
              <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-3 max-h-[500px] overflow-y-auto space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                  የፖሊስ አባላት ({filteredStaff.length})
                </span>

                {filteredStaff.map((st) => {
                  const isSelected = (st.idNumber || st.id) === (currentStaff.idNumber || currentStaff.id);
                  return (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStaffId(st.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                          : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            st.photoUrl ||
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
                          }
                          alt={st.fullName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-amber-400/80"
                        />
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>{st.fullName}</span>
                          </div>
                          <span className="text-[10px] text-amber-300/90 block">
                            {st.rank} • {st.idNumber || st.id}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {st.departmentName}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Interactive ID Card & Complete Details */}
              <div className="lg:col-span-7 flex flex-col items-center">
                {/* The Front/Back Card */}
                <PoliceIdCard staff={currentStaff} settings={settings} />

                {/* Complete System Details Box */}
                <div className="w-full max-w-[420px] mt-4 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-amber-400">ሙሉ የአባል መረጃ (System Record)</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-bold">
                      ህጋዊ የኮሚሽኑ አባል
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">መለያ ቁጥር (ID NO):</span>
                      <span className="font-mono font-bold text-white">
                        {currentStaff.idNumber || currentStaff.id}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">ባጅ ቁጥር (Badge NO):</span>
                      <span className="font-bold text-white">{currentStaff.badgeNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">ስም (English):</span>
                      <span className="font-bold text-slate-200">
                        {currentStaff.fullNameEn || currentStaff.fullName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">ማዕረግ (English):</span>
                      <span className="font-bold text-slate-200">
                        {currentStaff.rankEn || currentStaff.rank}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">የደም አይነት / ጾታ:</span>
                      <span className="font-bold text-red-400">
                        {currentStaff.bloodType || 'O+'} • {currentStaff.gender || 'ወ / M'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">ቁመት / መልክ:</span>
                      <span className="font-bold text-slate-200">
                        {currentStaff.height || '1.75m'} • {currentStaff.complexion || 'ጠይም'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">ስልክ ቁጥር:</span>
                      <span className="font-bold text-blue-400">{currentStaff.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">የአደጋ ጊዜ ተጠሪ:</span>
                      <span className="font-bold text-slate-200">
                        {currentStaff.emergencyContactName || 'የቅርብ ቤተሰብ'} (
                        {currentStaff.emergencyContactPhone || '0911000000'})
                      </span>
                    </div>
                  </div>

                  {/* Test Scan Button */}
                  {onScanTest && (
                    <div className="pt-2 border-t border-slate-800 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          onScanTest(currentStaff.idNumber || currentStaff.id);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>ይህንን መታወቂያ ስካን አድርግ (Test Scan Now)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Member List Table View */
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">ፎቶ</th>
                    <th className="py-3 px-4">መለያ ቁጥር / ID</th>
                    <th className="py-3 px-4">ሙሉ ስም</th>
                    <th className="py-3 px-4">ማዕረግ</th>
                    <th className="py-3 px-4">የስራ ሂደት / ኃላፊነት</th>
                    <th className="py-3 px-4">ስልክ</th>
                    <th className="py-3 px-4 text-right">እርምጃ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStaff.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-2.5 px-4">
                        <img
                          src={
                            st.photoUrl ||
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
                          }
                          alt={st.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-amber-400"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-amber-300">
                        {st.idNumber || st.id}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-white">
                        {st.fullName}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {st.fullNameEn}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-200">
                        <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                          {st.rank}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">
                        {st.responsibilityAm || st.departmentName}
                      </td>
                      <td className="py-2.5 px-4 text-blue-400">{st.phone}</td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStaffId(st.id);
                            setActiveTab('card_view');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-colors cursor-pointer"
                        >
                          ካርድ እይ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            የቤንሻንጉል ጉምዝ ክልል ፖሊስ ኮሚሽን ይፋዊ ዲጂታል መታወቂያ ሲስተም • በቅጽበት የተሳሰረ
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors cursor-pointer"
          >
            ዝጋ
          </button>
        </div>
      </div>
    </div>
  );
};
